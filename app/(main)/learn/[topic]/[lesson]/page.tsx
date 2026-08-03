import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LessonTabs from '@/components/learn/LessonTabs'

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
    </div>
  )
}
