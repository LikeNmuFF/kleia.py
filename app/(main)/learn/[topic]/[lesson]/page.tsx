import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LessonTabs from '@/components/learn/LessonTabs'

const CATEGORY_ICONS: Record<string, string> = {
  web: '🌐',
  crypto: '🔐',
  forensics: '🔍',
  misc: '📌',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#eab308',
  hard: '#ef4444',
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ topic: string; lesson: string }>
}) {
  const { topic: topicSlug, lesson: lessonSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: topic } = await supabase
    .from('learn_topics')
    .select('id, slug, title, icon')
    .eq('slug', topicSlug)
    .single()

  if (!topic) notFound()

  const { data: lesson } = await supabase
    .from('learn_lessons')
    .select('*')
    .eq('topic_id', topic.id)
    .eq('slug', lessonSlug)
    .single()

  if (!lesson) notFound()

  let alreadyCompleted = false
  if (user) {
    const { data: progress } = await supabase
      .from('learn_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('lesson_id', lesson.id)
      .maybeSingle()

    alreadyCompleted = !!progress
  }

  const { data: relatedChallenges } = await supabase
    .from('ctf_challenges')
    .select('id, title, category, difficulty, points')
    .eq('learn_topic_slug', topicSlug)
    .eq('learn_lesson_slug', lessonSlug)
    .eq('status', 'approved')

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link
        href={`/learn/${topic.slug}`}
        className="inline-flex items-center gap-1 text-sm mb-6 hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}
      >
        ← {topic.title}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {topic.icon} {lesson.title}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Earn {lesson.xp_reward} XP · Answer every question correctly
        </p>
      </div>

      <LessonTabs
        lesson={lesson}
        topicSlug={topic.slug}
        alreadyCompleted={alreadyCompleted}
      />

      {relatedChallenges && relatedChallenges.length > 0 && (
        <div
          className="mt-6 rounded-xl p-6"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            🏆 Challenges that use this
          </h2>
          <div className="space-y-2">
            {relatedChallenges.map((c) => (
              <Link
                key={c.id}
                href={`/ctf/${c.id}`}
                className="flex items-center justify-between rounded-lg px-4 py-3 transition-all hover:scale-[1.01] hover:shadow-lg"
                style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg shrink-0">{CATEGORY_ICONS[c.category] || '📌'}</span>
                  <div className="min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {c.title}
                    </p>
                    <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                      {c.category} · {c.difficulty}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      color: DIFFICULTY_COLORS[c.difficulty] || 'var(--text-muted)',
                      backgroundColor: `${DIFFICULTY_COLORS[c.difficulty] || '#888'}15`,
                    }}
                  >
                    {c.points} pts
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
