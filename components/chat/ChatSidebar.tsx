'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getStatusInfo } from '@/lib/utils/time'
import { useOnlineUsers } from '@/lib/hooks/useOnlineUsers'
import Avatar from '@/components/Avatar'

interface Conversation {
  id: string
  name: string | null
  type: string
}

interface MemberInfo {
  id: string
  username: string
  avatar_url: string | null
  status: string | null
  last_seen: string | null
}

interface ChatSidebarProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNewChat: () => void
  currentUserId: string
}

export default function ChatSidebar({ conversations, selectedId, onSelect, onNewChat, currentUserId }: ChatSidebarProps) {
  const [memberMap, setMemberMap] = useState<Record<string, MemberInfo>>({})
  const onlineUsers = useOnlineUsers()
  const supabase = createClient()

  useEffect(() => {
    const fetchMembers = async () => {
      const convIds = conversations.map(c => c.id)
      const { data: allMemberships } = await supabase
        .from('conversation_members')
        .select('conversation_id, user_id')
        .in('conversation_id', convIds)
        .neq('user_id', currentUserId)

      const otherIds = new Set<string>()
      const convToOther: Record<string, string> = {}
      for (const m of allMemberships || []) {
        if (!convToOther[m.conversation_id]) {
          convToOther[m.conversation_id] = m.user_id
          otherIds.add(m.user_id)
        }
      }

      if (otherIds.size === 0) { setMemberMap({}); return }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, status, last_seen')
        .in('id', Array.from(otherIds))

      const map: Record<string, MemberInfo> = {}
      for (const conv of conversations) {
        const otherId = convToOther[conv.id]
        if (otherId) {
          const profile = (profiles || []).find((p: { id: string }) => p.id === otherId)
          if (profile) map[conv.id] = profile
        }
      }
      setMemberMap(map)
    }

    if (conversations.length > 0 && currentUserId) {
      fetchMembers()
    }
  }, [conversations, currentUserId, supabase])

  return (
    <div className="w-72 h-full flex flex-col" style={{ borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Messages</h2>
        <button
          onClick={onNewChat}
          className="p-2 rounded-lg transition-all"
          style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)' }}
          title="New chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => {
            const member = memberMap[conv.id]
            const statusInfo = member ? getStatusInfo(member.status, member.last_seen) : null
            const liveOnline = member ? onlineUsers.has(member.id) : false

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className="w-full text-left p-4 transition-all"
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: selectedId === conv.id ? 'var(--card-hover)' : 'transparent',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      {member?.avatar_url ? (
                        <Avatar src={member.avatar_url} size={40} />
                      ) : (
                        <span className="text-white font-medium text-sm">
                          {member?.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    {statusInfo && (
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${liveOnline ? 'bg-emerald-400' : statusInfo.color}`} style={{ borderColor: 'var(--bg-primary)' }} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {member?.username || 'Unknown'}
                    </p>
                    <p className={`text-xs truncate ${liveOnline ? 'text-emerald-400' : ''}`} style={!liveOnline ? { color: 'var(--text-muted)' } : undefined}>
                      {liveOnline ? 'Online' : (statusInfo?.text || 'Offline')}
                    </p>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
