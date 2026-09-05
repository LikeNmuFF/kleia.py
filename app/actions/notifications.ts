'use server'

import { createClient } from '@/lib/supabase/server'

export type NotificationType =
  | 'post_like'
  | 'post_comment'
  | 'peer_request'
  | 'peer_match'
  | 'badge_earned'
  | 'daily_mission'
  | 'spectator_invite'

export interface Notification {
  id: string
  actor_id: string | null
  type: NotificationType
  title: string
  message: string
  href: string
  metadata: Record<string, unknown>
  read_at: string | null
  created_at: string
}

async function currentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function createNotification(input: {
  recipientId: string
  actorId?: string | null
  type: NotificationType
  title: string
  message: string
  href: string
  metadata?: Record<string, unknown>
  dedupeKey?: string
}) {
  const { supabase, user } = await currentUser()
  if (!user) return { error: 'Not logged in' }
  if (user.id !== input.actorId && input.recipientId === user.id) {
    // Server-side callers may notify the current user about a system event.
  }
  const { error } = await supabase.rpc('create_notification', {
    p_recipient_id: input.recipientId,
    p_actor_id: input.actorId ?? null,
    p_type: input.type,
    p_title: input.title,
    p_message: input.message,
    p_href: input.href,
    p_metadata: { ...(input.metadata ?? {}), ...(input.dedupeKey ? { dedupe_key: input.dedupeKey } : {}) },
  })
  if (error) {
    console.error('createNotification failed', { type: input.type, error: error.message })
    return { error: error.message }
  }
  return { success: true }
}

export async function notifyUser(input: Parameters<typeof createNotification>[0]) {
  if (input.recipientId === input.actorId) return { skipped: true as const }
  return createNotification(input)
}

export async function getNotifications(limit = 20): Promise<Notification[]> {
  const { supabase, user } = await currentUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('notifications')
    .select('id, actor_id, type, title, message, href, metadata, read_at, created_at')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50))
  if (error) return []
  return (data ?? []) as Notification[]
}

export async function getUnreadNotificationCount() {
  const { supabase, user } = await currentUser()
  if (!user) return 0
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .is('read_at', null)
  return error ? 0 : count ?? 0
}

export async function markNotificationRead(notificationId: string) {
  const { supabase, user } = await currentUser()
  if (!user) return { error: 'Not logged in' }
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('recipient_id', user.id)
  return error ? { error: error.message } : { success: true }
}

export async function markAllNotificationsRead() {
  const { supabase, user } = await currentUser()
  if (!user) return { error: 'Not logged in' }
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', user.id)
    .is('read_at', null)
  return error ? { error: error.message } : { success: true }
}
