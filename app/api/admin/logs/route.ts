import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { isAdmin } from '@/lib/admin'
import { checkNamedRateLimit, rateLimitResponse } from '@/lib/rate-limit'

interface NormalizedLog {
  id: string
  source: 'api' | 'security'
  timestamp: string
  label: string
  status: string
  message: string
  user_id: string | null
  client_ip: string | null
  details: Record<string, unknown> | null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isAdmin(supabase))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  const { allowed, retryAfter } = checkNamedRateLimit('admin-logs', ip, {
    windowMs: 60_000,
    maxRequests: 30,
  })
  if (!allowed && retryAfter) return rateLimitResponse(retryAfter)

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'error'
  const source = searchParams.get('source') || 'all'
  const search = searchParams.get('search') || ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
  const offset = (page - 1) * limit

  const svc = getServiceClient() as any
  const logs: NormalizedLog[] = []

  // Query events_log
  if (source === 'all' || source === 'api') {
    let query = svc
      .from('events_log')
      .select('id, endpoint, status, duration_ms, error_message, user_id, client_ip, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit + offset)

    if (status !== 'all') query = query.eq('status', status)
    if (search) query = query.or(`endpoint.ilike.%${search}%,error_message.ilike.%${search}%`)

    const { data, count } = await query
    if (data) {
      for (const row of data) {
        logs.push({
          id: row.id,
          source: 'api',
          timestamp: row.created_at,
          label: row.endpoint,
          status: row.status,
          message: row.error_message || '',
          user_id: row.user_id,
          client_ip: row.client_ip,
          details: { duration_ms: row.duration_ms },
        })
      }
    }
  }

  // Query security_events
  if (source === 'all' || source === 'security') {
    let query = svc
      .from('security_events')
      .select('id, event_type, severity, source_ip, user_id, details, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit + offset)

    if (status !== 'all') query = query.eq('severity', status)
    if (search) query = query.or(`event_type.ilike.%${search}%,details->>'hostname'.ilike.%${search}%`)

    const { data } = await query
    if (data) {
      for (const row of data) {
        logs.push({
          id: row.id,
          source: 'security',
          timestamp: row.created_at,
          label: row.event_type,
          status: row.severity,
          message: row.details?.hostname
            ? `Host: ${row.details.hostname}`
            : row.details?.url
              ? `URL: ${String(row.details.url).slice(0, 100)}`
              : '',
          user_id: row.user_id,
          client_ip: row.source_ip,
          details: row.details,
        })
      }
    }
  }

  // Sort merged results by timestamp descending
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const total = logs.length
  const paginated = logs.slice(offset, offset + limit)

  return NextResponse.json({ logs: paginated, total, page, limit })
}
