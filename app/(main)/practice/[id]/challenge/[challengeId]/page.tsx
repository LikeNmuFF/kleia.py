import { notFound } from 'next/navigation'
import { getPracticeRoom } from '@/app/actions/practice'
import PracticeChallengeDetail from '@/components/practice/PracticeChallengeDetail'

export default async function PracticeChallengePage({ params }: { params: Promise<{ id: string; challengeId: string }> }) {
  const { id, challengeId } = await params
  const data = await getPracticeRoom(id)
  if (!data) notFound()

  const challenge = data.challenges.find((item) => item.id === challengeId && item.room_id === id)
  if (!challenge) notFound()

  return <main className="mx-auto max-w-4xl px-4 py-8"><PracticeChallengeDetail data={data} challenge={challenge} /></main>
}
