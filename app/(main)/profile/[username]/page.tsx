import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ProfileHeader from '@/components/members/ProfileHeader'
import MessageButton from '@/components/members/MessageButton'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `@${username} — Kleia`,
    description: `View ${username}'s Kleia profile.`,
  }
}

export default async function MemberProfilePage({ params }: PageProps) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio, status, last_seen, current_streak, longest_streak, created_at, role')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwn = user?.id === profile.id

  const { data: ctfStats } = await supabase
    .from('ctf_leaderboard')
    .select('solved_challenges, total_points')
    .eq('user_id', profile.id)
    .single()

  const showCtf = (profile.role === 'user' || profile.role === 'special') && !!ctfStats

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/members"
          className="text-sm transition-colors hover:text-violet-400"
          style={{ color: 'var(--text-secondary)' }}
        >
          ← Back to Members
        </Link>
        {isOwn ? (
          <Link
            href="/profile"
            className="px-5 py-2.5 rounded-xl font-medium text-sm border transition-colors hover:border-violet-500/40"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            Edit profile
          </Link>
        ) : (
          <MessageButton userId={profile.id} />
        )}
      </div>

      <ProfileHeader profile={profile} />

      {showCtf && (
        <div className="mt-6 card">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>CTF Stats</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-xs">
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {ctfStats.solved_challenges}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Solved</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {ctfStats.total_points}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Points</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
