'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { sendMessage } from '@/app/actions/chat'
import type { ChatMessage, ReplyTarget } from '@/lib/chat/types'

interface MessageInputProps {
  conversationId: string
  replyTo?: ReplyTarget | null
  onCancelReply?: () => void
  onSent?: (message: ChatMessage) => void
}

export default function MessageInput({ conversationId, replyTo, onCancelReply, onSent }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sendingRef = useRef(false)
  useEffect(() => { if (replyTo) inputRef.current?.focus() }, [replyTo])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sendingRef.current) return

    sendingRef.current = true
    setLoading(true)
    setError(null)
    try {
      const result = await sendMessage(conversationId, message, replyTo?.id ?? null)
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        setMessage('')
        if (inputRef.current) inputRef.current.style.height = 'auto'
        onCancelReply?.()
        if (result.message) onSent?.(result.message)
      }
    } catch {
      setError('Could not send message. Please try again.')
    } finally {
      sendingRef.current = false
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend(e)
    }
  }

  return (
    <div className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
      {replyTo && (
        <div className="mx-auto mb-3 flex max-w-4xl items-center gap-3 border-l-2 border-cyan-400 pl-3" style={{ color: 'var(--text-primary)' }}>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">Replying to {replyTo.username}</p>
            <p className="truncate text-sm" style={{ color: 'var(--text-muted)' }}>{replyTo.content}</p>
          </div>
          <button type="button" disabled={loading} onClick={onCancelReply} aria-label="Cancel reply" title="Cancel reply" className="rounded-md p-2 hover:bg-white/10"><X size={16} /></button>
        </div>
      )}
      {error && <p role="alert" className="mx-auto mb-2 max-w-4xl text-sm text-red-400">{error}</p>}
      <form onSubmit={handleSend} className="flex items-end gap-3 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            aria-label="Message"
            maxLength={4000}
            disabled={loading}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="w-full px-4 py-3 pr-12 rounded-2xl resize-none text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            style={{
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              maxHeight: '120px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 120) + 'px'
            }}
          />
        </div>
        <button
          type="submit"
          aria-label="Send message"
          disabled={loading || !message.trim()}
          className="p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shrink-0"
          style={{
            background: message.trim() ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)' : 'var(--input-bg)',
            color: message.trim() ? 'white' : 'var(--text-muted)',
          }}
        >
          {loading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  )
}
