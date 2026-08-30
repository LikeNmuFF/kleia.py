import { createClient } from '@/lib/supabase/server'
import FlagSubmitForm from './FlagSubmitForm'
import HintUnlockButton from './HintUnlockButton'
import ChallengeReviewForm from '@/components/ctf/ChallengeReviewForm'
import ChallengeReviews from '@/components/ctf/ChallengeReviews'
import AIFairPlayBanner from '@/components/ctf/AIFairPlayBanner'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#eab308',
  hard: '#ef4444',
}

const CATEGORY_ICONS: Record<string, string> = {
  web: '🌐',
  crypto: '🔐',
  forensics: '🔍',
  misc: '📌',
}

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: challenge } = await supabase
    .from('ctf_challenges')
    .select('id, title, description, category, difficulty, points, hint, hint_xp_cost, file_url, link_url, author, created_at, learn_topic_slug, learn_lesson_slug')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (!challenge) notFound()

  let learnLessonTitle: string | null = null
  if (challenge.learn_topic_slug && challenge.learn_lesson_slug) {
    const { data: topic } = await supabase
      .from('learn_topics')
      .select('id')
      .eq('slug', challenge.learn_topic_slug)
      .maybeSingle()

    if (topic) {
      const { data: lesson } = await supabase
        .from('learn_lessons')
        .select('title')
        .eq('topic_id', topic.id)
        .eq('slug', challenge.learn_lesson_slug)
        .maybeSingle()

      learnLessonTitle = lesson?.title ?? null
    }
  }

  let solved = false
  if (user) {
    const { data: sub } = await supabase
      .from('ctf_submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('challenge_id', id)
      .eq('is_correct', true)
      .maybeSingle()

    solved = !!sub
  }

  let hintUnlocked = false
  if (user) {
    const { data: unlock } = await supabase
      .from('user_hint_unlocks')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('challenge_id', id)
      .maybeSingle()
    hintUnlocked = !!unlock
  }

  const { data: solveStats } = await supabase
    .from('ctf_challenge_solves')
    .select('solves')
    .eq('challenge_id', id)
    .maybeSingle()

  const solves = solveStats?.solves ?? 0

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link
        href="/ctf"
        className="inline-flex items-center gap-1 text-sm mb-6 hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}
      >
        ← Back to Challenges
      </Link>

      <AIFairPlayBanner />

        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-lg shrink-0">{CATEGORY_ICONS[challenge.category]}</span>
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
            <h1 className="text-xl sm:text-2xl font-bold break-words" style={{ color: 'var(--text-primary)' }}>
              {challenge.title}
            </h1>
            {challenge.author && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                by {challenge.author}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {challenge.points}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>points</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {solves} {solves === 1 ? 'player' : 'players'} solved
            </div>
          </div>
        </div>

        {solved && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium mb-4"
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              color: '#22c55e',
              border: '1px solid rgba(34, 197, 94, 0.25)',
            }}
          >
            <span>✓</span>
            You solved this challenge
          </div>
        )}

        <div className="my-6 pt-4 border-t whitespace-pre-wrap break-all leading-relaxed" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
          {challenge.description}
        </div>

        {solved && (
          <div className="mb-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <ChallengeReviews challengeId={challenge.id} />
          </div>
        )}

        {solved && (
          <div className="mb-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <ChallengeReviewForm challengeId={challenge.id} solved={solved} />
          </div>
        )}

        {learnLessonTitle && challenge.learn_topic_slug && challenge.learn_lesson_slug && (
          <div className="mb-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <Link
              href={`/learn/${challenge.learn_topic_slug}/${challenge.learn_lesson_slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(90deg, rgba(124,58,237,0.15), rgba(6,182,212,0.15))',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <span className="text-base">📖</span>
              Learn more: {learnLessonTitle}
            </Link>
          </div>
        )}

        {(challenge.file_url || challenge.link_url) && (
          <div className="flex flex-wrap gap-3 mb-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            {challenge.file_url && (
              <a
                href={challenge.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download File
              </a>
            )}
            {challenge.link_url && (
              <a
                href={challenge.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Visit Link
              </a>
            )}
          </div>
        )}

        {challenge.hint && (
          <HintUnlockButton
            challengeId={challenge.id}
            hintXpCost={challenge.hint_xp_cost ?? 0}
            hintText={challenge.hint}
            initiallyUnlocked={hintUnlocked}
          />
        )}

        <div className="mb-6 pt-4 border-t flex flex-wrap gap-3" style={{ borderColor: 'var(--border-color)' }}>
          <Link
            href={`/ctf/${challenge.id}/writeups`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(90deg, rgba(124,58,237,0.15), rgba(6,182,212,0.15))',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <span className="text-base">📝</span>
            {solved ? 'Write a Writeup' : 'View Writeups'}
          </Link>
        </div>

        <FlagSubmitForm challengeId={challenge.id} alreadySolved={solved} />
      </div>
    </div>
  )
}
