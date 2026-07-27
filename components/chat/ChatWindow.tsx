'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import MessageInput from './MessageInput'

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  profiles: { username: string }
}

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
}

export default function ChatWindow({ conversationId, currentUserId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(username)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (data) setMessages(data)
    }

    fetchMessages()

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  msg.sender_id === currentUserId
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white'
                    : 'bg-white/10 text-white'
                }`}
              >
                {msg.sender_id !== currentUserId && (
                  <p className="text-xs font-medium text-violet-400 mb-1">
                    {msg.profiles.username}
                  </p>
                )}
                <p className="leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <MessageInput conversationId={conversationId} />
    </div>
  )
}
