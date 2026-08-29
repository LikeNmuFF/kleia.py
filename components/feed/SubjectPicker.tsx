'use client'

import { FEED_SUBJECTS, type FeedSubject } from '@/lib/feed/constants'

interface SubjectPickerProps {
  selected: FeedSubject[]
  onChange: (subjects: FeedSubject[]) => void
}

const LABELS: Record<FeedSubject, string> = {
  general: 'General',
  python: 'Python',
  linux: 'Linux',
  web: 'Web',
  crypto: 'Crypto',
  forensics: 'Forensics',
  career: 'Career',
  resources: 'Resources',
}

export default function SubjectPicker({ selected, onChange }: SubjectPickerProps) {
  const toggle = (subject: FeedSubject) => {
    onChange(
      selected.includes(subject)
        ? selected.filter((item) => item !== subject)
        : [...selected, subject]
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {FEED_SUBJECTS.map((subject) => {
        const active = selected.includes(subject)
        return (
          <button
            key={subject}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(subject)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors"
            style={{
              backgroundColor: active ? 'var(--accent)' : 'transparent',
              color: active ? 'var(--accent-text)' : 'var(--text-muted)',
              borderColor: active ? 'transparent' : 'var(--border-color)',
            }}
          >
            {LABELS[subject]}
          </button>
        )
      })}
    </div>
  )
}
