import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPracticeRoom } from '@/app/actions/practice'
import PracticeRoom from '@/components/practice/PracticeRoom'

export const metadata: Metadata = { title: 'Practice Room' }

export default async function PracticeRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getPracticeRoom(id)
  if (!data) notFound()
  return <main className="mx-auto max-w-5xl px-4 py-8"><PracticeRoom data={data} /></main>
}
