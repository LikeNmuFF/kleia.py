import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

function hashFlag(flag: string): string {
  return createHash('sha256').update(flag).digest('hex')
}

const ADMIN_ID = 'ea020b54-40fd-4c92-9c83-aa1d305a5de0'

const challenges = [
  // ============ EASY (5) ============
  {
    title: 'Base64 Basics',
    description: `Decode the following Base64 string to find the flag:

S0xFSUF7YjRzM182NF9qdXN0X2wzM3R9

Hint: Use an online Base64 decoder or \`echo <string> | base64 -d\``,
    category: 'misc',
    difficulty: 'easy',
    points: 50,
    flag: 'KLEIA{b4s3_64_just_l33t}',
    hint: 'Base64 often ends with "=" padding.',
  },
  {
    title: 'Hex Vibes',
    description: `Decode this hex string to reveal the flag:

4b4c4549417b6833785f345f6c3166335f6272307d

Hint: Hex decoding — every two characters = one byte. Try \`echo <hex> | xxd -r -p\``,
    category: 'misc',
    difficulty: 'easy',
    points: 50,
    flag: 'KLEIA{h3x_4_l1f3_br0}',
    hint: 'Hex is base-16. Characters 0-9 and A-F.',
  },
  {
    title: 'Binary 101',
    description: `The flag is hidden in these binary digits:

01001011 01001100 01000101 01001001 01000001 01111011 01100010 00110001 01101110 01011111 00110001 01110011 01011111 00110100 01011111 01100110 01110101 01101110 01011111 01110111 00110100 01111001 01111101

Hint: 8 bits = 1 character. Convert each binary byte to its ASCII value.`,
    category: 'misc',
    difficulty: 'easy',
    points: 75,
    flag: 'KLEIA{b1n_1s_4_fun_w4y}',
    hint: '01000011 01101000 01100101 01100011 01101011 00100000 01000001 01010011 01000011 01001001 01001001 00100000 01110100 01100001 01100010 01101100 01100101',
  },
  {
    title: 'ROT13 Fun',
    description: `Apply ROT13 to this string:

XYRVN{e0g_1f_f0_rnfl_e1tug}

ROT13 shifts each letter by 13 positions (A→N, B→O, etc.). It is symmetric — applying it twice gives the original.`,
    category: 'misc',
    difficulty: 'easy',
    points: 75,
    flag: 'KLEIA{r0t_1s_s0_easy_r1ght}',
    hint: 'ROT13 only affects letters. Numbers and symbols stay unchanged.',
  },
  {
    title: 'Morse Code',
    description: `Decode this Morse code message to find the flag:

-.-. .-. ....- -.-. -.- / - .... ...-- / -.-. ----- -.. ...--

Words are separated by '/'. Join the decoded words with underscores and wrap in KLEIA{...}.`,
    category: 'misc',
    difficulty: 'easy',
    points: 100,
    flag: 'KLEIA{cr4ck_th3_c0d3}',
    hint: 'Try an online Morse code decoder or use a table: A=.-, B=-..., etc.',
  },
  // ============ MEDIUM (4) ============
  {
    title: 'ASCII Decode',
    description: `Convert these ASCII decimal codes to characters:

75 76 69 73 65 123 97 115 99 105 105 95 109 52 107 51 115 95 115 51 110 115 51 95 97 103 52 49 110 125

Hint: ASCII assigns numbers 0-127 to characters. 'A' = 65, 'B' = 66, etc.`,
    category: 'misc',
    difficulty: 'medium',
    points: 125,
    flag: 'KLEIA{ascii_m4k3s_s3ns3_ag41n}',
    hint: 'Use \`printf "%c" 75 76 69\` or an ASCII table.',
  },
  {
    title: "Caesar's Return",
    description: `Julius Caesar encrypted this with a shift of 7:

RSLPH{j43z4y_1z_i4jr_d1ao_c3un34uj3}

Shift each letter backward by 7 to decrypt. A→T, B→U, C→V, D→W, etc.`,
    category: 'misc',
    difficulty: 'medium',
    points: 175,
    flag: 'KLEIA{c43s4r_1s_b4ck_w1th_v3ng34nc3}',
    hint: 'Caesar cipher shifts the alphabet. With shift 7: A→H, B→I, C→J but to decrypt you shift backward.',
  },
  {
    title: 'Base32 Fun',
    description: `Decode this Base32 string:

JNGEKSKBPNRDGMS7NU2HSX3TGMZW2X3MGBXGO7I=

Base32 uses A-Z and 2-7 (32 characters). Each 5 bits becomes one character.`,
    category: 'misc',
    difficulty: 'medium',
    points: 200,
    flag: 'KLEIA{b32_m4y_s33m_l0ng}',
    hint: 'Base32 is case-insensitive. Use \`echo <string> | base32 -d\` on Linux.',
  },
  {
    title: 'URL Puzzle',
    description: `Find the flag hidden in this URL-encoded string:

KLEIA%7Bur1_3nc0d3_1s_w31rd%7D

URL encoding uses % followed by two hex digits to represent special characters.`,
    category: 'misc',
    difficulty: 'medium',
    points: 225,
    flag: 'KLEIA{ur1_3nc0d3_1s_w31rd}',
    hint: 'The %7B = "{" and %7D = "}". Decode with \`decodeURIComponent()\` in JS or an online URL decoder.',
  },
  // ============ HARD (1) ============
  {
    title: 'Cascade',
    description: `Multi-layer decoding required. Start from this:

NTg1OTUyNTY0ZTdiN2EzNDYxNmM1Zjc5MzQ2YzMzNjU2NjVmNmYzMzY3NjczMzY1NWY2NjMzNzA2ODY1MzE2NzZjN2Q=

Layer 1: Base64 → gives hex
Layer 2: Hex → gives ROT13
Layer 3: ROT13 → gives the flag

Good luck!`,
    category: 'misc',
    difficulty: 'hard',
    points: 400,
    flag: 'KLEIA{m4ny_l4y3rs_b3tt3r_s3cur1ty}',
    hint: 'Work backwards: the Base64 decodes to hex characters, which decode to ROT13 text, which decodes to the flag.',
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

  console.log(`Deleting existing misc challenges...`)
  const { error: delErr } = await supabase.from('ctf_challenges').delete().eq('category', 'misc')
  if (delErr) {
    console.error(`Delete error: ${delErr.message}`)
    process.exit(1)
  }
  console.log(`Inserting ${challenges.length} misc challenges...\n`)

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
