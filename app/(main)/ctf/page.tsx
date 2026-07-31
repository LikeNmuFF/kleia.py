import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import CTFClient from './CTFClient'

export const metadata: Metadata = {
  title: 'CTF Challenges',
  description: 'Solve capture-the-flag challenges across web, crypto, forensics, binary exploitation, and misc categories. Compete on the leaderboard.',
}

async function getChallengeData(userId?: string) {
  const supabase = await createClient()

  const { data: challenges } = await supabase
    .from('ctf_challenges')
    .select('id, title, category, difficulty, points, hint, author, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (!challenges) return { challenges: [], solvedIds: [] }

  let solvedIds: string[] = []
  if (userId) {
    const { data: submissions } = await supabase
      .from('ctf_submissions')
      .select('challenge_id')
      .eq('user_id', userId)
      .eq('is_correct', true)

    if (submissions) {
      solvedIds = submissions.map(s => s.challenge_id)
    }
  }

  return { challenges, solvedIds }
}

export default async function CTFPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { challenges, solvedIds } = await getChallengeData(user?.id)

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <AnnouncementBanner />
      </div>
      <CTFClient challenges={challenges} solvedIds={solvedIds} />
    </>
  )
}
