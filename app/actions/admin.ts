'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { logEvent } from '@/lib/logEvent'
import { requireAdmin } from '@/lib/admin'

const FREE_TIER_BYTES = 500 * 1024 * 1024 // 500MB

export async function getDashboardStats() {
  const supabase = await createClient()
  await requireAdmin(supabase)

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
  await requireAdmin(supabase)

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
  await requireAdmin(supabase)

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

export async function getSecurityReports() {
  const supabase = await createClient()
  await requireAdmin(supabase)

  const [latestResult, historyResult] = await Promise.all([
    supabase
      .from('security_reports')
      .select('id, summary_markdown, critical_count, high_count, medium_count, low_count, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('security_reports')
      .select('id, critical_count, high_count, medium_count, low_count, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return {
    latest: latestResult.data ?? null,
    history: historyResult.data ?? [],
  }
}

export async function getSecurityEvents(limit = 50) {
  const supabase = await createClient()
  await requireAdmin(supabase)

  const [eventsResult, ipsResult, typesResult] = await Promise.all([
    supabase
      .from('security_events')
      .select('id, event_type, severity, source_ip, user_id, challenge_id, details, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('security_events')
      .select('source_ip')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('security_events')
      .select('event_type')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ])

  const ipCounts = new Map<string, number>()
  for (const row of ipsResult.data ?? []) {
    if (!row.source_ip) continue
    ipCounts.set(row.source_ip, (ipCounts.get(row.source_ip) ?? 0) + 1)
  }

  const typeCounts = new Map<string, number>()
  for (const row of typesResult.data ?? []) {
    typeCounts.set(row.event_type, (typeCounts.get(row.event_type) ?? 0) + 1)
  }

  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const row of eventsResult.data ?? []) {
    if (row.severity === 'critical') severityCounts.critical++
    else if (row.severity === 'high') severityCounts.high++
    else if (row.severity === 'medium') severityCounts.medium++
    else severityCounts.low++
  }

  const topIps = [...ipCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }))

  // Correlate each top IP with players seen from it (events_log pairs client_ip + user_id)
  const ipUserMap = new Map<string, { userId: string; username: string; lastSeen: string }[]>()
  if (topIps.length > 0) {
    const { data: ipRows } = await supabase
      .from('events_log')
      .select('client_ip, user_id, created_at, users:user_id (id, username)')
      .in('client_ip', topIps.map(t => t.ip))
      .not('user_id', 'is', null)
      .order('created_at', { ascending: false })

    for (const row of ipRows ?? []) {
      if (!row.client_ip || !row.user_id) continue
      const user = Array.isArray(row.users) ? row.users[0] : row.users
      const list = ipUserMap.get(row.client_ip) ?? []
      if (!list.some(u => u.userId === row.user_id)) {
        list.push({ userId: row.user_id, username: user?.username ?? 'unknown', lastSeen: row.created_at })
      }
      ipUserMap.set(row.client_ip, list)
    }
  }

  return {
    events: eventsResult.data ?? [],
    topIps,
    topTypes: [...typeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([type, count]) => ({ type, count })),
    severityCounts,
    ipUsers: Object.fromEntries(ipUserMap),
  }
}

export async function getAdminAnalytics() {
  const supabase = await createClient()
  await requireAdmin(supabase)

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalUsers },
    { count: totalPosts },
    { count: totalComments },
    { count: totalMessages },
    { count: postsToday },
    { count: newUsersThisWeek },
    { count: totalChallenges },
    { count: totalSolves },
    { data: recentPosts },
    { data: topStreaks },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('comments').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', today),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabase.from('ctf_challenges').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('ctf_submissions').select('*', { count: 'exact', head: true }).eq('correct', true),
    supabase.from('posts').select('id, content, created_at, author:profiles!posts_author_id_fkey(username, avatar_url)').order('created_at', { ascending: false }).limit(5),
    supabase.from('profiles').select('id, username, avatar_url, current_streak, longest_streak').gt('current_streak', 0).order('current_streak', { ascending: false }).limit(5),
  ])

  return {
    totalUsers: totalUsers ?? 0,
    totalPosts: totalPosts ?? 0,
    totalComments: totalComments ?? 0,
    totalMessages: totalMessages ?? 0,
    postsToday: postsToday ?? 0,
    newUsersThisWeek: newUsersThisWeek ?? 0,
    totalChallenges: totalChallenges ?? 0,
    totalSolves: totalSolves ?? 0,
    recentPosts: recentPosts ?? [],
    topStreaks: topStreaks ?? [],
  }
}

export async function getAdminUsers() {
  const supabase = await createClient()
  const user = await requireAdmin(supabase)

  const { data: users } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, role, status, last_seen, current_streak, longest_streak, created_at')
    .order('created_at', { ascending: false })

  return { users: users ?? [], currentUserId: user.id }
}

export async function updateUserRole(userId: string, role: string) {
  const supabase = await createClient()
  await requireAdmin(supabase)

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function resetUserStreak(userId: string) {
  const supabase = await createClient()
  await requireAdmin(supabase)

  const { error } = await supabase
    .from('profiles')
    .update({ current_streak: 0 })
    .eq('id', userId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function adjustUserScore(userId: string, score: number) {
  const supabase = await createClient()
  await requireAdmin(supabase)

  const { error } = await supabase
    .from('profiles')
    .update({ score_override: score })
    .eq('id', userId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteUser(userId: string) {
  const supabase = await createClient()
  await requireAdmin(supabase)

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function getAdminPosts() {
  const supabase = await createClient()
  await requireAdmin(supabase)

  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, created_at, author:profiles!posts_author_id_fkey(id, username, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(50)

  return { posts: posts ?? [] }
}

export async function deletePost(postId: string) {
  const supabase = await createClient()
  await requireAdmin(supabase)

  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function getAdminComments() {
  const supabase = await createClient()
  await requireAdmin(supabase)

  const { data: comments } = await supabase
    .from('comments')
    .select('id, content, created_at, author:profiles!comments_author_id_fkey(id, username, avatar_url), post:posts(id, content)')
    .order('created_at', { ascending: false })
    .limit(50)

  return { comments: comments ?? [] }
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  await requireAdmin(supabase)

  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) return { error: error.message }
  return { success: true }
}

// ============================================================
// Regex Golf Admin Actions
// ============================================================

export async function getAdminRegexPuzzles() {
  const supabase = await createClient()
  await requireAdmin(supabase)

  const { data: puzzles } = await supabase.rpc('get_admin_regex_puzzles')

  return { puzzles: (puzzles as Array<{
    id: string
    title: string
    description: string | null
    difficulty: string
    solution_regex: string
    match_strings: string[]
    reject_strings: string[]
    min_length: number | null
    xp_reward: number
    is_active: boolean
    created_at: string
  }>) ?? [] }
}

export async function createRegexPuzzle(data: {
  title: string
  description: string
  difficulty: string
  solution_regex: string
  match_strings: string[]
  reject_strings: string[]
  min_length?: number | null
  xp_reward: number
}) {
  const supabase = await createClient()
  await requireAdmin(supabase)

  if (!data.title.trim()) return { error: 'Title is required' }
  if (!data.solution_regex.trim()) return { error: 'Solution regex is required' }
  if (data.match_strings.length === 0) return { error: 'At least one match string is required' }
  if (data.reject_strings.length === 0) return { error: 'At least one reject string is required' }

  const { error } = await supabase
    .from('regex_golf_puzzles')
    .insert({
      title: data.title.trim(),
      description: data.description.trim() || null,
      difficulty: data.difficulty,
      solution_regex: data.solution_regex.trim(),
      match_strings: data.match_strings,
      reject_strings: data.reject_strings,
      min_length: data.min_length || null,
      xp_reward: data.xp_reward,
      is_active: true,
    })

  if (error) return { error: error.message }

  revalidatePath('/regex-golf')
  return { success: true }
}

export async function updateRegexPuzzle(id: string, data: Partial<{
  title: string
  description: string
  difficulty: string
  solution_regex: string
  match_strings: string[]
  reject_strings: string[]
  min_length: number | null
  xp_reward: number
  is_active: boolean
}>) {
  const supabase = await createClient()
  await requireAdmin(supabase)

  const { error } = await supabase
    .from('regex_golf_puzzles')
    .update(data)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/regex-golf')
  return { success: true }
}

export async function deleteRegexPuzzle(id: string) {
  const supabase = await createClient()
  await requireAdmin(supabase)

  const { error } = await supabase.from('regex_golf_puzzles').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/regex-golf')
  return { success: true }
}
