'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatWindow from '@/components/chat/ChatWindow'
import NewChatModal from '@/components/chat/NewChatModal'

interface Conversation {
  id: string
  name: string | null
  type: string
  created_at: string
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showNewChat, setShowNewChat] = useState(false)
  const searchParams = useSearchParams()
  const supabase = createClient()

  const fetchConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    // Get user's conversation memberships
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
      .select('id, name, type, created_at')
      .in('id', convIds)
      .order('created_at', { ascending: false })

    if (convs) setConversations(convs)
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  // Open a conversation passed via ?conversation=<id> (e.g. from a member profile)
  useEffect(() => {
    const conversationParam = searchParams.get('conversation')
    if (conversationParam) {
      setSelectedId(conversationParam)
    }
  }, [searchParams])

  const handleNewChat = (conversationId: string) => {
    setShowNewChat(false)
    fetchConversations()
    setSelectedId(conversationId)
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <ChatSidebar
        conversations={conversations}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onNewChat={() => setShowNewChat(true)}
        currentUserId={userId || ''}
      />
      <div className="flex-1">
        {selectedId && userId ? (
          <ChatWindow conversationId={selectedId} currentUserId={userId} />
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
    </div>
  )
}
