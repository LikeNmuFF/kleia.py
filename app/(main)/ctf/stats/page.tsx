import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CTFStatsClient from './CTFStatsClient'

export const metadata = {
  title: 'My CTF Stats',
  description: 'Your CTF challenge statistics, progress, and solve history.',
}

export default async function CTFStatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: challenges } = await supabase
    .from('ctf_challenges')
    .select('id, title, category, difficulty, points')
    .eq('status', 'approved')
    .order('category', { ascending: true })

  const { data: submissions } = await supabase
    .from('ctf_submissions')
    .select('challenge_id, created_at')
    .eq('user_id', user.id)
    .eq('is_correct', true)
    .order('created_at', { ascending: false })

  const { data: leaderboard } = await supabase
    .from('ctf_leaderboard')
    .select('user_id, solved_challenges, total_points')
    .limit(200)

  const rank = leaderboard
    ? (leaderboard.findIndex(e => e.user_id === user.id) + 1) || null
    : null

  const userEntry = leaderboard?.find(e => e.user_id === user.id)

  return (
    <CTFStatsClient
      challenges={challenges ?? []}
      submissions={submissions ?? []}
      rank={rank}
      totalPlayers={leaderboard?.length ?? 0}
      userPoints={userEntry?.total_points ?? 0}
      userSolved={userEntry?.solved_challenges ?? 0}
    />
  )
}
