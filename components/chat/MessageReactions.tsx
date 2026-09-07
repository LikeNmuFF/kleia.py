'use client'

import { useRef, useState } from 'react'
import { Reply, SmilePlus, X } from 'lucide-react'
import { setMessageReaction } from '@/app/actions/chat'
import { CHAT_REACTIONS, type MessageReaction } from '@/lib/chat/reactions'

type Props = {
  conversationId: string
  messageId: string
  currentUserId: string
  reactions: MessageReaction[]
  onReply: () => void
  onChange: (reaction: MessageReaction) => void
}

export default function MessageReactions({ conversationId, messageId, currentUserId, reactions, onReply, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const [error, setError] = useState<string | null>(null)

  async function react(emoji: string) {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError(null)
    const active = !reactions.some((r) => r.user_id === currentUserId && r.emoji === emoji && r.active)
    try {
      const result = await setMessageReaction(conversationId, messageId, emoji, active)
      if (result.error) setError(result.error)
      else {
        onChange({ message_id: messageId, conversation_id: conversationId, user_id: currentUserId, emoji, active })
        setOpen(false)
      }
    } catch {
      setError('Could not update reaction. Please try again.')
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  return (
    <div className="mt-2" onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false) }}>
      <div className="flex flex-wrap items-center gap-1">
        {CHAT_REACTIONS.map(({ id, emoji, label }) => {
          const selected = reactions.filter((r) => r.emoji === id && r.active)
          if (!selected.length) return null
          const own = selected.some((r) => r.user_id === currentUserId)
          return <button key={id} type="button" disabled={pending} aria-pressed={own} aria-label={`${label}: ${selected.length}${own ? ', including you' : ''}`} title={`${label}: ${selected.length}${own ? ', including you' : ''}`} onClick={() => react(id)} className={`inline-flex min-h-8 items-center gap-1 rounded-md border px-2 text-xs ${own ? 'border-cyan-300 bg-cyan-400/20' : 'border-current/20 bg-black/10'}`}><span>{emoji}</span><span>{selected.length}</span></button>
        })}
        <button type="button" onClick={onReply} title="Reply" aria-label="Reply" className="grid h-8 w-8 place-items-center rounded-md hover:bg-black/10"><Reply size={16} /></button>
        <button type="button" onClick={() => setOpen(!open)} title="React" aria-label="React" aria-expanded={open} className="grid h-8 w-8 place-items-center rounded-md hover:bg-black/10"><SmilePlus size={16} /></button>
      </div>
      {open && <div role="group" aria-label="Choose a reaction" className="mt-1 flex flex-wrap gap-1">
        {CHAT_REACTIONS.map(({ id, emoji, label }) => <button key={id} type="button" disabled={pending} title={label} aria-label={label} onClick={() => react(id)} className="grid h-9 w-9 place-items-center rounded-md text-lg hover:bg-black/20 disabled:opacity-50">{emoji}</button>)}
        <button type="button" onClick={() => setOpen(false)} title="Close reactions" aria-label="Close reactions" className="grid h-9 w-9 place-items-center rounded-md hover:bg-black/20"><X size={14} /></button>
      </div>}
      {error && <p role="alert" className="mt-1 text-xs">{error}</p>}
    </div>
  )
}
