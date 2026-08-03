'use client'

import { useEffect, useState } from 'react'

interface LessonLink {
  topic_id: string
  slug: string
  title: string
}

interface TopicLink {
  id: string
  slug: string
  title: string
  icon: string
}

export default function LearnLinkPicker({
  topics,
  lessons,
  defaultTopicSlug,
  defaultLessonSlug,
}: {
  topics: TopicLink[]
  lessons: LessonLink[]
  defaultTopicSlug?: string | null
  defaultLessonSlug?: string | null
}) {
  const [topicSlug, setTopicSlug] = useState(defaultTopicSlug || '')
  const [lessonSlug, setLessonSlug] = useState(defaultLessonSlug || '')

  const selectedTopic = topics.find((t) => t.slug === topicSlug)
  const topicLessons = selectedTopic
    ? lessons.filter((l) => l.topic_id === selectedTopic.id)
    : []

  useEffect(() => {
    setLessonSlug((prev) => {
      if (!selectedTopic) return ''
      const stillValid = topicLessons.some((l) => l.slug === prev)
      return stillValid ? prev : ''
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicSlug])

  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
        Linked lesson (optional)
      </label>
      <div className="grid grid-cols-2 gap-3">
        <select
          name="learn_topic_slug"
          className="input-field w-full"
          value={topicSlug}
          onChange={(e) => setTopicSlug(e.target.value)}
        >
          <option value="">— Topic —</option>
          {topics.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.icon} {t.title}
            </option>
          ))}
        </select>
        <select
          name="learn_lesson_slug"
          className="input-field w-full"
          value={lessonSlug}
          onChange={(e) => setLessonSlug(e.target.value)}
          disabled={!selectedTopic}
        >
          <option value="">— Lesson —</option>
          {topicLessons.map((l) => (
            <option key={l.slug} value={l.slug}>
              {l.title}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
        Points users to a lesson that teaches the technique for this challenge.
      </p>
    </div>
  )
}