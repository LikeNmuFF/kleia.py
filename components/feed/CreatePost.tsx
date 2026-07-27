'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CreatePost() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('posts').insert({
        author_id: user.id,
        content: content.trim(),
        type: 'text',
      })
      setContent('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share something with the community..."
        className="input-field resize-none min-h-[100px]"
        rows={3}
      />
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-5 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-medium text-sm transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  )
}
