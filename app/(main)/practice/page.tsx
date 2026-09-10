import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import RoomList from '@/components/practice/RoomList'
import { getPracticeRooms } from '@/app/actions/practice'

export const metadata: Metadata = { title: 'Labs', description: 'Invite-only challenge testing and learning spaces.' }

export default async function PracticePage() {
  const { rooms, isAdmin, error } = await getPracticeRooms()
  if (!isAdmin && !error && rooms.length === 0) redirect('/learn')
  return <main className="mx-auto max-w-5xl px-4 py-8">{error && <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{error}</p>}<RoomList rooms={rooms} isAdmin={false} /></main>
}
