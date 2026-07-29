'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/feed')

  const [
    { count: totalUsers },
    { count: totalPosts },
    { count: totalMessages },
    { count: totalCtfSubmissions },
    { data: recentErrors },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase.from('ctf_submissions').select('*', { count: 'exact', head: true }),
    supabase
      .from('events_log')
      .select('id, endpoint, error_message, duration_ms, user_id, created_at')
      .eq('status', 'error')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const endpointStats = await supabase.rpc('get_endpoint_stats', { since_hours: 24 })

  return {
    totalUsers: totalUsers ?? 0,
    totalPosts: totalPosts ?? 0,
    totalMessages: totalMessages ?? 0,
    totalCtfSubmissions: totalCtfSubmissions ?? 0,
    recentErrors: recentErrors ?? [],
    endpointStats: endpointStats.data ?? [],
  }
}
