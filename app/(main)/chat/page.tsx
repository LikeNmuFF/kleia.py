'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatWindow from '@/components/chat/ChatWindow'

interface Conversation {
  id: string
  name: string | null
  type: string
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data } = await supabase
          .from('conversation_members')
          .select('conversations(id, name, type)')
          .eq('user_id', user.id)

        if (data) {
          setConversations(data.map((d) => d.conversations as unknown as Conversation))
        }
      }
    }

    fetchData()
  }, [])

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <ChatSidebar
        conversations={conversations}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <div className="flex-1">
        {selectedId && userId ? (
          <ChatWindow conversationId={selectedId} currentUserId={userId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  )
}
