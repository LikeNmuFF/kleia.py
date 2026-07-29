import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminCTFClient from './AdminCTFClient'

export default async function AdminCTFPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  const { data: challenges } = await supabase
    .from('ctf_challenges')
    .select('id, title, description, category, difficulty, points, hint, is_active, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          CTF Admin
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Create, edit, and manage CTF challenges
        </p>
      </div>

      <AdminCTFClient challenges={challenges || []} />
    </div>
  )
}
