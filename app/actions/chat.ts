'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { logEvent } from '@/lib/logEvent'
import { isAdmin } from '@/lib/admin'
import { getCompetitionAccess } from './competition'
import { getSafeErrorMessage } from '@/lib/errorHandler'

async function isParticipantLocked() {
  const access = await getCompetitionAccess()
  return access.kind === 'participant' && access.effectiveStatus === 'live'
}

export async function getConversations() {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: memberships, error } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id)

  if (error) {
    await logEvent({ endpoint: 'chat.getConversations', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
    return []
  }

  if (!memberships || memberships.length === 0) return []

  const convIds = memberships.map((m: { conversation_id: string }) => m.conversation_id)

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, name, type, created_at, last_message_at, last_message_preview')
    .in('id', convIds)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (!conversations) return []

  const unreadCounts: Record<string, number> = {}
  const { data: unreadRows } = await supabase
    .from('messages')
    .select('conversation_id')
    .in('conversation_id', convIds)
    .eq('read', false)
    .neq('sender_id', user.id)

  if (unreadRows) {
    for (const row of unreadRows as { conversation_id: string }[]) {
      unreadCounts[row.conversation_id] = (unreadCounts[row.conversation_id] || 0) + 1
    }
  }

  return conversations.map((c) => ({
    ...c,
    unread_count: unreadCounts[c.id] || 0,
  }))
}

export async function getConversationMembers(conversationId: string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { count, error: countError } = await supabase
    .from('conversation_members')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)

  if (countError) {
    await logEvent({ endpoint: 'chat.getConversationMembers', status: 'error', durationMs: Date.now() - start, errorMessage: countError.message, userId: user.id })
    return []
  }

  if (!count || count === 0) return []

  const { data: memberships } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)

  if (!memberships || memberships.length === 0) return []

  const userIds = memberships.map((m: { user_id: string }) => m.user_id)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, status, last_seen')
    .in('id', userIds)

  return profiles || []
}

export async function startConversation(otherUserId: string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  if (await isParticipantLocked()) {
    return { error: 'Messaging is disabled during the competition' }
  }

  const { data: existing, error: rpcError } = await supabase.rpc(
    'create_direct_conversation',
    { other_user_id: otherUserId }
  )

  if (rpcError) {
    await logEvent({ endpoint: 'chat.startConversation', status: 'error', durationMs: Date.now() - start, errorMessage: rpcError.message, userId: user.id })
    return { error: getSafeErrorMessage(rpcError, 'Failed to start conversation. Please try again.') }
  }
  if (existing.error) {
    await logEvent({ endpoint: 'chat.startConversation', status: 'error', durationMs: Date.now() - start, errorMessage: existing.error, userId: user.id })
    return { error: getSafeErrorMessage(existing.error, 'Failed to start conversation.') }
  }

  await logEvent({ endpoint: 'chat.startConversation', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/chat')
  return existing as { conversationId: string }
}

export async function createGroupConversation(memberIds: string[], name: string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  if (await isParticipantLocked()) {
    return { error: 'Messaging is disabled during the competition' }
  }

  if (memberIds.length < 1) return { error: 'Select at least one other member' }
  if (memberIds.length > 50) return { error: 'Group chat limited to 50 members' }
  if (name.trim().length === 0) return { error: 'Group name is required' }
  if (name.trim().length > 100) return { error: 'Group name must be 100 characters or fewer' }

  const uniqueMemberIds = [...new Set(memberIds.filter((id) => id !== user.id))]

  const { data, error: rpcError } = await supabase.rpc('create_group_conversation', {
    member_ids: uniqueMemberIds,
    group_name: name.trim(),
  })

  if (rpcError) {
    await logEvent({ endpoint: 'chat.createGroupConversation', status: 'error', durationMs: Date.now() - start, errorMessage: rpcError.message, userId: user.id })
    return { error: getSafeErrorMessage(rpcError, 'Failed to create group chat. Please try again.') }
  }

  if (data?.error) {
    await logEvent({ endpoint: 'chat.createGroupConversation', status: 'error', durationMs: Date.now() - start, errorMessage: data.error, userId: user.id })
    return { error: getSafeErrorMessage(data.error, 'Failed to create group chat.') }
  }

  await logEvent({ endpoint: 'chat.createGroupConversation', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/chat')
  return data as { conversationId: string }
}

export async function sendMessage(conversationId: string, content: string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  if (await isParticipantLocked()) {
    return { error: 'Messaging is disabled during the competition' }
  }

  const { count, error: memberError } = await supabase
    .from('conversation_members')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)

  if (memberError) {
    await logEvent({ endpoint: 'chat.sendMessage', status: 'error', durationMs: Date.now() - start, errorMessage: memberError.message, userId: user.id })
    return { error: getSafeErrorMessage(memberError, 'Failed to send message.') }
  }

  if (!count || count === 0) return { error: 'Not a member of this conversation' }

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: content.trim(),
  })

  if (error) {
    await logEvent({ endpoint: 'chat.sendMessage', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
    return { error: getSafeErrorMessage(error, 'Failed to send message. Please try again.') }
  }

  await logEvent({ endpoint: 'chat.sendMessage', status: 'success', durationMs: Date.now() - start, userId: user.id })

  const { completeMission } = await import('./gamification')
  await completeMission('message')

  return { success: true }
}

export async function getMessages(conversationId: string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { count, error: countError } = await supabase
    .from('conversation_members')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)

  if (countError) {
    await logEvent({ endpoint: 'chat.getMessages', status: 'error', durationMs: Date.now() - start, errorMessage: countError.message, userId: user.id })
    return []
  }

  if (!count || count === 0) return []

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, content, created_at, sender_id')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    await logEvent({ endpoint: 'chat.getMessages', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
    return []
  }

  return messages || []
}

export async function markAsRead(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .eq('read', false)

  if (error) return { error: getSafeErrorMessage(error, 'Failed to mark as read.') }
  return { success: true }
}

export async function getUnreadCount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('read', false)
    .neq('sender_id', user.id)

  return count || 0
}

// ---- Admin moderation ----

export async function deleteMessage(messageId: string) {
  const start = Date.now()
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (error) {
    await logEvent({ endpoint: 'chat.deleteMessage', status: 'error', durationMs: Date.now() - start, errorMessage: error.message })
    return { error: getSafeErrorMessage(error, 'Failed to delete message.') }
  }

  await logEvent({ endpoint: 'chat.deleteMessage', status: 'success', durationMs: Date.now() - start })
  revalidatePath('/chat')
  return { success: true }
}

export async function deleteConversation(conversationId: string) {
  const start = Date.now()
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)

  if (error) {
    await logEvent({ endpoint: 'chat.deleteConversation', status: 'error', durationMs: Date.now() - start, errorMessage: error.message })
    return { error: getSafeErrorMessage(error, 'Failed to delete conversation.') }
  }

  await logEvent({ endpoint: 'chat.deleteConversation', status: 'success', durationMs: Date.now() - start })
  revalidatePath('/chat')
  return { success: true }
}
