import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topic: string }>
}) {
  const { topic: topicSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: topic } = await supabase
    .from('learn_topics')
    .select('*')
    .eq('slug', topicSlug)
    .single()

  if (!topic) notFound()

  const { data: lessons } = await supabase
    .from('learn_lessons')
    .select('id, slug, title, sort_order, xp_reward')
    .eq('topic_id', topic.id)
    .order('sort_order', { ascending: true })

  let completedSet = new Set<string>()
  if (user) {
    const { data: progress } = await supabase
      .from('learn_progress')
      .select('lesson_id')
      .eq('user_id', user.id)

    completedSet = new Set((progress || []).map((p) => p.lesson_id))
  }

  const done = (lessons || []).filter((l) => completedSet.has(l.id)).length

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <a
        href="/learn"
        className="inline-flex items-center gap-1 text-sm mb-6 hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}
      >
        ← Back to Learn
      </a>

      <div
        className="rounded-xl p-6 mb-6"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-4 mb-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: 'var(--input-bg)' }}
          >
            {topic.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {topic.title}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {done}/{lessons?.length || 0} lessons completed
            </p>
          </div>
        </div>
        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          {topic.description}
        </p>
      </div>

      {!lessons || lessons.length === 0 ? (
        <div className="text-center py-16">
          <p style={{ color: 'var(--text-secondary)' }}>No lessons in this topic yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => {
            const isCompleted = completedSet.has(lesson.id)
            return (
              <Link
                key={lesson.id}
                href={`/learn/${topic.slug}/${lesson.slug}`}
                className="flex items-center justify-between rounded-xl p-4 transition-all hover:scale-[1.01] hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  border: isCompleted
                    ? '1px solid rgba(34,197,94,0.4)'
                    : '1px solid var(--border-color)',
                }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: isCompleted
                        ? 'rgba(34,197,94,0.15)'
                        : 'var(--input-bg)',
                      color: isCompleted ? '#22c55e' : 'var(--text-muted)',
                    }}
                  >
                    {isCompleted ? '✓' : lesson.sort_order}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {lesson.title}
                    </p>
                  </div>
                </div>
                <span
                  className="text-xs whitespace-nowrap ml-3"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {lesson.xp_reward} XP
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
