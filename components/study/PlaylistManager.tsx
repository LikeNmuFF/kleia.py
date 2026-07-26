'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Playlist {
  id: string
  title: string
  url: string
  type: string
}

interface PlaylistManagerProps {
  playlists: Playlist[]
}

export default function PlaylistManager({ playlists }: PlaylistManagerProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAdd = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user && title && url) {
      await supabase.from('playlists').insert({
        user_id: user.id,
        title,
        url,
        type: 'link',
      })
      setTitle('')
      setUrl('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Playlists</h2>
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <input
          type="url"
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !title || !url}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      <div className="space-y-2">
        {playlists.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-2 bg-gray-50 rounded hover:bg-gray-100"
          >
            {p.title}
          </a>
        ))}
      </div>
    </div>
  )
}
