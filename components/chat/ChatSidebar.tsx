'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getStatusInfo } from '@/lib/utils/time'
import { useOnlineUsers } from '@/lib/hooks/useOnlineUsers'
import { useChatUnread } from '@/components/chat/ChatUnreadProvider'
import Avatar from '@/components/Avatar'

interface Conversation {
  id: string
  name: string | null
  type: string
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
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
  onNewGroupChat: () => void
  currentUserId: string
}

export default function ChatSidebar({ conversations, selectedId, onSelect, onNewChat, onNewGroupChat, currentUserId }: ChatSidebarProps) {
  const [memberMap, setMemberMap] = useState<Record<string, MemberInfo>>({})
  const [groupMemberCounts, setGroupMemberCounts] = useState<Record<string, number>>({})
  const onlineUsers = useOnlineUsers()
  const supabase = createClient()
  const unreadCtx = useChatUnread()
  const unreadCounts = unreadCtx?.conversationUnreadCounts || {}

  const sorted = [...conversations].sort((a, b) => {
    const aUnread = unreadCounts[a.id] ?? a.unread_count ?? 0
    const bUnread = unreadCounts[b.id] ?? b.unread_count ?? 0
    if (aUnread > 0 && bUnread === 0) return -1
    if (aUnread === 0 && bUnread > 0) return 1
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
    return bTime - aTime
  })

  useEffect(() => {
    const fetchMembers = async () => {
      const convIds = conversations.map(c => c.id)
      const { data: allMemberships } = await supabase
        .from('conversation_members')
        .select('conversation_id, user_id')
        .in('conversation_id', convIds)
        .neq('user_id', currentUserId)

      // Track all other members per conversation (for groups)
      const convToMembers: Record<string, string[]> = {}
      const otherIds = new Set<string>()
      for (const m of allMemberships || []) {
        if (!convToMembers[m.conversation_id]) {
          convToMembers[m.conversation_id] = []
        }
        convToMembers[m.conversation_id].push(m.user_id)
        otherIds.add(m.user_id)
      }

      // Store member counts for group chats
      const counts: Record<string, number> = {}
      for (const conv of conversations) {
        if (conv.type === 'group') {
          // +1 for current user
          counts[conv.id] = (convToMembers[conv.id]?.length || 0) + 1
        }
      }
      setGroupMemberCounts(counts)

      if (otherIds.size === 0) { setMemberMap({}); return }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, status, last_seen')
        .in('id', Array.from(otherIds))

      const map: Record<string, MemberInfo> = {}
      for (const conv of conversations) {
        // For DMs, show the single other member; for groups, show the first other member as the avatar
        const firstOtherId = convToMembers[conv.id]?.[0]
        if (firstOtherId) {
          const profile = (profiles || []).find((p: { id: string }) => p.id === firstOtherId)
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
    <div className="w-72 lg:w-80 xl:w-96 h-full flex flex-col shrink-0" style={{ borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Messages</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={unreadCtx?.toggleMute}
            className="p-2 rounded-lg transition-all"
            style={{
              backgroundColor: 'var(--input-bg)',
              color: unreadCtx?.isMuted ? 'var(--text-muted)' : 'var(--text-secondary)',
            }}
            title={unreadCtx?.isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {unreadCtx?.isMuted ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>
          <button
            onClick={onNewGroupChat}
            className="p-2 rounded-lg transition-all"
            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)' }}
            title="New group chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
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
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            No conversations yet
          </div>
        ) : (
          sorted.map((conv) => {
            const member = memberMap[conv.id]
            const statusInfo = member ? getStatusInfo(member.status, member.last_seen) : null
            const liveOnline = member ? onlineUsers.has(member.id) : false
            const convUnread = unreadCounts[conv.id] ?? conv.unread_count ?? 0
            const hasUnread = convUnread > 0
            const isGroup = conv.type === 'group'
            const displayName = isGroup ? (conv.name || 'Unnamed Group') : (member?.username || 'Unknown')
            const groupCount = groupMemberCounts[conv.id]

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
                      {isGroup ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      ) : member?.avatar_url ? (
                        <Avatar src={member.avatar_url} size={40} />
                      ) : (
                        <span className="text-white font-medium text-sm">
                          {member?.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    {!isGroup && statusInfo && (
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${liveOnline ? 'bg-emerald-400' : statusInfo.color}`} style={{ borderColor: 'var(--bg-primary)' }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate ${hasUnread ? 'font-semibold' : 'font-medium'}`} style={{ color: 'var(--text-primary)' }}>
                        {displayName}
                      </p>
                      {hasUnread && (
                        <span className="flex-shrink-0 min-w-[20px] h-5 flex items-center justify-center px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                          {convUnread > 99 ? '99+' : convUnread}
                        </span>
                      )}
                    </div>
                    {conv.last_message_preview ? (
                      <p className={`text-xs truncate ${hasUnread ? 'font-medium' : ''}`} style={{ color: hasUnread ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {conv.last_message_preview}
                      </p>
                    ) : isGroup ? (
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {groupCount ? `${groupCount} members` : 'Group'}
                      </p>
                    ) : (
                      <p className={`text-xs truncate ${liveOnline ? 'text-emerald-400' : ''}`} style={!liveOnline ? { color: 'var(--text-muted)' } : undefined}>
                        {liveOnline ? 'Online' : (statusInfo?.text || 'Offline')}
                      </p>
                    )}
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
