import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

export const challenges = JSON.parse(readFileSync(new URL('./data/osint-challenges.json', import.meta.url), 'utf8'))

export function challengeRow(challenge, adminId) {
  return {
    id: challenge.id,
    title: challenge.title,
    description: [
      '## Archived OSINT Lab',
      'All organizations, accounts, domains, and records below are fictional training evidence. The archive is complete for this question. Solve using this snapshot; no external browsing or contacting people is needed.',
      challenge.question,
      '### Evidence snapshot',
      '```json\n' + JSON.stringify(challenge.evidence, null, 2) + '\n```',
    ].join('\n\n'),
    category: 'osint',
    difficulty: challenge.difficulty,
    points: challenge.points,
    flag_hash: challenge.flag_hash,
    hint: challenge.hint,
    hint_points_cost: 10,
    created_by: adminId,
    author: 'Kleia OSINT Labs',
    status: 'approved',
    is_active: true,
    season_id: null,
  }
}

async function main() {
  if (challenges.length !== 10 || new Set(challenges.map(c => c.id)).size !== 10) throw new Error('Expected ten unique challenges')
  for (const c of challenges) {
    if (!/^[a-f0-9]{64}$/.test(c.flag_hash) || !c.question.includes('KLEIA{')) throw new Error(`Invalid challenge: ${c.title}`)
  }
  if (!process.argv.includes('--apply')) {
    console.log('Validated ten challenge records. Use --apply to seed missing records; existing challenges are never overwritten.')
    return
  }
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const { data: admin, error: adminError } = await db.from('profiles').select('id').eq('role', 'admin').eq('username', 'kleia').single()
  if (adminError || !admin) throw new Error('Could not resolve the Kleia administrator')
  const rows = challenges.map(c => challengeRow(c, admin.id))
  const { error } = await db.from('ctf_challenges').upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
  if (error) throw error
  const { data, error: readError } = await db.from('ctf_challenges').select('id, flag_hash, category, status, is_active').in('id', rows.map(c => c.id))
  if (readError || data?.length !== 10) throw new Error('Seed verification failed')
  for (const row of data) {
    if (row.flag_hash !== rows.find(c => c.id === row.id).flag_hash || row.category !== 'osint' || row.status !== 'approved' || !row.is_active) throw new Error(`Existing seed differs: ${row.id}`)
  }
  console.log('Verified ten active, approved OSINT challenges. Existing records preserved.')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
