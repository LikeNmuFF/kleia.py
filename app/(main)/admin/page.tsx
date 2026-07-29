import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Admin Dashboard
      </h1>
      <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
        Manage your Kleia instance
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/ctf"
          className="rounded-xl p-6 transition-all hover:scale-[1.02]"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mb-3">
            <span className="text-white text-lg">🏴</span>
          </div>
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            CTF Challenges
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Create, edit, and manage Capture The Flag challenges
          </p>
        </Link>
      </div>
    </div>
  )
}
