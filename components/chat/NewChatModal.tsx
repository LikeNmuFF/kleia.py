'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getStatusInfo } from '@/lib/utils/time'
import Avatar from '@/components/Avatar'

interface Member {
  id: string
  username: string
  avatar_url: string | null
  status: string | null
  last_seen: string | null
}

interface NewChatModalProps {
  currentUserId: string
  onClose: () => void
  onCreated: (conversationId: string) => void
}

export default function NewChatModal({ currentUserId, onClose, onCreated }: NewChatModalProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
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

  const handleStartChat = async (memberId: string) => {
    setCreating(memberId)
    setError(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Your session expired. Please sign out and sign back in.')
      setCreating(null)
      return
    }

    const { data, error: rpcError } = await supabase.rpc('create_direct_conversation', {
      other_user_id: memberId,
    })

    if (rpcError) {
      setError(rpcError.message)
      setCreating(null)
      return
    }

    if (data?.error) {
      setError(data.error)
      setCreating(null)
      return
    }

    if (data?.conversationId) {
      onCreated(data.conversationId)
    }
    setCreating(null)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] rounded-2xl border border-white/10 p-6 w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">New Chat</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No other members yet</div>
          ) : (
            members.map((member) => {
              const statusInfo = getStatusInfo(member.status, member.last_seen)
              return (
                <button
                  key={member.id}
                  onClick={() => handleStartChat(member.id)}
                  disabled={creating !== null}
                  className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-all flex items-center gap-3 disabled:opacity-50"
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
                      {creating === member.id ? 'Starting chat...' : statusInfo.text}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
