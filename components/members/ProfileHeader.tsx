'use client'

import { useEffect, useState } from 'react'
import { Calendar, Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getStatusInfo } from '@/lib/utils/time'

interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  status: string
  last_seen: string | null
  current_streak: number
  longest_streak: number
  created_at: string
}

interface ProfileHeaderProps {
  profile: Profile
}

const getStreakLevel = (streak: number) => {
  if (streak >= 30) return { label: 'Legendary', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' }
  if (streak >= 14) return { label: 'Master', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' }
  if (streak >= 7) return { label: 'Expert', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
  if (streak >= 3) return { label: 'Intermediate', color: 'text-green-400 bg-green-500/10 border-green-500/20' }
  return { label: 'Beginner', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
}

export default function ProfileHeader({ profile: initialProfile }: ProfileHeaderProps) {
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const statusInfo = getStatusInfo(profile.status, profile.last_seen)
  const streak = profile.current_streak || 0
  const streakLevel = getStreakLevel(streak)
  const joined = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  })

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`profile-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`,
        },
        (payload: { new: Partial<Profile> }) => {
          const updated = payload.new
          setProfile((prev) => ({
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
  }, [profile.id])

  return (
    <div className="card">
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <span className="text-white font-semibold text-3xl">
                {profile.username[0].toUpperCase()}
              </span>
            )}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 ${statusInfo.color}`}
            style={{ borderColor: 'var(--bg-secondary)' }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {profile.full_name || profile.username}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>@{profile.username}</p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm">
              <span className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
              <span className={statusInfo.isOnline ? 'text-emerald-400' : ''} style={!statusInfo.isOnline ? { color: 'var(--text-muted)' } : undefined}>
                {statusInfo.text}
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Calendar className="w-3.5 h-3.5" />
              Joined {joined}
            </span>
          </div>
        </div>

        {streak > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full border" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)' }}>
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{streak}</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full border ${streakLevel.color}`}>
              {streakLevel.label}
            </span>
          </div>
        )}
      </div>

      {profile.bio && (
        <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {profile.bio}
        </p>
      )}
    </div>
  )
}
