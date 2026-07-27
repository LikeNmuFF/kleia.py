'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MessageInputProps {
  conversationId: string
}

export default function MessageInput({ conversationId }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: message.trim(),
      })
      setMessage('')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSend} className="p-4 border-t border-white/5">
      <div className="flex gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="px-5 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-medium transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </form>
  )
}
