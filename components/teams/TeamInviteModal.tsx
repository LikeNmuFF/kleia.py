'use client'

import { useState, useEffect } from 'react'
import { inviteToTeam } from '@/app/actions/teams'

interface User {
  id: string
  username: string
  avatar_url: string | null
}

export default function TeamInviteModal({
  teamId,
  onClose,
}: {
  teamId: string
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const searchUsers = async () => {
      if (search.length < 2) {
        setUsers([])
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`)
        const data = await response.json()
        setUsers(data.users || [])
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(searchUsers, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleInvite = async (userId: string) => {
    setError(null)
    setSuccess(null)

    const result = await inviteToTeam(teamId, userId)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess('Invite sent!')
    setUsers(users.filter(u => u.id !== userId))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md mx-4 rounded-xl p-6"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
        }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Invite Member
        </h2>

        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by username"
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            autoFocus
          />
        </div>

        {error && (
          <p className="text-sm mb-4" style={{ color: '#ef4444' }}>{error}</p>
        )}

        {success && (
          <p className="text-sm mb-4" style={{ color: '#22c55e' }}>{success}</p>
        )}

        <div className="max-h-64 overflow-y-auto mb-4">
          {loading && (
            <div className="text-center py-4">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Searching...</span>
            </div>
          )}

          {!loading && users.length === 0 && search.length >= 2 && (
            <div className="text-center py-4">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>No users found</span>
            </div>
          )}

          {users.map(user => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 rounded-lg mb-2"
              style={{ backgroundColor: 'var(--card-bg)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {user.username[0].toUpperCase()}
                  </span>
                </div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {user.username}
                </span>
              </div>
              <button
                onClick={() => handleInvite(user.id)}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                Invite
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
            style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}