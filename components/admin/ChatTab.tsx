'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Users, Hash, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Channel {
  id: string
  name: string
  type: string
  created_at: string
  member_count?: number
}

interface Message {
  id: string
  content: string
  created_at: string
  sender: { username: string; avatar_url: string | null } | null
  channel: { name: string } | null
}

export default function ChatTab() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [recentMessages, setRecentMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const [channelsRes, messagesRes] = await Promise.all([
        supabase.from('chat_channels').select('id, name, type, created_at').order('created_at', { ascending: false }),
        supabase.from('chat_messages').select('id, content, created_at, sender:profiles!chat_messages_sender_id_fkey(username, avatar_url), channel:chat_channels(name)').order('created_at', { ascending: false }).limit(20),
      ])
      setChannels(channelsRes.data ?? [])
      setRecentMessages((messagesRes.data as unknown as Message[]) ?? [])
      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return <div className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--card-bg)' }} />
  }

  return (
    <div className="space-y-6">
      {/* Channel List */}
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Hash className="w-4 h-4 text-cyan-400" />
          Chat Channels ({channels.length})
        </h3>
        {channels.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No channels yet</p>
        ) : (
          <div className="space-y-2">
            {channels.map(ch => (
              <div key={ch.id} className="flex items-center justify-between py-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ch.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-muted)' }}>
                    {ch.type}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(ch.created_at).toLocaleDateString()}
                </span>
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
            {recentMessages.map(msg => (
              <div key={msg.id} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {msg.sender?.avatar_url ? (
                    <img src={msg.sender.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span className="text-white text-xs font-semibold">{msg.sender?.username?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    @{msg.sender?.username} in #{msg.channel?.name} · {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                  <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
