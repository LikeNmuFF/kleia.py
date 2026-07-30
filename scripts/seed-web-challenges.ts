import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

function hashFlag(flag: string): string {
  return createHash('sha256').update(flag).digest('hex')
}

const ADMIN_ID = 'ea020b54-40fd-4c92-9c83-aa1d305a5de0'

const challenges = [
  {
    title: 'Robots Exclusion',
    description: `Search engines use robots.txt to know which pages to crawl. Sometimes what they're told to avoid is exactly where the secrets are.

Visit https://www.kleia.site/robots.txt and find the flag.

The flag is hidden in plain sight — you just need to read the file.`,
    category: 'web',
    difficulty: 'easy',
    points: 100,
    flag: 'KLEIA{r0b0ts_d1s4ll0w_n0t_s0_s3cr3t}',
    hint: 'robots.txt is a plain text file. Try visiting /robots.txt on any website.',
  },
  {
    title: 'View Source',
    description: `The flag is hidden somewhere on this page. Can you find it?

Visit https://www.kleia.site/challenges/inspect and look around.

Hint: Your browser's developer tools can show you everything about a page. Right-click and select "Inspect" or press Ctrl+Shift+I.`,
    category: 'web',
    difficulty: 'easy',
    points: 75,
    flag: 'KLEIA{v13w_s0urc3_1s_y0ur_fr13nd}',
    hint: 'HTML comments (<!-- -->) are invisible on the page but visible in the source code.',
  },
]

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(`Deleting existing web challenges...`)
  const { error: delErr } = await supabase.from('ctf_challenges').delete().eq('category', 'web')
  if (delErr) {
    console.error(`Delete error: ${delErr.message}`)
  }

  console.log(`Inserting ${challenges.length} web challenges...\n`)

  for (const c of challenges) {
    const { error } = await supabase.from('ctf_challenges').insert({
      title: c.title,
      description: c.description,
      category: c.category,
      difficulty: c.difficulty,
      points: c.points,
      flag_hash: hashFlag(c.flag),
      hint: c.hint,
      status: 'approved',
      created_by: ADMIN_ID,
    })

    if (error) {
      console.error(`\u274c ${c.title}: ${error.message}`)
    } else {
      console.log(`\u2705 [${c.difficulty}] ${c.title} (${c.points}pts) \u2014 flag: ${c.flag}`)
    }
  }

  console.log('\nDone!')
  process.exit(0)
}

main()
