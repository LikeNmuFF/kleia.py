'use client'

import RegexGolfPuzzle from '@/components/ctf/RegexGolfPuzzle'

interface Puzzle {
  id: string
  title: string
  description: string | null
  match_strings: string[]
  reject_strings: string[]
  difficulty: string
  min_length: number | null
  xp_reward: number
  is_active: boolean
  created_at: string
}

interface Solve {
  puzzle_id: string
  submitted_regex: string
  regex_length: number
  time_seconds: number
  created_at: string
}

export default function RegexGolfClient({
  puzzles,
  solves,
}: {
  puzzles: Puzzle[]
  solves: Solve[]
}) {
  const solvedPuzzleIds = new Set(solves.map(s => s.puzzle_id))

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-16">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Regex Golf
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Write the shortest regex that matches the green strings and rejects the red strings.
        </p>
      </div>

      {puzzles.length === 0 ? (
        <div className="rounded-xl border p-8 text-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No puzzles available yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {puzzles.map(puzzle => (
            <RegexGolfPuzzle
              key={puzzle.id}
              puzzle={puzzle}
              solve={solves.find(s => s.puzzle_id === puzzle.id) || null}
              solved={solvedPuzzleIds.has(puzzle.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
