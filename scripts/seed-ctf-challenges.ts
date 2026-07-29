import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

function hashFlag(flag: string): string {
  return createHash('sha256').update(flag).digest('hex')
}

const ADMIN_ID = 'ea020b54-40fd-4c92-9c83-aa1d305a5de0'

const challenges = [
  {
    title: 'Base64 Basics',
    description: `Decode the following Base64 string to find the flag:

S0xFSUF7YjRzM182NF8xNV9uMHRfYzByMzV9

Hint: Use an online Base64 decoder or \`echo <string> | base64 -d\``,
    category: 'misc',
    difficulty: 'easy',
    points: 50,
    flag: 'KLEIA{b4s3_64_15_n0t_c0r35}',
    hint: 'Base64 often ends with "=" padding.',
  },
  {
    title: 'Hex Vibes',
    description: `Decode this hex string to reveal the flag:

4B4C4549417B6833785F34645F31355F6634305F35337D

Hint: Hex decoding — every two characters = one byte. Try \`echo <hex> | xxd -r -p\``,
    category: 'misc',
    difficulty: 'easy',
    points: 50,
    flag: 'KLEIA{h3x_4d_15_f40_53}',
    hint: 'Hex is base-16. Characters 0-9 and A-F.',
  },
  {
    title: 'Binary Whispers',
    description: `The flag is hidden in these binary digits:

01001011 01001100 01000101 01001001 01000001 01111011 01100010 01101001 01101110 00110001 01110010 01111001 01011111 01101101 00110100 01101011 00110101 01110011 01011111 01110011 00110011 01101110 01110011 00110011 01111101

Hint: 8 bits = 1 character. Convert each binary byte to its ASCII value.`,
    category: 'misc',
    difficulty: 'easy',
    points: 75,
    flag: 'KLEIA{bin1ry_m4k3s_s3ns3}',
    hint: '01000011 01101000 01100101 01100011 01101011 00100000 01000001 01010011 01000011 01001001 01001001 00100000 01110100 01100001 01100010 01101100 01100101',
  },
  {
    title: 'ROT13 Fun',
    description: `Apply ROT13 to this string:

XRYVN{e0g_1f_s0_rnfl_s0_sha}

ROT13 shifts each letter by 13 positions (A→N, B→O, etc.). It is symmetric — applying it twice gives the original.`,
    category: 'misc',
    difficulty: 'easy',
    points: 75,
    flag: 'KLEIA{r0t_1s_s0_easy_s0_fun}',
    hint: 'ROT13 only affects letters. Numbers and symbols stay unchanged.',
  },
  {
    title: 'Morse Code',
    description: `Decode this Morse code message:

-.- .-.. . .. .- .----. .-.. .--- .- -- . ... ... .- --. . ..-. .-.. .- --. .-.. .. -.- . ----- ..-. .. .-. ... -

Hint: Morse code uses dots (.) and dashes (-) separated by spaces for letters.`,
    category: 'misc',
    difficulty: 'easy',
    points: 100,
    flag: 'KLEIA{m0rs3_c0d3_fun}',
    hint: 'Try an online Morse code decoder or use a table: A=.-, B=-..., etc.',
  },
  {
    title: 'ASCII Decode',
    description: `Convert these ASCII decimal codes to characters:

75 76 69 73 65 123 97 115 99 49 49 95 49 115 95 99 48 48 108 95 109 52 110 125

Hint: ASCII assigns numbers 0-127 to characters. 'A' = 65, 'B' = 66, etc.`,
    category: 'misc',
    difficulty: 'easy',
    points: 100,
    flag: 'KLEIA{asc11_1s_c00l_m4n}',
    hint: 'Use `printf \'%c\' 75 76 69` or an ASCII table.',
  },
  {
    title: "Caesar's Secret",
    description: `Julius Caesar encrypted this with a shift of 3:

NOHLD{fdhvdu_1v_whuuleoh}

Shift each letter backward by 3 to decrypt. A→X, B→Y, C→Z, D→A, etc.`,
    category: 'misc',
    difficulty: 'medium',
    points: 175,
    flag: 'KLEIA{caesar_1v_terrible}',
    hint: 'Caesar cipher shifts the alphabet. With shift 3: D→A, E→B, F→C, etc.',
  },
  {
    title: 'Base32 Detective',
    description: `Decode this Base32 string:

JBSWY3DPEBXGSZJANF2XU===

Base32 uses A-Z and 2-7 (32 characters). Each 5 bits becomes one character.`,
    category: 'misc',
    difficulty: 'medium',
    points: 200,
    flag: 'KLEIA{b32_m4k3s_l0ng}',
    hint: 'Base32 is case-insensitive. Use `echo <string> | base32 -d` on Linux.',
  },
  {
    title: 'URL Puzzle',
    description: `Find the flag hidden in this URL-encoded string:

KLEIA%7Bur1_3nc0d1ng_1s_funny%7D

URL encoding uses % followed by two hex digits to represent special characters.`,
    category: 'misc',
    difficulty: 'medium',
    points: 225,
    flag: 'KLEIA{ur1_3nc0d1ng_1s_funny}',
    hint: 'The %7B = "{" and %7D = "}". Decode with `decodeURIComponent()` in JS or an online URL decoder.',
  },
  {
    title: 'Cascade',
    description: `Multi-layer decoding required. Start from this:

U0dWc2JHOGdSbWxzY3lCUVlXcHZJR0Z1WkNCU1pXeHBaR1VnZDJsMElITjFZbXBsWTNRZ2FXMXBJR0ZzYVdkdVp5QnVZVzFs

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
      console.error(`❌ ${c.title}: ${error.message}`)
    } else {
      console.log(`✅ [${c.difficulty}] ${c.title} (${c.points}pts) — flag: ${c.flag}`)
    }
  }

  console.log('\nDone!')
  process.exit(0)
}

main()
