import { createClient } from '@/lib/supabase/server'

const CATEGORY_ICONS: Record<string, string> = {
  web: '🌐',
  crypto: '🔐',
  pwn: '💥',
  forensics: '🔍',
  misc: '📌',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#eab308',
  hard: '#ef4444',
}

async function getChallengeData(userId?: string) {
  const supabase = await createClient()

  const { data: challenges } = await supabase
    .from('ctf_challenges')
    .select('id, title, category, difficulty, points, hint, created_at')
    .eq('is_active', true)
    .order('category', { ascending: true })

  if (!challenges) return []

  let solvedIds = new Set<string>()
  if (userId) {
    const { data: submissions } = await supabase
      .from('ctf_submissions')
      .select('challenge_id')
      .eq('user_id', userId)
      .eq('is_correct', true)

    if (submissions) {
      solvedIds = new Set(submissions.map(s => s.challenge_id))
    }
  }

  return challenges.map(c => ({
    ...c,
    solved: solvedIds.has(c.id),
  }))
}

export default async function CTFPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const challenges = await getChallengeData(user?.id)

  const grouped = challenges.reduce<Record<string, typeof challenges>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = []
    acc[c.category].push(c)
    return acc
  }, {})

  const categoryOrder = ['web', 'crypto', 'pwn', 'forensics', 'misc']

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Capture The Flag
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Solve challenges, capture flags, climb the leaderboard
        </p>
      </div>

      <div className="flex gap-4 mb-8">
        <a
          href="/ctf"
          className="px-4 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
        >
          Challenges
        </a>
        <a
          href="/ctf/leaderboard"
          className="px-4 py-2 rounded-lg font-medium text-sm"
          style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}
        >
          Leaderboard
        </a>
      </div>

      <div className="space-y-8">
        {categoryOrder.map(cat => {
          const catChallenges = grouped[cat]
          if (!catChallenges || catChallenges.length === 0) return null

          const solvedCount = catChallenges.filter(c => c.solved).length

          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
                <h2 className="text-lg font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                  {cat}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-muted)' }}>
                  {solvedCount}/{catChallenges.length} solved
                </span>
              </div>

              <div className="space-y-2">
                {catChallenges.map(challenge => (
                  <a
                    key={challenge.id}
                    href={`/ctf/${challenge.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.01]"
                    style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {challenge.solved && (
                          <span className="text-emerald-400 text-sm">✓</span>
                        )}
                        <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {challenge.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span
                          className="px-1.5 py-0.5 rounded font-medium"
                          style={{ color: DIFFICULTY_COLORS[challenge.difficulty], backgroundColor: `${DIFFICULTY_COLORS[challenge.difficulty]}15` }}
                        >
                          {challenge.difficulty}
                        </span>
                        {challenge.hint && <span>💡 hint available</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                        {challenge.points}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>pts</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )
        })}

        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--card-bg)' }}>
              <span className="text-2xl">🏴</span>
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No challenges yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Challenges will appear here once they are created.</p>
          </div>
        )}
      </div>
    </div>
  )
}
