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
    <div className="card">
      <h2 className="text-xl font-semibold text-white mb-4">Playlists</h2>

      {/* Add Form */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 input-field"
        />
        <input
          type="url"
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 input-field"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !title || !url}
          className="px-4 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-medium transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {/* Playlists List */}
      <div className="space-y-2">
        {playlists.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            No playlists yet. Add your first study playlist!
          </p>
        ) : (
          playlists.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium truncate group-hover:text-violet-400 transition-colors">
                  {p.title}
                </p>
                <p className="text-xs text-gray-500 truncate">{p.url}</p>
              </div>
              <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))
        )}
      </div>
    </div>
  )
}
