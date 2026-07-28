'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getConversations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get conversation IDs this user is a member of
  const { data: memberships } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) return []

  const convIds = memberships.map((m) => m.conversation_id)

  // Get conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, name, type, created_at')
    .in('id', convIds)
    .order('created_at', { ascending: false })

  return conversations || []
}

export async function getConversationMembers(conversationId: string) {
  const supabase = await createClient()

  const { data: memberships } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)

  if (!memberships || memberships.length === 0) return []

  const userIds = memberships.map((m) => m.user_id)

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

  // Check if direct conversation already exists between these two users
  // Query conversation_members where user_id is the current user
  const { data: myMemberships } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id)

  if (myMemberships && myMemberships.length > 0) {
    const myConvIds = myMemberships.map((m) => m.conversation_id)

    // For each conversation the current user is in, check if the other user is also a member
    for (const convId of myConvIds) {
      const { count } = await supabase
        .from('conversation_members')
        .select('conversation_id', { count: 'exact', head: true })
        .eq('conversation_id', convId)
        .eq('user_id', otherUserId)

      if (count && count > 0) {
        return { conversationId: convId }
      }
    }
  }

  // Create new direct conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({ type: 'direct' })
    .select('id')
    .single()

  if (convError || !conversation) return { error: convError?.message || 'Failed to create conversation' }

  // Add both members
  const { error: memberError } = await supabase.from('conversation_members').insert([
    { conversation_id: conversation.id, user_id: user.id },
    { conversation_id: conversation.id, user_id: otherUserId },
  ])

  if (memberError) return { error: memberError.message }

  revalidatePath('/chat')
  return { conversationId: conversation.id }
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

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

  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, created_at, sender_id')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100)

  return messages || []
}
