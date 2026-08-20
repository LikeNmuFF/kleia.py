import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Supabase = Awaited<ReturnType<typeof createClient>>

/** Returns true when the current user's profile role is 'admin'. */
export async function isAdmin(supabase: Supabase): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin'
}

/**
 * Server-side guard for admin-only actions/routes.
 * Redirects unauthenticated users to /login and non-admins to /feed.
 * Returns the current user when authorized.
 */
export async function requireAdmin(supabase: Supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/feed')
  return user
}