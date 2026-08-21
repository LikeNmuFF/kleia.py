'use server'

import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'

interface SendResult {
  email: string
  ok: boolean
  error?: string
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured.')
  }
  return new Resend(apiKey)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_RECIPIENTS = 500
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kleia.site'
const LOGO_URL = `${SITE_URL}/logo.png`

function buildEmailHtml(subject: string, bodyLines: string[]): string {
  const paragraphs = bodyLines
    .map(line => {
      const safe = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      if (!line.trim()) return ''
      // Detect lines that look like section headers (ALL CAPS or ending with colon)
      if (/^[A-Z][A-Z\s]+:?$/.test(line.trim()) || /^[A-Z][A-Z\s]+$/i.test(line.trim())) {
        return `<h3 style="margin:24px 0 8px 0; font-size:13px; font-weight:700; color:#a78bfa; letter-spacing:1.5px; text-transform:uppercase;">${safe}</h3>`
      }
      // Detect lines that start with bullet points
      if (/^\s*-\s/.test(line)) {
        return `<p style="margin:0 0 6px 0; line-height:1.6; color:#e4e4e7; padding-left:16px;">&bull; ${safe.replace(/^-\s*/, '')}</p>`
      }
      return `<p style="margin:0 0 12px 0; line-height:1.7; color:#d4d4d8;">${safe}</p>`
    })
    .filter(Boolean)
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0; padding:0; background-color:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a; padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
          <!-- Logo -->
          <tr>
            <td align="left" style="padding-bottom:40px;">
              <a href="${SITE_URL}" style="text-decoration:none;">
                <img src="${LOGO_URL}" alt="Kleia" width="100" style="display:block; height:auto; opacity:0.95;" />
              </a>
            </td>
          </tr>
          <!-- Accent Line -->
          <tr>
            <td style="padding-bottom:32px;">
              <div style="width:48px; height:3px; background: linear-gradient(90deg, #a78bfa, #22c55e); border-radius:2px;"></div>
            </td>
          </tr>
          <!-- Subject -->
          <tr>
            <td style="padding-bottom:28px;">
              <h1 style="margin:0; font-size:28px; font-weight:800; color:#fafafa; letter-spacing:-0.8px; line-height:1.3;">
                ${subject.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
              </h1>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding-bottom:28px;">
              <div style="width:100%; height:1px; background-color:#27272a;"></div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="font-size:15px; color:#d4d4d8; line-height:1.7;">
              ${paragraphs}
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding-top:36px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #a78bfa, #7c3aed); border-radius:10px;">
                    <a href="${SITE_URL}/signup" style="display:inline-block; padding:14px 36px; color:#ffffff; font-weight:700; font-size:14px; text-decoration:none; letter-spacing:0.3px;">
                      Join Kleia &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top:48px;">
              <div style="width:100%; height:1px; background-color:#27272a; margin-bottom:24px;"></div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0; font-size:12px; color:#52525b; line-height:1.6;">
                      You received this because you were invited to join Kleia.
                    </p>
                  </td>
                  <td align="right">
                    <p style="margin:0; font-size:12px; line-height:1.6;">
                      <a href="${SITE_URL}" style="color:#a78bfa; text-decoration:none;">kleia.site</a>
                      <span style="color:#3f3f46; padding:0 6px;">&middot;</span>
                      <a href="${SITE_URL}/unsubscribe" style="color:#a78bfa; text-decoration:none;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendInviteEmails(
  recipients: string[],
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string; sent: number; failed: number; results: SendResult[] }> {
  const supabase = await createClient()
  await requireAdmin(supabase)

  const cleanedSubject = subject.trim()
  const cleanedBody = body.trim()
  if (!cleanedSubject || !cleanedBody) {
    return { success: false, error: 'Subject and body are required.', sent: 0, failed: 0, results: [] }
  }

  const uniqueEmails = [...new Set(recipients.map(r => r.trim().toLowerCase()).filter(Boolean))]
  if (uniqueEmails.length === 0) {
    return { success: false, error: 'No valid recipient addresses provided.', sent: 0, failed: 0, results: [] }
  }
  if (uniqueEmails.length > MAX_RECIPIENTS) {
    return { success: false, error: `Too many recipients (max ${MAX_RECIPIENTS}).`, sent: 0, failed: 0, results: [] }
  }

  const invalid = uniqueEmails.filter(e => !EMAIL_RE.test(e))
  if (invalid.length > 0) {
    return { success: false, error: `Invalid email address(es): ${invalid.join(', ')}`, sent: 0, failed: 0, results: [] }
  }

  let resend: ReturnType<typeof getResend>
  try {
    resend = getResend()
  } catch (err) {
    return { success: false, error: (err as Error).message, sent: 0, failed: 0, results: [] }
  }

  const bodyLines = cleanedBody.split('\n')
  const htmlContent = buildEmailHtml(cleanedSubject, bodyLines)
  const textContent = `${cleanedBody}\n\nJoin here: ${SITE_URL}/signup`

  const results: SendResult[] = []
  let sent = 0
  let failed = 0

  for (const email of uniqueEmails) {
    try {
      const { error } = await resend.emails.send({
        from: `Kleia <noreply@kleia.site>`,
        to: email,
        subject: cleanedSubject,
        text: textContent,
        html: htmlContent,
        headers: {
          'List-Unsubscribe': `<${SITE_URL}/unsubscribe>`,
        },
      })
      if (error) {
        throw new Error(error.message)
      }
      sent++
      results.push({ email, ok: true })
      await supabase.from('email_logs').insert({
        subject: cleanedSubject,
        recipient: email,
        status: 'sent',
      })
    } catch (err) {
      failed++
      results.push({ email, ok: false, error: (err as Error).message })
      await supabase.from('email_logs').insert({
        subject: cleanedSubject,
        recipient: email,
        status: 'failed',
        error: (err as Error).message,
      })
    }
  }

  return { success: failed === 0, error: failed > 0 ? `${failed} email(s) failed to send.` : undefined, sent, failed, results }
}

export async function getEmailLogs() {
  const supabase = await createClient()
  await requireAdmin(supabase)

  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data
}
