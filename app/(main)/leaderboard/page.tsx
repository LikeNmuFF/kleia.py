import Link from 'next/link'
import { Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Avatar from '@/components/Avatar'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: leaderboard } = await supabase
    .from('activity_leaderboard')
    .select('user_id, username, avatar_url, current_streak, longest_streak, total_hours, post_count, activity_score')
    .order('activity_score', { ascending: false })
    .limit(100)

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Leaderboard
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Most active members, ranked by streak, posts, and engagement
        </p>
      </div>

      <div className="flex gap-4 mb-8">
        <Link
          href="/leaderboard"
          className="px-4 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
        >
          Activity
        </Link>
        <Link
          href="/ctf/leaderboard"
          className="px-4 py-2 rounded-lg font-medium text-sm"
          style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}
        >
          CTF
        </Link>
      </div>

      {leaderboard && leaderboard.length > 0 ? (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          {/* Table header */}
          <div
            className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3 text-xs font-medium uppercase tracking-wider"
            style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-muted)' }}
          >
            <div className="w-8 sm:w-10 text-center">#</div>
            <div className="flex-1">Member</div>
            <div className="w-10 sm:w-16 text-center">
              <span className="hidden sm:inline">Streak</span>
              <Flame className="w-3.5 h-3.5 sm:hidden text-orange-400" />
            </div>
            <div className="hidden sm:block w-20 text-center">Hours</div>
            <div className="hidden sm:block w-16 text-center">Posts</div>
            <div className="w-14 sm:w-20 text-right">Score</div>
          </div>

          {/* Table rows */}
          {leaderboard.map((entry, i) => {
            const isMe = user?.id === entry.user_id
            return (
              <Link
                key={entry.user_id}
                href={`/profile/${entry.username}`}
                className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3 border-t transition-colors"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: isMe ? 'rgba(139, 92, 246, 0.08)' : undefined,
                }}
              >
                <div className="w-8 sm:w-10 text-center">
                  {i === 0 ? (
                    <span className="text-lg">🥇</span>
                  ) : i === 1 ? (
                    <span className="text-lg">🥈</span>
                  ) : i === 2 ? (
                    <span className="text-lg">🥉</span>
                  ) : (
                    <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                  )}
                </div>

                <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    {entry.avatar_url ? (
                      <Avatar src={entry.avatar_url} size={32} />
                    ) : (
                      <span className="text-white text-xs font-medium">
                        {entry.username?.[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <span className="font-medium truncate text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                    {entry.username}
                    {isMe && (
                      <span className="ml-1.5 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                        you
                      </span>
                    )}
                  </span>
                </div>

                <div className="w-10 sm:w-16 text-center">
                  <span className="inline-flex items-center gap-1 text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    {entry.current_streak}
                  </span>
                </div>

                <div className="hidden sm:block w-20 text-center text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {Number(entry.total_hours).toFixed(1)}
                </div>

                <div className="hidden sm:block w-16 text-center text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {entry.post_count}
                </div>

                <div className="w-14 sm:w-20 text-right">
                  <span className="font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                    {entry.activity_score}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--card-bg)' }}>
            <span className="text-2xl">🔥</span>
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No activity yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Keep your streak alive to appear on the leaderboard!</p>
        </div>
      )}
    </div>
  )
}
