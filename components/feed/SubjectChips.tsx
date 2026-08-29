import type { FeedSubject } from '@/lib/feed/constants'

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

export default function SubjectChips({ subjects }: { subjects: FeedSubject[] }) {
  if (subjects.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {subjects.map((subject) => (
        <span
          key={subject}
          className="px-2 py-0.5 rounded-md text-[11px] font-medium border"
          style={{
            color: 'var(--text-muted)',
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--hover-bg)',
          }}
        >
          {LABELS[subject]}
        </span>
      ))}
    </div>
  )
}
