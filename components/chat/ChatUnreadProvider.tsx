'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { markAsRead as markAsReadAction, getUnreadCount } from '@/app/actions/chat'

interface ChatUnreadContextValue {
  unreadCount: number
  conversationUnreadCounts: Record<string, number>
  activeConversationId: string | null
  setActiveConversation: (id: string | null) => void
  markAsRead: (conversationId: string) => Promise<void>
  refreshUnread: () => Promise<void>
  isMuted: boolean
  toggleMute: () => void
}

const ChatUnreadContext = createContext<ChatUnreadContextValue | null>(null)

export function useChatUnread() {
  return useContext(ChatUnreadContext)
}

function generateNotificationSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
    setTimeout(() => ctx.close(), 300)
  } catch {}
}

const ORIGINAL_TITLE = 'Kleia | Learn Together, Grow Together'

function setFavicon(unread: boolean) {
  try {
    const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!existing) return

    if (!unread) {
      existing.href = '/logo.png'
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 32, 32)
      ctx.beginPath()
      ctx.arc(24, 24, 8, 0, Math.PI * 2)
      ctx.fillStyle = '#ef4444'
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()
      existing.href = canvas.toDataURL('image/png')
    }
    img.src = '/logo.png'
  } catch {}
}

export default function ChatUnreadProvider({
  userId,
  children,
}: {
  userId: string | null
  children: React.ReactNode
}) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [conversationUnreadCounts, setConversationUnreadCounts] = useState<Record<string, number>>({})
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const hasInteracted = useRef(false)
  const supabase = createClient()

  useEffect(() => {
    const handler = () => { hasInteracted.current = true }
    window.addEventListener('click', handler, { once: true })
    window.addEventListener('keydown', handler, { once: true })
    return () => {
      window.removeEventListener('click', handler)
      window.removeEventListener('keydown', handler)
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('chat_mute')
    if (stored === 'true') setIsMuted(true)
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev
      localStorage.setItem('chat_mute', String(next))
      return next
    })
  }, [])

  const refreshUnread = useCallback(async () => {
    if (!userId) return
    const count = await getUnreadCount()
    setUnreadCount(count)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    refreshUnread()
  }, [userId, refreshUnread])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('chat:unread')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload: { new: { conversation_id: string; sender_id: string } }) => {
          const msg = payload.new
          if (msg.sender_id === userId) return

          setUnreadCount((prev) => prev + 1)
          setConversationUnreadCounts((prev) => ({
            ...prev,
            [msg.conversation_id]: (prev[msg.conversation_id] || 0) + 1,
          }))

          if (hasInteracted.current && !isMuted && msg.conversation_id !== activeConversationId) {
            generateNotificationSound()
          }

          if (document.hidden) {
            setUnreadCount((prev) => {
              document.title = prev > 0 ? `(${prev > 99 ? '99+' : prev}) ${ORIGINAL_TITLE}` : ORIGINAL_TITLE
              return prev
            })
            setFavicon(true)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, isMuted, activeConversationId, supabase])

  useEffect(() => {
    if (unreadCount > 0 && document.hidden) {
      document.title = `(${unreadCount > 99 ? '99+' : unreadCount}) ${ORIGINAL_TITLE}`
      setFavicon(true)
    } else {
      document.title = ORIGINAL_TITLE
      setFavicon(unreadCount > 0)
    }
  }, [unreadCount])

  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) {
        document.title = ORIGINAL_TITLE
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const setActiveConversation = useCallback((id: string | null) => {
    setActiveConversationId(id)
  }, [])

  const markAsReadFn = useCallback(async (conversationId: string) => {
    await markAsReadAction(conversationId)
    setConversationUnreadCounts((prev) => {
      const diff = prev[conversationId] || 0
      const next = { ...prev }
      delete next[conversationId]
      setUnreadCount((c) => Math.max(0, c - diff))
      return next
    })
  }, [])

  return (
    <ChatUnreadContext.Provider
      value={{
        unreadCount,
        conversationUnreadCounts,
        activeConversationId,
        setActiveConversation,
        markAsRead: markAsReadFn,
        refreshUnread,
        isMuted,
        toggleMute,
      }}
    >
      {children}
    </ChatUnreadContext.Provider>
  )
}
