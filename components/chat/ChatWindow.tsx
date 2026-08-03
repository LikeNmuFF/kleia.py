'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatUnread } from '@/components/chat/ChatUnreadProvider'
import MessageInput from './MessageInput'
import Avatar from '@/components/Avatar'

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
}

interface SenderInfo {
  username: string
  avatar_url: string | null
}

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  onBack?: () => void
}

export default function ChatWindow({ conversationId, currentUserId, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [senderMap, setSenderMap] = useState<Record<string, SenderInfo>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const unreadCtx = useChatUnread()

  useEffect(() => {
    unreadCtx?.setActiveConversation(conversationId)
    return () => { unreadCtx?.setActiveConversation(null) }
  }, [conversationId, unreadCtx])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(200)

      if (data) {
        setMessages(data)

        const senderIds: string[] = Array.from(new Set(data.map((m: { sender_id: string }) => m.sender_id)))
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', senderIds)
        const map: Record<string, SenderInfo> = {}
        for (const p of profiles || []) {
          map[p.id] = { username: p.username, avatar_url: p.avatar_url }
        }
        setSenderMap(map)

        unreadCtx?.markAsRead(conversationId)
      }
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
        async (payload: { new: Message }) => {
          const newMsg = payload.new as Message
          setMessages((prev) => [...prev, newMsg])

          if (newMsg.sender_id !== currentUserId) {
            unreadCtx?.markAsRead(conversationId)
          }

          if (!senderMap[newMsg.sender_id]) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', newMsg.sender_id)
              .single()

            if (profile) {
              setSenderMap((prev) => ({ ...prev, [newMsg.sender_id]: profile }))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Mobile back button */}
      {onBack && (
        <div className="md:hidden p-2 flex items-center" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: 'var(--text-muted)' }}>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const sender = senderMap[msg.sender_id]
            const isOwn = msg.sender_id === currentUserId

            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {!isOwn && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                    {sender?.avatar_url ? (
                      <Avatar src={sender.avatar_url} size={32} />
                    ) : (
                      <span className="text-white text-xs font-medium">
                        {sender?.username?.[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                )}
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    isOwn
                      ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white'
                      : ''
                  }`}
                  style={!isOwn ? { backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' } : undefined}
                >
                  {!isOwn && (
                    <p className="text-xs font-medium text-violet-400 mb-1">
                      {sender?.username || 'Unknown'}
                    </p>
                  )}
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/60' : ''}`} style={!isOwn ? { color: 'var(--text-muted)' } : undefined}>
                    {new Date(msg.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput conversationId={conversationId} />
    </div>
  )
}
