'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Hash, Trash2, Users } from 'lucide-react'
import { getAdminConversations, getAdminRecentMessages } from '@/app/actions/admin'
import { deleteMessage, deleteConversation } from '@/app/actions/chat'

interface Conversation {
  id: string
  name: string | null
  type: string
  created_at: string
  last_message_at: string | null
  last_message_preview: string | null
}

interface Message {
  id: string
  content: string
  created_at: string
  sender: { username: string; avatar_url: string | null } | null
  conversation: { id: string; name: string | null; type: string } | null
}

function resolveSender(sender: Message['sender']) {
  return Array.isArray(sender) ? sender[0] ?? null : sender
}

function resolveConversation(conversation: Message['conversation']) {
  return Array.isArray(conversation) ? conversation[0] ?? null : conversation
}

export default function ChatTab() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [recentMessages, setRecentMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [convData, msgData] = await Promise.all([
      getAdminConversations(),
      getAdminRecentMessages(),
    ])
    setConversations((convData.conversations as unknown as Conversation[]) ?? [])
    setRecentMessages((msgData.messages as unknown as Message[]) ?? [])
    setLoading(false)
  }

  async function handleDeleteMessage(id: string) {
    if (!confirm('Delete this message permanently?')) return
    const result = await deleteMessage(id)
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Message deleted' })
      setRecentMessages(prev => prev.filter(m => m.id !== id))
    }
  }

  async function handleDeleteConversation(id: string) {
    if (!confirm('Delete this entire conversation? This cannot be undone.')) return
    const result = await deleteConversation(id)
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Conversation deleted' })
      setConversations(prev => prev.filter(c => c.id !== id))
      setRecentMessages(prev => prev.filter(m => {
        const conv = resolveConversation(m.conversation)
        return conv?.id !== id
      }))
    }
  }

  if (loading) {
    return <div className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--card-bg)' }} />
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'success' ? '#22c55e' : '#ef4444',
            border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Conversation List */}
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Users className="w-4 h-4 text-cyan-400" />
          Conversations ({conversations.length})
        </h3>
        {conversations.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No conversations yet</p>
        ) : (
          <div className="space-y-2">
            {conversations.map(conv => (
              <div key={conv.id} className="flex items-center justify-between gap-3 py-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <Hash className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <div className="min-w-0">
                    <span className="text-sm font-medium truncate block" style={{ color: 'var(--text-primary)' }}>
                      {conv.name || '(unnamed)'}
                    </span>
                    {conv.last_message_preview && (
                      <span className="text-xs truncate block" style={{ color: 'var(--text-muted)' }}>
                        {conv.last_message_preview}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs px-1.5 py-0.5 rounded-full capitalize" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-muted)' }}>
                    {conv.type}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(conv.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDeleteConversation(conv.id)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-red-400"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Messages */}
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <MessageSquare className="w-4 h-4 text-violet-400" />
          Recent Messages
        </h3>
        {recentMessages.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No messages yet</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentMessages.map(msg => {
              const sender = resolveSender(msg.sender)
              const conversation = resolveConversation(msg.conversation)
              return (
                <div key={msg.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {sender?.avatar_url ? (
                      <img src={sender.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-semibold">{sender?.username?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      @{sender?.username} in {conversation?.name || '(unnamed)'} · {new Date(msg.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{msg.content}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-red-400 flex-shrink-0"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}