'use client'

import { useEffect, useState } from 'react'
import { Calendar, Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import TulipSVG from '@/components/special/TulipSVG'
import { getStatusInfo } from '@/lib/utils/time'
import { useOnlineUsers } from '@/lib/hooks/useOnlineUsers'
import { motion, AnimatePresence } from 'framer-motion'

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
  role?: string
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

function FloatingPetal({ delay, left }: { delay: number; left: number }) {
  const duration = 5 + Math.random() * 3
  const size = 10 + Math.random() * 8

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${left}%`, top: '-2%' }}
      initial={{ y: -10, opacity: 0, rotate: 0 }}
      animate={{
        y: '110%',
        opacity: [0, 0.6, 0.6, 0],
        rotate: 360 + Math.random() * 180,
        x: [0, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 40],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    >
      <TulipSVG variant="petal" size={size} opacity={0.5} />
    </motion.div>
  )
}

function SpecialProfileDecor({ isSpecial }: { isSpecial: boolean }) {
  if (!isSpecial) return null

  return (
    <>
      {/* Floating petals behind the card */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
        {Array.from({ length: 6 }).map((_, i) => (
          <FloatingPetal key={i} delay={i * 0.8} left={10 + i * 14} />
        ))}
      </div>

      {/* Purple gradient border glow */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(139,92,246,0.06), rgba(192,132,252,0.12))',
          border: '1px solid rgba(168,85,247,0.2)',
        }}
      />
    </>
  )
}

export default function ProfileHeader({ profile: initialProfile }: ProfileHeaderProps) {
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const onlineUsers = useOnlineUsers()
  const isOnline = onlineUsers.has(profile.id)
  const statusInfo = getStatusInfo(profile.status, profile.last_seen)
  const liveOnline = isOnline || (statusInfo.isOnline && !isOnline)
  const streak = profile.current_streak || 0
  const streakLevel = getStreakLevel(streak)
  const isSpecial = profile.role === 'special'
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
    <motion.div
      className="card relative overflow-hidden"
      initial={isSpecial ? { opacity: 0, y: 20 } : undefined}
      animate={isSpecial ? { opacity: 1, y: 0 } : undefined}
      transition={isSpecial ? { duration: 0.6, ease: 'easeOut' } : undefined}
    >
      <SpecialProfileDecor isSpecial={isSpecial} />

      <div className="relative z-10 flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            {profile.avatar_url ? (
              <Avatar src={profile.avatar_url} size={80} isSpecial={isSpecial} />
            ) : (
              <span className="text-white font-semibold text-3xl">
                {profile.username[0].toUpperCase()}
              </span>
            )}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 ${liveOnline ? 'bg-emerald-400' : statusInfo.color}`}
            style={{ borderColor: 'var(--bg-secondary)' }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold truncate flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            {profile.full_name || profile.username}
            {isSpecial && (
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <TulipSVG variant="flower" size={22} />
              </motion.span>
            )}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>@{profile.username}</p>

          {isSpecial && (
            <motion.p
              className="text-xs mt-1 font-medium"
              style={{ color: '#a855f7' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              A community gem
            </motion.p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm">
              <span className={`w-2 h-2 rounded-full ${liveOnline ? 'bg-emerald-400' : statusInfo.color}`} />
              <span className={liveOnline ? 'text-emerald-400' : ''} style={!liveOnline ? { color: 'var(--text-muted)' } : undefined}>
                {liveOnline ? 'Online' : statusInfo.text}
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
        <p className="mt-4 text-sm leading-relaxed relative z-10" style={{ color: 'var(--text-secondary)' }}>
          {profile.bio}
        </p>
      )}
    </motion.div>
  )
}
