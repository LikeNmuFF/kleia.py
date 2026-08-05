import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load env
const envPath = resolve(process.cwd(), '.env.local')
try {
  const env = readFileSync(envPath, 'utf-8')
  for (const line of env.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
} catch { /* .env.local not found */ }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface Puzzle {
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  solution_regex: string
  match_strings: string[]
  reject_strings: string[]
  xp_reward: number
}

const PUZZLES: Puzzle[] = [
  // ===== EASY =====
  {
    title: 'Lowercase Letters',
    description: 'Match strings that contain only lowercase English letters.',
    difficulty: 'easy',
    solution_regex: '^[a-z]+$',
    match_strings: ['hello', 'world', 'code', 'regex', 'abc'],
    reject_strings: ['HELLO', 'World', '123', 'hello world', ''],
    xp_reward: 15,
  },
  {
    title: 'Digits Only',
    description: 'Match strings that contain only digits (0-9).',
    difficulty: 'easy',
    solution_regex: '^\\d+$',
    match_strings: ['0', '42', '12345', '999', '1'],
    reject_strings: ['-5', '12.34', 'abc', '1e5', ''],
    xp_reward: 15,
  },
  {
    title: 'No Spaces',
    description: 'Match strings that do not contain any whitespace characters.',
    difficulty: 'easy',
    solution_regex: '^\\S+$',
    match_strings: ['hello', 'world', '123', 'foo_bar', 'no-spaces'],
    reject_strings: ['hello world', ' foo', 'bar ', 'a b', ''],
    xp_reward: 15,
  },

  // ===== MEDIUM =====
  {
    title: 'Hex Colors',
    description: 'Match valid CSS hex color codes: # followed by exactly 3 or 6 hexadecimal digits.',
    difficulty: 'medium',
    solution_regex: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$',
    match_strings: ['#fff', '#ffffff', '#FFF', '#FFFFFF', '#a1b2c3', '#000'],
    reject_strings: ['ffffff', '#ffff', '#fffffff', '#gggggg', 'red', '#12'],
    xp_reward: 20,
  },
  {
    title: 'Dates (YYYY-MM-DD)',
    description: 'Match dates in ISO format with valid month (01-12) and day (01-31) ranges.',
    difficulty: 'medium',
    solution_regex: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$',
    match_strings: ['2024-01-15', '2000-12-31', '1999-06-01', '2024-02-29'],
    reject_strings: ['2024/01/15', '24-01-15', '2024-1-15', '2024-13-01', '2024-01-32', 'abcd-ef-gh'],
    xp_reward: 25,
  },
  {
    title: 'File Extensions',
    description: 'Match filenames ending with common extensions: .txt, .pdf, .png, .jpg, .csv',
    difficulty: 'medium',
    solution_regex: '^[a-zA-Z0-9_-]+\\.(txt|pdf|png|jpg|csv)$',
    match_strings: ['file.txt', 'doc.pdf', 'data.csv', 'photo.jpg', 'my_file.txt', 'image.png'],
    reject_strings: ['file', '.txt', 'file.', 'file.txt.bak', 'image.gif', 'doc.docx'],
    xp_reward: 20,
  },
  {
    title: 'Phone Numbers',
    description: 'Match US phone numbers in formats: 555-123-4567, 555.123.4567, or 5551234567',
    difficulty: 'medium',
    solution_regex: '^(\\d{3}[-.]?\\d{3}[-.]?\\d{4}|\\d{10})$',
    match_strings: ['555-123-4567', '555.123.4567', '5551234567', '800-555-0199'],
    reject_strings: ['555-123-456', '555-123-45678', 'abc-def-ghij', '555 123 4567', '123-45-6789'],
    xp_reward: 20,
  },
  {
    title: 'URLs (HTTP/HTTPS)',
    description: 'Match URLs starting with http:// or https://, with a domain and optional path.',
    difficulty: 'medium',
    solution_regex: '^https?://[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}(/.*)?$',
    match_strings: ['http://example.com', 'https://site.org', 'https://sub.domain.io/path', 'https://go.co'],
    reject_strings: ['ftp://file.com', 'example.com', 'http://', 'https://site', '://missing'],
    xp_reward: 25,
  },
  {
    title: 'Acronyms',
    description: 'Match exactly 3 uppercase English letters (like USA, FBI, CIA).',
    difficulty: 'medium',
    solution_regex: '^[A-Z]{3}$',
    match_strings: ['USA', 'FBI', 'CIA', 'ABC', 'XYZ'],
    reject_strings: ['us', 'US', 'United', '123', 'AB', 'ABCD', 'UsA'],
    xp_reward: 15,
  },

  // ===== HARD =====
  {
    title: 'Time (HH:MM)',
    description: 'Match 24-hour time in HH:MM format with valid hour (00-23) and minute (00-59) ranges.',
    difficulty: 'hard',
    solution_regex: '^([01]\\d|2[0-3]):[0-5]\\d$',
    match_strings: ['00:00', '12:30', '23:59', '09:05', '01:01'],
    reject_strings: ['24:00', '12:60', '9:05', '12:3', '123:45', 'ab:cd', '99:99'],
    xp_reward: 30,
  },
  {
    title: 'Email Addresses',
    description: 'Match simple email addresses: local@domain.tld (no special characters like spaces or @@).',
    difficulty: 'hard',
    solution_regex: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    match_strings: ['user@example.com', 'test.email@domain.org', 'hello+world@site.co', 'a@b.cc'],
    reject_strings: ['@example.com', 'user@', 'user@@example.com', 'user @example.com', 'user@.com'],
    xp_reward: 30,
  },
  {
    title: 'IPv4 Addresses',
    description: 'Match valid IPv4 addresses with each octet in range 0-255.',
    difficulty: 'hard',
    solution_regex: '^((25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]\\d|\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]\\d|\\d)$',
    match_strings: ['192.168.1.1', '0.0.0.0', '255.255.255.255', '10.0.0.1', '172.16.0.1'],
    reject_strings: ['192.168.1', '192.168.1.1.1', '256.0.0.1', 'abc.def.ghi.jkl', '1234.1.1.1'],
    xp_reward: 35,
  },
  {
    title: 'HTML Tags',
    description: 'Match simple HTML opening tags like <div>, <p>, <a> (no attributes).',
    difficulty: 'hard',
    solution_regex: '^<[a-z][a-z0-9]*>$',
    match_strings: ['<div>', '<p>', '<a>', '<span>', '<br>', '<h1>'],
    reject_strings: ['<div', 'div>', '<>', '<123>', '<div class="test">', '<>'],
    xp_reward: 30,
  },
  {
    title: 'Credit Card Numbers',
    description: 'Match 16-digit credit card numbers with optional spaces or dashes every 4 digits.',
    difficulty: 'hard',
    solution_regex: '^(\\d{4}[- ]?){3}\\d{4}$',
    match_strings: ['1234567890123456', '1234-5678-9012-3456', '1234 5678 9012 3456', '1234-5678 9012-3456'],
    reject_strings: ['123456789012345', '12345678901234567', '1234-5678-9012', 'abcd-efgh-ijkl-mnop', '1234.5678.9012.3456'],
    xp_reward: 35,
  },
  {
    title: 'Repeated Words',
    description: 'Match strings where a word is immediately repeated (like "the the" or "is is").',
    difficulty: 'hard',
    solution_regex: '^(\\w+)\\s+\\1$',
    match_strings: ['the the', 'is is', 'hello hello', 'a a', 'word word'],
    reject_strings: ['the this', 'is are', 'hello world', 'the the the', 'hello'],
    xp_reward: 35,
  },
]

async function seed() {
  console.log('Seeding regex golf puzzles...\n')

  // Check existing puzzles
  const { data: existing } = await supabase
    .from('regex_golf_puzzles')
    .select('title')

  const existingTitles = new Set((existing || []).map(p => p.title))

  let inserted = 0
  let skipped = 0

  for (const puzzle of PUZZLES) {
    if (existingTitles.has(puzzle.title)) {
      console.log(`  ⏭️  ${puzzle.title} (already exists)`)
      skipped++
      continue
    }

    const { error } = await supabase
      .from('regex_golf_puzzles')
      .insert({
        title: puzzle.title,
        description: puzzle.description,
        difficulty: puzzle.difficulty,
        solution_regex: puzzle.solution_regex,
        match_strings: puzzle.match_strings,
        reject_strings: puzzle.reject_strings,
        xp_reward: puzzle.xp_reward,
        is_active: true,
      })

    if (error) {
      console.error(`  ❌ ${puzzle.title}: ${error.message}`)
    } else {
      inserted++
      console.log(`  ✅ ${puzzle.title} (${puzzle.difficulty}, ${puzzle.xp_reward} XP)`)
    }
  }

  console.log(`\nDone! Inserted ${inserted}, skipped ${skipped}.`)
}

seed().catch(console.error)
