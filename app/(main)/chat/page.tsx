'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatWindow from '@/components/chat/ChatWindow'
import NewChatModal from '@/components/chat/NewChatModal'
import NewGroupChatModal from '@/components/chat/NewGroupChatModal'

interface Conversation {
  id: string
  name: string | null
  type: string
  created_at: string
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showNewChat, setShowNewChat] = useState(false)
  const [showNewGroupChat, setShowNewGroupChat] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const searchParams = useSearchParams()
  const supabase = createClient()

  const fetchConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: memberships } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id)

    if (!memberships || memberships.length === 0) {
      setConversations([])
      return
    }

    const convIds = memberships.map((m: { conversation_id: string }) => m.conversation_id)

    const { data: convs } = await supabase
      .from('conversations')
      .select('id, name, type, created_at, last_message_at, last_message_preview')
      .in('id', convIds)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (convs) {
      const convIds = convs.map((c: { id: string }) => c.id)

      // Fetch per-conversation unread counts
      const { data: unreadRows } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .eq('read', false)
        .neq('sender_id', user.id)

      const unreadMap: Record<string, number> = {}
      for (const row of (unreadRows || []) as { conversation_id: string }[]) {
        unreadMap[row.conversation_id] = (unreadMap[row.conversation_id] || 0) + 1
      }

      setConversations((convs as Conversation[]).map((c) => ({
        ...c,
        unread_count: unreadMap[c.id] || 0,
      })))
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    const conversationParam = searchParams.get('conversation')
    if (conversationParam) {
      setSelectedId(conversationParam)
      setMobileShowChat(true)
    }
  }, [searchParams])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setMobileShowChat(true)
  }

  const handleBack = () => {
    setMobileShowChat(false)
  }

  const handleNewChat = (conversationId: string) => {
    setShowNewChat(false)
    setShowNewGroupChat(false)
    fetchConversations()
    setSelectedId(conversationId)
    setMobileShowChat(true)
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar — hidden on mobile when chat is open */}
      <div className={`${mobileShowChat ? 'hidden' : 'block'} md:block`}>
        <ChatSidebar
          conversations={conversations}
          selectedId={selectedId}
          onSelect={handleSelect}
          onNewChat={() => setShowNewChat(true)}
          onNewGroupChat={() => setShowNewGroupChat(true)}
          currentUserId={userId || ''}
        />
      </div>

      {/* Chat window — hidden on mobile when sidebar is showing */}
      <div className={`flex-1 ${mobileShowChat ? 'block' : 'hidden'} md:block`}>
        {selectedId && userId ? (
          <ChatWindow
            conversationId={selectedId}
            currentUserId={userId}
            onBack={handleBack}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>Select a conversation or start a new one</p>
          </div>
        )}
      </div>

      {showNewChat && (
        <NewChatModal
          currentUserId={userId || ''}
          onClose={() => setShowNewChat(false)}
          onCreated={handleNewChat}
        />
      )}

      {showNewGroupChat && (
        <NewGroupChatModal
          currentUserId={userId || ''}
          onClose={() => setShowNewGroupChat(false)}
          onCreated={handleNewChat}
        />
      )}
    </div>
  )
}
