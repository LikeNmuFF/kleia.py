import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "What's new",
  description: 'Recent product updates and improvements to Kleia.',
}

const releases = [
  {
    date: 'September 13, 2026',
    title: 'Private practice labs',
    items: [
      'Added individual challenge pages with flag submission, hints, attachments, lessons, feedback, and explanations.',
      'Added a private Hack4Gov-aligned preparation pack with 20 original challenges in Cl4ud3x_.',
    ],
  },
  {
    date: 'September 12, 2026',
    title: 'Safer challenge platform',
    items: [
      'Hardened authentication, uploads, authorization checks, and integrity-related actions.',
      'Improved user-facing error messages so internal details are not exposed.',
    ],
  },
  {
    date: 'September 10, 2026',
    title: 'Recent Solves feed',
    items: [
      'Added the public /ctf/solves feed with live polling and season activity.',
      'Added challenge sorting and refreshed CTF challenge cards.',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <Link href="/" className="text-sm hover:text-violet-400" style={{ color: 'var(--text-muted)' }}>← Back to Kleia</Link>
      <h1 className="mt-6 text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>What&apos;s new in Kleia</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>A record of recent features, fixes, and improvements.</p>
      <div className="mt-10 space-y-8">
        {releases.map((release) => (
          <article key={release.title} className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>{release.date}</p>
            <h2 className="mt-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{release.title}</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {release.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        ))}
      </div>
      <p className="mt-8 text-sm" style={{ color: 'var(--text-muted)' }}>Questions or suggestions? Visit <Link href="/feedback" className="underline underline-offset-2">Feedback</Link>. Read the <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.</p>
    </div>
  )
}
