'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MessageQuote({ messageId, conversationId }: { messageId: string; conversationId: string }) {
  const [quote, setQuote] = useState<{ content: string; username: string } | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const supabase = createClient()
        const { data: message } = await supabase.from('messages').select('content, sender_id')
          .eq('id', messageId).eq('conversation_id', conversationId).maybeSingle()
        if (!message || cancelled) return
        const { data: profile } = await supabase.from('profiles').select('username')
          .eq('id', message.sender_id).maybeSingle()
        if (!cancelled) setQuote({ content: message.content, username: profile?.username || 'Unknown' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load().catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [messageId, conversationId])
  return <blockquote className="mb-2 border-l-2 border-current/40 pl-3 text-xs">
    {quote ? <><p className="font-semibold">{quote.username}</p><p className="line-clamp-2 whitespace-pre-wrap break-words opacity-80">{quote.content}</p></> : <p className="opacity-70">{loading ? 'Loading reply...' : 'Original message unavailable'}</p>}
  </blockquote>
}
