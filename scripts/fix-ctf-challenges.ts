import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

function hashFlag(flag: string): string {
  return createHash('sha256').update(flag).digest('hex')
}

const fixes: { title: string; flag: string; description?: string }[] = [
  {
    title: 'Binary Whispers',
    flag: 'KLEIA{bin1ry_m4k3s_s3ns3}',
    description: `The flag is hidden in these binary digits:

01001011 01001100 01000101 01001001 01000001 01111011 01100010 01101001 01101110 00110001 01110010 01111001 01011111 01101101 00110100 01101011 00110011 01110011 01011111 01110011 00110011 01101110 01110011 00110011 01111101

Hint: 8 bits = 1 character. Convert each binary byte to its ASCII value.`,
  },
  {
    title: 'ROT13 Fun',
    flag: 'KLEIA{r0t_1s_s0_easy_s0_fun}',
    description: `Apply ROT13 to this string:

XYRVN{e0g_1f_f0_rnfl_f0_sha}

ROT13 shifts each letter by 13 positions (A→N, B→O, etc.). It is symmetric — applying it twice gives the original.`,
  },
  {
    title: "Caesar's Secret",
    flag: 'KLEIA{caesar_1s_terrible}',
  },
  {
    title: 'Base32 Detective',
    flag: 'KLEIA{b32_m4k3s_l0ng}',
    description: `Decode this Base32 string:

JNGEKSKBPNRDGMS7NU2GWM3TL5WDA3THPU======

Base32 uses A-Z and 2-7 (32 characters). Each 5 bits becomes one character.`,
  },
  {
    title: 'Cascade',
    flag: 'KLEIA{m4ny_l4y3rs_b3tt3r_s3cur1ty}',
    description: `Multi-layer decoding required. Start from this:

NTg1OTUyNTY0ZTdiN2EzNDYxNmM1Zjc5MzQ2YzMzNjU2NjVmNmYzMzY3NjczMzY1NWY2NjMzNzA2ODY1MzE2NzZjN2Q=

Layer 1: Base64 → gives hex
Layer 2: Hex → gives ROT13
Layer 3: ROT13 → gives the flag

Good luck!`,
  },
]

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  for (const fix of fixes) {
    const update: Record<string, any> = { flag_hash: hashFlag(fix.flag) }
    if (fix.description) update.description = fix.description

    const { error } = await supabase
      .from('ctf_challenges')
      .update(update)
      .eq('title', fix.title)

    if (error) {
      console.error(`FAIL ${fix.title}: ${error.message}`)
    } else {
      console.log(`OK ${fix.title} → ${fix.flag}`)
    }
  }

  console.log('Done!')
  process.exit(0)
}

main()
