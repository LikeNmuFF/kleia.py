'use client'

import { useEffect, useState } from 'react'
import { Search, Shield, ShieldOff, Flame, Trash2, Star, ArrowUpDown, PenTool } from 'lucide-react'
import { getAdminUsers, updateUserRole, resetUserStreak, deleteUser } from '@/app/actions/admin'

interface User {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  role: string
  status: string
  last_seen: string | null
  current_streak: number
  longest_streak: number
  created_at: string
}

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'current_streak' | 'username'>('created_at')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAdminUsers().then(d => { setUsers(d.users); setCurrentUserId(d.currentUserId); setLoading(false) })
  }, [])

  const filtered = users
    .filter(u => {
      if (search && !u.username.toLowerCase().includes(search.toLowerCase()) && !u.full_name?.toLowerCase().includes(search.toLowerCase())) return false
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'current_streak') return b.current_streak - a.current_streak
      if (sortBy === 'username') return a.username.localeCompare(b.username)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const handleRoleChange = async (userId: string, role: string) => {
    setError(null)
    const result = await updateUserRole(userId, role)
    if (!result.error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    } else {
      setError(result.error)
    }
  }

  const handleResetStreak = async (userId: string) => {
    if (!confirm('Reset this user\'s streak to 0?')) return
    setError(null)
    const result = await resetUserStreak(userId)
    if (!result.error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, current_streak: 0 } : u))
    } else {
      setError(result.error)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user permanently? This cannot be undone.')) return
    setError(null)
    const result = await deleteUser(userId)
    if (!result.error) {
      setUsers(prev => prev.filter(u => u.id !== userId))
    } else {
      setError(result.error)
    }
  }

  const roleColors: Record<string, string> = {
    admin: '#ef4444',
    special: '#a855f7',
    faculty: '#0ea5e9',
    contributor: '#22c55e',
    user: '#6b7280',
  }

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--card-bg)' }} />)}</div>
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="special">Special</option>
          <option value="faculty">Faculty</option>
          <option value="contributor">Contributor</option>
          <option value="user">User</option>
        </select>
        <button
          onClick={() => setSortBy(sortBy === 'created_at' ? 'current_streak' : sortBy === 'current_streak' ? 'username' : 'created_at')}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm border transition-colors hover:bg-white/5"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sortBy === 'created_at' ? 'Newest' : sortBy === 'current_streak' ? 'Top Streaks' : 'A-Z'}
        </button>
      </div>

      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {filtered.length} user{filtered.length !== 1 ? 's' : ''}
      </p>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* User List */}
      <div className="space-y-2">
        {filtered.map(user => (
          <div key={user.id} className="rounded-xl p-4 flex items-center gap-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <span className="text-white font-semibold">{user.username[0].toUpperCase()}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {user.full_name || user.username}
                </p>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full capitalize font-medium"
                  style={{ backgroundColor: `${roleColors[user.role] || '#6b7280'}15`, color: roleColors[user.role] || '#6b7280' }}
                >
                  {user.role}
                </span>
                {user.id === currentUserId && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400">You</span>
                )}
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                @{user.username} · {user.current_streak > 0 ? `${user.current_streak} day streak` : 'No streak'} · Joined {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Actions */}
            {user.id !== currentUserId && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {user.role !== 'admin' && (
                  <button
                    onClick={() => handleRoleChange(user.id, 'admin')}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-red-400"
                    title="Make admin"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                )}
                {user.role !== 'special' && (
                  <button
                    onClick={() => handleRoleChange(user.id, 'special')}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-purple-400"
                    title="Make special"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                {user.role !== 'faculty' && (
                  <button
                    onClick={() => handleRoleChange(user.id, 'faculty')}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-sky-400"
                    title="Make faculty"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                )}
                {user.role !== 'contributor' && (
                  <button
                    onClick={() => handleRoleChange(user.id, 'contributor')}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-emerald-400"
                    title="Make challenge contributor"
                  >
                    <PenTool className="w-4 h-4" />
                  </button>
                )}
                {user.role !== 'user' && (
                  <button
                    onClick={() => handleRoleChange(user.id, 'user')}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400"
                    title="Make regular user"
                  >
                    <ShieldOff className="w-4 h-4" />
                  </button>
                )}
                {user.current_streak > 0 && (
                  <button
                    onClick={() => handleResetStreak(user.id)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-orange-400"
                    title="Reset streak"
                  >
                    <Flame className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(user.id)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-red-400"
                  title="Delete user"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
