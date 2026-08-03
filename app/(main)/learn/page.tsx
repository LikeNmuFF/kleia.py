import type { Metadata } from 'next'
import Link from 'next/link'
import { getLearnData } from '@/app/actions/learn'
import { getLevelInfo } from '@/lib/utils/learn'

export const metadata: Metadata = {
  title: 'Learn Python',
  description: 'Learn Python step by step with interactive lessons and quizzes. Earn XP as you go.',
}

export default async function LearnPage() {
  const { topics, lessons, completedLessonIds, totalXp } = await getLearnData()
  const levelInfo = getLevelInfo(totalXp)

  const lessonsByTopic: Record<string, typeof lessons> = {}
  for (const lesson of lessons) {
    if (!lessonsByTopic[lesson.topic_id]) lessonsByTopic[lesson.topic_id] = []
    lessonsByTopic[lesson.topic_id].push(lesson)
  }

  const completedSet = new Set(completedLessonIds)

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Learn Python 🐍
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Interactive lessons and quizzes. Complete lessons to earn XP and level up.
        </p>
      </div>

      {/* XP / Level card */}
      <div
        className="rounded-xl p-6 mb-8"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Level {levelInfo.level} · {levelInfo.name}
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {totalXp} XP
            </p>
          </div>
          <div className="flex-1 sm:max-w-md">
            {levelInfo.nextLevel ? (
              <>
                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                  <span>
                    {levelInfo.xpIntoLevel} / {levelInfo.xpForLevel} XP
                  </span>
                  <span>Next: {levelInfo.nextLevel}</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--input-bg)' }}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                    style={{ width: `${Math.round(levelInfo.progress * 100)}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Max level reached — you&apos;re a true Pythonista! 🎉
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Topics */}
      {topics.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: 'var(--card-bg)' }}
          >
            📚
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            No lessons yet
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Lessons will appear here soon.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {topics.map((topic) => {
            const topicLessons = lessonsByTopic[topic.id] || []
            const done = topicLessons.filter((l) => completedSet.has(l.id)).length
            const percent = topicLessons.length
              ? Math.round((done / topicLessons.length) * 100)
              : 0

            return (
              <Link
                key={topic.id}
                href={`/learn/${topic.slug}`}
                className="block rounded-xl p-5 transition-all hover:scale-[1.02] hover:shadow-lg"
                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: 'var(--input-bg)' }}
                  >
                    {topic.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {topic.title}
                    </h3>
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {topic.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--input-bg)' }}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {done}/{topicLessons.length} lessons
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
