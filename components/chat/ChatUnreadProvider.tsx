'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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

const ORIGINAL_TITLE = 'Chat | Kleia'

interface IncomingMessageNotice {
  conversationId: string
  senderName: string
  preview: string
}

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
  const [incomingNotice, setIncomingNotice] = useState<IncomingMessageNotice | null>(null)
  const hasInteracted = useRef(false)
  const supabase = createClient()
  const router = useRouter()

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
        async (payload: { new: { conversation_id: string; sender_id: string; content?: string } }) => {
          const msg = payload.new
          if (msg.sender_id === userId) return

          if (msg.conversation_id === activeConversationId) {
            await markAsReadAction(msg.conversation_id)
            await refreshUnread()
            return
          }

          setUnreadCount((prev) => prev + 1)
          setConversationUnreadCounts((prev) => ({
            ...prev,
            [msg.conversation_id]: (prev[msg.conversation_id] || 0) + 1,
          }))

          const { data: sender } = await supabase
            .from('profiles')
            .select('username, full_name')
            .eq('id', msg.sender_id)
            .maybeSingle()

          setIncomingNotice({
            conversationId: msg.conversation_id,
            senderName: sender?.full_name || sender?.username || 'Someone',
            preview: msg.content?.trim() || 'Sent a message',
          })

          if (hasInteracted.current && !isMuted) {
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
  }, [userId, isMuted, activeConversationId, supabase, refreshUnread])

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
      const next = { ...prev }
      delete next[conversationId]
      return next
    })
    await refreshUnread()
  }, [refreshUnread])

  useEffect(() => {
    if (!incomingNotice) return
    const timer = window.setTimeout(() => setIncomingNotice(null), 7000)
    return () => window.clearTimeout(timer)
  }, [incomingNotice])

  const openIncomingConversation = useCallback(() => {
    if (!incomingNotice) return
    const conversationId = incomingNotice.conversationId
    setIncomingNotice(null)
    router.push(`/chat?conversation=${encodeURIComponent(conversationId)}`)
  }, [incomingNotice, router])

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
      {incomingNotice && (
        <button
          type="button"
          onClick={openIncomingConversation}
          className="fixed left-1/2 top-20 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-lg border p-3 text-left shadow-2xl backdrop-blur-xl transition hover:scale-[1.01]"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--bg-primary) 92%, transparent)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {incomingNotice.senderName} sent a message
              </p>
              <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--text-secondary)' }}>
                {incomingNotice.preview}
              </p>
            </div>
          </div>
        </button>
      )}
    </ChatUnreadContext.Provider>
  )
}
