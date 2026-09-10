import type { Metadata } from 'next'
import RoomList from '@/components/practice/RoomList'
import { getPracticeRooms } from '@/app/actions/practice'

export const metadata: Metadata = { title: 'Private Practice', description: 'Invite-only challenge testing rooms.' }

export default async function PracticePage() {
  const { rooms, isAdmin, error } = await getPracticeRooms()
  return <main className="mx-auto max-w-5xl px-4 py-8">{error && <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{error}</p>}<RoomList rooms={rooms} isAdmin={isAdmin} /></main>
}
