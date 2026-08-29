'use client'

import { Bookmark } from 'lucide-react'
import { useState } from 'react'
import { toggleSavedPost } from '@/app/actions/posts'

export default function SavePostButton({ postId, initialSaved }: { postId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved)

  const onToggle = async () => {
    const previous = saved
    setSaved(!previous)

    const result = await toggleSavedPost(postId)
    if (result.error) {
      setSaved(previous)
      return
    }

    setSaved(result.saved ?? !previous)
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="p-2 rounded-lg transition-colors hover:bg-white/5"
      style={{ color: saved ? '#f59e0b' : 'var(--text-muted)' }}
      title={saved ? 'Remove from saved' : 'Save post'}
      aria-pressed={saved}
    >
      <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
    </button>
  )
}
