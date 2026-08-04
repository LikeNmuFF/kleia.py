'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getPendingInvites, acceptInvite } from '@/app/actions/teams'

interface PendingInvite {
  id: string
  team_id: string
  team_name: string
  invited_by: string
  inviter_name: string
  created_at: string
}

export default function TeamInviteNotification() {
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [accepting, setAccepting] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchInvites = async () => {
      const data = await getPendingInvites()
      setInvites(data)
    }
    fetchInvites()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAccept = async (inviteId: string) => {
    setAccepting(inviteId)
    const result = await acceptInvite(inviteId)
    if (result.success) {
      setInvites(invites.filter(i => i.id !== inviteId))
      router.refresh()
    }
    setAccepting(null)
  }

  const handleDecline = async (inviteId: string) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase
      .from('team_invites')
      .update({ status: 'declined' })
      .eq('id', inviteId)
    setInvites(invites.filter(i => i.id !== inviteId))
  }

  if (invites.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative px-3 py-2 rounded-lg text-sm transition-all"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span className="text-lg">🔔</span>
        <span
          className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
          style={{ backgroundColor: '#ef4444' }}
        >
          {invites.length}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl z-50 overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Team Invites ({invites.length})
            </h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {invites.map(invite => (
              <div
                key={invite.id}
                className="p-3 border-b last:border-b-0"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">👥</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {invite.team_name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Invited by {invite.inviter_name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(invite.id)}
                    disabled={accepting === invite.id}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                    style={{ backgroundColor: '#22c55e', color: 'white' }}
                  >
                    {accepting === invite.id ? 'Joining...' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleDecline(invite.id)}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
