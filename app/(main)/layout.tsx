import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/auth/LogoutButton'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/feed" className="text-xl font-bold text-blue-600">
            Kleia
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/feed" className="text-gray-600 hover:text-gray-900">Feed</Link>
            <Link href="/chat" className="text-gray-600 hover:text-gray-900">Chat</Link>
            <Link href="/events" className="text-gray-600 hover:text-gray-900">Events</Link>
            <Link href="/members" className="text-gray-600 hover:text-gray-900">Members</Link>
            <Link href="/study" className="text-gray-600 hover:text-gray-900">Study</Link>
            <Link href="/profile" className="text-gray-600 hover:text-gray-900">
              {user?.email}
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
