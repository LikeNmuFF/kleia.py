'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const FREE_TIER_BYTES = 500 * 1024 * 1024 // 500MB

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
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

export async function getDashboardStats() {
  const supabase = await createClient()
  await checkAdmin(supabase)

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

export async function getDatabaseUsage() {
  const supabase = await createClient()
  await checkAdmin(supabase)

  const [dbResult, tablesResult] = await Promise.all([
    supabase.rpc('get_db_size'),
    supabase.rpc('get_largest_tables', { limit_to: 5 }),
  ])

  const totalBytes = (dbResult.data as number) ?? 0
  const percentUsed = FREE_TIER_BYTES > 0 ? (totalBytes / FREE_TIER_BYTES) * 100 : 0

  // Auto-log if crossing 85%
  if (percentUsed >= 85) {
    const { data: { user } } = await supabase.auth.getUser()
    try {
      await supabase.from('events_log').insert({
        endpoint: 'admin.getDatabaseUsage',
        status: 'error',
        duration_ms: 0,
        error_message: `Database usage at ${percentUsed.toFixed(1)}% — approaching free tier limit`,
        user_id: user?.id,
      })
    } catch {
      // never break
    }
  }

  if (dbResult.error) {
    return { totalBytes: 0, percentUsed: 0, freeTierBytes: FREE_TIER_BYTES, largestTables: [], error: dbResult.error.message }
  }

  if (tablesResult.error) {
    return { totalBytes, percentUsed: Math.round(percentUsed * 100) / 100, freeTierBytes: FREE_TIER_BYTES, largestTables: [], error: tablesResult.error.message }
  }

  return {
    totalBytes,
    percentUsed: Math.round(percentUsed * 100) / 100,
    freeTierBytes: FREE_TIER_BYTES,
    largestTables: (tablesResult.data as Array<{ table_name: string; size_bytes: number }>) ?? [],
  }
}

export async function getCloudinaryUsage() {
  const supabase = await createClient()
  await checkAdmin(supabase)

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return { storage: null, bandwidth: null, transformations: null, error: 'Cloudinary API credentials not configured' }
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/usage`,
      { headers: { Authorization: `Basic ${auth}` } }
    )

    if (!res.ok) {
      return { storage: null, bandwidth: null, transformations: null, error: `Cloudinary API returned ${res.status}` }
    }

    const data = await res.json()

    return {
      storage: {
        used: data.storage?.used ?? 0,
        limit: data.storage?.limit ?? 0,
        percentUsed: data.storage?.limit
          ? Math.round((data.storage.used / data.storage.limit) * 10000) / 100
          : 0,
      },
      bandwidth: {
        used: data.bandwidth?.used ?? 0,
        limit: data.bandwidth?.limit ?? 0,
        percentUsed: data.bandwidth?.limit
          ? Math.round((data.bandwidth.used / data.bandwidth.limit) * 10000) / 100
          : 0,
      },
      transformations: {
        used: data.transformations?.used ?? 0,
        limit: data.transformations?.limit ?? 0,
        percentUsed: data.transformations?.limit
          ? Math.round((data.transformations.used / data.transformations.limit) * 10000) / 100
          : 0,
      },
    }
  } catch {
    return { storage: null, bandwidth: null, transformations: null, error: 'Failed to reach Cloudinary API' }
  }
}
