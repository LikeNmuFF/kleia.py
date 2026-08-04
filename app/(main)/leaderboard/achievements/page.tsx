import { createClient } from '@/lib/supabase/server'
import AchievementsClient from './AchievementsClient'

export const dynamic = 'force-dynamic'

export default async function AchievementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: leaderboard } = await supabase
    .from('achievement_leaderboard')
    .select('user_id, username, avatar_url, total_xp, badge_count, ctf_solved, writeup_count, review_count, achievement_score')
    .limit(100)

  return <AchievementsClient leaderboard={leaderboard || []} currentUserId={user?.id || null} />
}