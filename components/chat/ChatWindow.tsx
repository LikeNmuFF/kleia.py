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
  read: boolean
}

interface SenderInfo {
  username: string
  avatar_url: string | null
}

interface ConversationInfo {
  name: string | null
  type: string
  memberCount: number
  otherMember: SenderInfo | null
}

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  onBack?: () => void
}

export default function ChatWindow({ conversationId, currentUserId, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [senderMap, setSenderMap] = useState<Record<string, SenderInfo>>({})
  const [convInfo, setConvInfo] = useState<ConversationInfo | null>(null)
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
    const fetchConversationInfo = async () => {
      const { data: conv } = await supabase
        .from('conversations')
        .select('name, type')
        .eq('id', conversationId)
        .single()

      if (!conv) return

      const { data: members } = await supabase
        .from('conversation_members')
        .select('user_id')
        .eq('conversation_id', conversationId)

      const memberCount = (members?.length || 0)
      let otherMember: SenderInfo | null = null

      if (conv.type === 'direct' && members) {
        const otherId = members.find((m: { user_id: string }) => m.user_id !== currentUserId)?.user_id
        if (otherId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', otherId)
            .single()
          if (profile) otherMember = profile
        }
      }

      setConvInfo({ name: conv.name, type: conv.type, memberCount, otherMember })
    }

    fetchConversationInfo()

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id, read')
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
        // Optimistically mark all messages from others as read
        setMessages((prev) => prev.map((m) => m.sender_id !== currentUserId ? { ...m, read: true } : m))
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
            // Optimistically mark existing messages from others as read
            setMessages((prev) => prev.map((m) => m.sender_id !== currentUserId ? { ...m, read: true } : m))
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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: { new: Message }) => {
          const updated = payload.new as Message
          setMessages((prev) => prev.map((m) => m.id === updated.id ? { ...m, read: updated.read } : m))
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

  const displayName = convInfo
    ? convInfo.type === 'group'
      ? (convInfo.name || 'Unnamed Group')
      : (convInfo.otherMember?.username || 'Unknown')
    : ''

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Conversation Header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
          {convInfo?.type === 'group' ? (
            <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ) : convInfo?.otherMember?.avatar_url ? (
            <Avatar src={convInfo.otherMember.avatar_url} size={36} />
          ) : (
            <span className="text-white text-sm font-medium">
              {displayName?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {displayName || 'Loading...'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {convInfo?.type === 'group'
              ? `${convInfo.memberCount} members`
              : (convInfo?.otherMember ? 'Online' : '')
            }
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-4 space-y-4">
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
                  className={`max-w-[85%] sm:max-w-xs md:max-w-sm lg:max-w-lg xl:max-w-xl px-4 py-3 rounded-2xl ${
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
                  <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                    <p className={`text-[10px] ${isOwn ? 'text-white/60' : ''}`} style={!isOwn ? { color: 'var(--text-muted)' } : undefined}>
                      {new Date(msg.created_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                    {isOwn && (
                      <span className="text-[11px]" title={msg.read ? 'Read' : 'Sent'}>
                        {msg.read ? (
                          <svg className="w-3.5 h-3.5 text-blue-300" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 8.5l3.5 3.5L10 5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M5 8.5l3.5 3.5L14 5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 text-white/50" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 8.5l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
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
