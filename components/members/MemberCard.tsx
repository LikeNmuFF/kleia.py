'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOnlineUsers } from '@/lib/hooks/useOnlineUsers'
import { getStatusInfo } from '@/lib/utils/time'
import Avatar from '@/components/Avatar'

interface Member {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  status: string
  last_seen: string | null
  current_streak?: number
  longest_streak?: number
}

const getStreakLevel = (streak: number) => {
  if (streak >= 30) return { label: 'Legendary', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' }
  if (streak >= 14) return { label: 'Master', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' }
  if (streak >= 7) return { label: 'Expert', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
  if (streak >= 3) return { label: 'Intermediate', color: 'text-green-400 bg-green-500/10 border-green-500/20' }
  return { label: 'Beginner', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
}

export default function MemberCard({ member: initialMember }: { member: Member }) {
  const [member, setMember] = useState(initialMember)
  const onlineUsers = useOnlineUsers()
  const isOnline = onlineUsers.has(member.id)
  const statusInfo = getStatusInfo(member.status, member.last_seen)
  const streak = member.current_streak || 0
  const streakLevel = getStreakLevel(streak)

  const liveOnline = isOnline || (statusInfo.isOnline && !isOnline)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`member-${member.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${member.id}`,
        },
        (payload: { new: Partial<Member> }) => {
          const updated = payload.new
          setMember((prev) => ({
            ...prev,
            status: updated.status ?? prev.status,
            last_seen: updated.last_seen ?? prev.last_seen,
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [member.id])

  return (
    <Link href={`/profile/${encodeURIComponent(member.username)}`} className="block">
      <div className="card">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            {member.avatar_url ? (
              <Avatar src={member.avatar_url} size={48} />
            ) : (
              <span className="text-white font-semibold text-lg">
                {member.username[0].toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {member.full_name || member.username}
          </p>
          <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>@{member.username}</p>
        </div>
      </div>

      {member.bio && (
        <p className="mt-3 text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{member.bio}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${liveOnline ? 'bg-emerald-400' : statusInfo.color}`}
          />
          <span className={`text-xs ${liveOnline ? 'text-emerald-400' : ''}`} style={!liveOnline ? { color: 'var(--text-muted)' } : undefined}>
            {liveOnline ? 'Online' : statusInfo.text}
          </span>
        </div>

        {streak > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full border" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)' }}>
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{streak}</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${streakLevel.color}`}>
              {streakLevel.label}
            </span>
          </div>
        )}
      </div>
      </div>
    </Link>
  )
}
