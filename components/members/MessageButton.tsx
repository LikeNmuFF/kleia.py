'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function MessageButton({ userId, blocked = false }: { userId: string; blocked?: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  if (blocked) return null

  const handleMessage = async () => {
    setLoading(true)
    setError(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Your session expired. Please sign out and sign back in.')
      setLoading(false)
      return
    }

    const { data, error: rpcError } = await supabase.rpc('create_direct_conversation', {
      other_user_id: userId,
    })

    if (rpcError) {
      console.error('create_direct_conversation failed', rpcError)
      setError('Failed to start conversation. Please try again.')
      setLoading(false)
      return
    }

    if (data?.error) {
      setError(data.error)
      setLoading(false)
      return
    }

    if (data?.conversationId) {
      router.push(`/chat?conversation=${data.conversationId}`)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleMessage}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-medium transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50"
      >
        <MessageCircle className="w-4 h-4" />
        {loading ? 'Opening...' : 'Message'}
      </button>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
