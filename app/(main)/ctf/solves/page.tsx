import type { Metadata } from 'next'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import RecentSolvesFeed from '@/components/ctf/RecentSolvesFeed'
import { getRecentGlobalSolves } from '@/app/actions/recent-global-solves'

export const metadata: Metadata = {
  title: 'Recent Solves',
  description: 'Public global solve log — see who recently solved CTF challenges.',
}

export default async function RecentSolvesPage() {
  const recentSolves = await getRecentGlobalSolves()

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-12">
      <AnnouncementBanner />

      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Recent Solves
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Live global solve log — who solved each public CTF challenge.
        </p>
      </div>

      <RecentSolvesFeed solves={recentSolves} />

      <p className="mt-8 text-sm" style={{ color: 'var(--text-muted)' }}>
        Want to try a challenge yourself?{' '}
        <a href="/ctf" style={{ color: 'var(--accent)' }}>Browse all challenges →</a>
      </p>
    </div>
  )
}