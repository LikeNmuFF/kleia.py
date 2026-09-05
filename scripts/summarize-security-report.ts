/**
 * Reads combined-report.json, sends to Groq for summarization,
 * then inserts into Supabase security_reports table.
 *
 * Requires env vars: GROQ_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

interface AuditVulnerability {
  severity?: string
  via?: Array<string | { title?: string }>
  title?: string
}

interface AuditData {
  vulnerabilities?: Record<string, AuditVulnerability>
  metadata?: { vulnerabilities: { critical: number; high: number; medium: number; low: number } }
}

interface SemgrepFinding {
  check_id: string
  path: string
  start: { line: number }
  extra: { message: string; severity: string; metadata?: { cwe?: string[] } }
}

interface SemgrepData {
  results: SemgrepFinding[]
}

async function main() {
  const groqKey = process.env.GROQ_API_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!groqKey || !supabaseUrl || !serviceRoleKey) {
    console.error('Missing required env vars')
    process.exit(1)
  }

  if (!existsSync('combined-report.json')) {
    console.error('combined-report.json not found — run scans first')
    process.exit(1)
  }

  const report: { audit: AuditData; semgrep: SemgrepData } = JSON.parse(
    readFileSync('combined-report.json', 'utf8')
  )

  // Count severities
  const auditMeta = report.audit?.metadata?.vulnerabilities
  const critical = auditMeta?.critical ?? 0
  const high = auditMeta?.high ?? 0
  const medium = auditMeta?.medium ?? 0
  const low = auditMeta?.low ?? 0

  const semgrepResults = report.semgrep?.results ?? []
  const semgrepHigh = semgrepResults.filter(r => r.extra.severity === 'ERROR' || r.extra.severity === 'WARNING').length

  const totalCritical = critical
  const totalHigh = high + semgrepHigh
  const totalMedium = medium
  const totalLow = low

  // Build concise prompt for Groq
  const auditSummary = report.audit?.vulnerabilities
    ? Object.entries(report.audit.vulnerabilities).slice(0, 20).map(([name, v]) =>
        `- ${name}: ${v.severity || 'unknown'} — ${typeof v.via?.[0] === 'object' ? (v.via[0] as { title?: string }).title || name : name}`
      ).join('\n')
    : 'No npm audit vulnerabilities found'

  const semgrepSummary = semgrepResults.slice(0, 20).map(r =>
    `- ${r.check_id} (${r.extra.severity}) at ${r.path}:${r.start.line} — ${r.extra.message}`
  ).join('\n') || 'No Semgrep findings'

  const prompt = `You are a security engineer reviewing scan results for a Next.js + Supabase web app (kleia.py).

NPM AUDIT (${totalCritical} critical, ${totalHigh} high, ${totalMedium} medium, ${totalLow} low):
${auditSummary}

SEMGREP FINDINGS (${semgrepHigh} high/medium):
${semgrepSummary}

Write a concise security report in markdown with:
1. **Summary** — 1-2 sentences on overall security posture
2. **Top Issues** — list the 3-5 most important findings to fix, with severity and plain-English explanation
3. **False Positives** — note any findings likely to be false positives (e.g. test files, config defaults)
4. **Recommendations** — specific next steps

Be direct and practical. Skip boilerplate.`

  // Call Groq
  const groqRes = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  })

  if (!groqRes.ok) {
    const text = await groqRes.text()
    console.error('Groq API error:', groqRes.status, text)
    process.exit(1)
  }

  const groqData = await groqRes.json()
  const summary = groqData.choices?.[0]?.message?.content

  if (!summary) {
    console.error('No summary from Groq')
    process.exit(1)
  }

  // Insert into Supabase
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error: insertError } = await supabase.from('security_reports').insert({
    summary_markdown: summary,
    critical_count: totalCritical,
    high_count: totalHigh,
    medium_count: totalMedium,
    low_count: totalLow,
  })

  if (insertError) {
    console.error('Supabase insert error:', insertError.message)
    process.exit(1)
  }

  console.log('Security report saved successfully')
  console.log(`Summary: ${totalCritical}C / ${totalHigh}H / ${totalMedium}M / ${totalLow}L`)
}

main()
