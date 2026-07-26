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
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share something with the community..."
        className="w-full border rounded-lg p-3 resize-none"
        rows={3}
      />
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  )
}
