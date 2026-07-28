'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getConversations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: memberships } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) return []

  const convIds = memberships.map((m: { conversation_id: string }) => m.conversation_id)

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, name, type, created_at')
    .in('id', convIds)
    .order('created_at', { ascending: false })

  return conversations || []
}

export async function getConversationMembers(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { count } = await supabase
    .from('conversation_members')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: existing, error: rpcError } = await supabase.rpc(
    'create_direct_conversation',
    { other_user_id: otherUserId }
  )

  if (rpcError) return { error: rpcError.message }
  if (existing.error) return { error: existing.error }

  revalidatePath('/chat')
  return existing as { conversationId: string }
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { count } = await supabase
    .from('conversation_members')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)

  if (!count || count === 0) return { error: 'Not a member of this conversation' }

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: content.trim(),
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getMessages(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { count } = await supabase
    .from('conversation_members')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)

  if (!count || count === 0) return []

  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, created_at, sender_id')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100)

  return messages || []
}
