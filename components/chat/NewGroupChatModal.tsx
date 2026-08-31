'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getStatusInfo } from '@/lib/utils/time'
import { createGroupConversation } from '@/app/actions/chat'
import Avatar from '@/components/Avatar'

interface Member {
  id: string
  username: string
  avatar_url: string | null
  status: string | null
  last_seen: string | null
}

interface NewGroupChatModalProps {
  currentUserId: string
  onClose: () => void
  onCreated: (conversationId: string) => void
}

export default function NewGroupChatModal({ currentUserId, onClose, onCreated }: NewGroupChatModalProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [groupName, setGroupName] = useState('')
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, status, last_seen')
        .neq('id', currentUserId)
        .order('username')

      if (data) setMembers(data)
      setLoading(false)
    }

    fetchMembers()
  }, [currentUserId, supabase])

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const filteredMembers = members.filter((m) =>
    m.username.toLowerCase().includes(search.toLowerCase())
  )

  const selectedMembers = members.filter((m) => selectedIds.has(m.id))

  const handleCreate = async () => {
    if (selectedIds.size === 0 || !groupName.trim()) return

    setCreating(true)
    setError(null)

    const result = await createGroupConversation(Array.from(selectedIds), groupName)

    if ('error' in result) {
      setError(result.error as string)
      setCreating(false)
      return
    }

    onCreated(result.conversationId)
    setCreating(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] rounded-2xl border border-white/10 p-6 w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">New Group Chat</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Group name input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Group Name</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Study Group, Project Team..."
            maxLength={100}
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        {/* Selected members chips */}
        {selectedMembers.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedMembers.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full text-xs text-violet-300"
              >
                {m.username}
                <button
                  onClick={() => toggleMember(m.id)}
                  className="hover:text-white transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
          />
        </div>

        {/* Members list */}
        <div className="flex-1 overflow-y-auto space-y-1 -mx-1">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading members...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {search ? 'No members match your search' : 'No other members yet'}
            </div>
          ) : (
            filteredMembers.map((member) => {
              const statusInfo = getStatusInfo(member.status, member.last_seen)
              const isSelected = selectedIds.has(member.id)
              return (
                <button
                  key={member.id}
                  onClick={() => toggleMember(member.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                    isSelected ? 'bg-violet-500/15 border border-violet-500/30' : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      {member.avatar_url ? (
                        <Avatar src={member.avatar_url} size={40} />
                      ) : (
                        <span className="text-white font-medium text-sm">
                          {member.username[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#12121a] ${statusInfo.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{member.username}</p>
                    <p className={`text-xs ${statusInfo.isOnline ? 'text-emerald-400' : 'text-gray-500'}`}>
                      {statusInfo.text}
                    </p>
                  </div>
                  {isSelected && (
                    <svg className="w-5 h-5 text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Create button */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={handleCreate}
            disabled={creating || selectedIds.size === 0 || !groupName.trim()}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-medium transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Create Group ({selectedIds.size} {selectedIds.size === 1 ? 'member' : 'members'})
              </>
            )}
          </button>
          {error && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
