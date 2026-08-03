'use client'

import { useState } from 'react'
import LessonMaterial from './LessonMaterial'
import LessonQuiz from './LessonQuiz'
import type { LearnLesson } from '@/lib/utils/learn'

export default function LessonTabs({
  lesson,
  topicSlug,
  alreadyCompleted,
}: {
  lesson: LearnLesson
  topicSlug: string
  alreadyCompleted: boolean
}) {
  const [tab, setTab] = useState<'learn' | 'quiz'>('learn')

  return (
    <div>
      {/* Tab switcher */}
      <div
        className="flex rounded-xl p-1 mb-4"
        style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)' }}
      >
        <button
          onClick={() => setTab('learn')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'learn' ? 'text-white' : ''
          }`}
          style={
            tab === 'learn'
              ? { background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }
              : { color: 'var(--text-secondary)' }
          }
        >
          📖 Learn
        </button>
        <button
          onClick={() => setTab('quiz')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'quiz' ? 'text-white' : ''
          }`}
          style={
            tab === 'quiz'
              ? { background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }
              : { color: 'var(--text-secondary)' }
          }
        >
          ✏️ Quiz
        </button>
      </div>

      {tab === 'learn' ? (
        <LessonMaterial material={lesson.material ?? []} />
      ) : (
        <LessonQuiz
          lesson={lesson}
          topicSlug={topicSlug}
          alreadyCompleted={alreadyCompleted}
        />
      )}
    </div>
  )
}
