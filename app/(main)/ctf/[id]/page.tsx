import { createClient } from '@/lib/supabase/server'
import FlagSubmitForm from './FlagSubmitForm'
import { notFound } from 'next/navigation'

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#eab308',
  hard: '#ef4444',
}

const CATEGORY_ICONS: Record<string, string> = {
  web: '🌐',
  crypto: '🔐',
  pwn: '💥',
  forensics: '🔍',
  misc: '📌',
}

export default async function ChallengePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: challenge } = await supabase
    .from('ctf_challenges')
    .select('id, title, description, category, difficulty, points, hint, created_at')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!challenge) notFound()

  let solved = false
  if (user) {
    const { data: sub } = await supabase
      .from('ctf_submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('challenge_id', params.id)
      .eq('is_correct', true)
      .maybeSingle()

    solved = !!sub
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <a
        href="/ctf"
        className="inline-flex items-center gap-1 text-sm mb-6 hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}
      >
        ← Back to Challenges
      </a>

      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{CATEGORY_ICONS[challenge.category]}</span>
              <span className="text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-muted)' }}>
                {challenge.category}
              </span>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ color: DIFFICULTY_COLORS[challenge.difficulty], backgroundColor: `${DIFFICULTY_COLORS[challenge.difficulty]}15` }}
              >
                {challenge.difficulty}
              </span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {challenge.title}
            </h1>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {challenge.points}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>points</div>
          </div>
        </div>

        <div className="my-6 pt-4 border-t whitespace-pre-wrap leading-relaxed" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
          {challenge.description}
        </div>

        {challenge.hint && (
          <details className="mb-6">
            <summary className="text-sm cursor-pointer font-medium" style={{ color: 'var(--text-muted)' }}>
              💡 Show hint
            </summary>
            <p className="mt-2 text-sm p-3 rounded-lg" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              {challenge.hint}
            </p>
          </details>
        )}

        {solved ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-emerald-400 text-lg">✓</span>
            <span className="text-emerald-400 font-medium">Challenge solved!</span>
          </div>
        ) : (
          <FlagSubmitForm challengeId={challenge.id} />
        )}
      </div>
    </div>
  )
}
