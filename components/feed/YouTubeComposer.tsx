// components/feed/YouTubeComposer.tsx

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createPost } from '@/app/actions/posts'
import { isYouTubeUrl } from '@/lib/youtube/parse'
import type { FeedSubject } from '@/lib/feed/constants'
import type { YouTubeData } from '@/lib/youtube/types'
import SubjectPicker from './SubjectPicker'

export default function YouTubeComposer() {
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [subjects, setSubjects] = useState<FeedSubject[]>([])
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [youtubeData, setYoutubeData] = useState<YouTubeData | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleValidate = useCallback(async () => {
    if (!url.trim() || !isYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL')
      return
    }

    setValidating(true)
    setError('')
    setYoutubeData(null)

    try {
      const res = await fetch(`/api/youtube?url=${encodeURIComponent(url)}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to fetch YouTube data')
        return
      }

      const data: YouTubeData = await res.json()
      setYoutubeData(data)
    } catch {
      setError('Failed to fetch YouTube data')
    } finally {
      setValidating(false)
    }
  }, [url])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!youtubeData) return

    setLoading(true)
    setError('')

    const content = description.trim() || youtubeData.videos[0]?.title || 'YouTube video'

    const result = await createPost(content, undefined, subjects, youtubeData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setUrl('')
    setDescription('')
    setSubjects([])
    setYoutubeData(null)
    router.refresh()
    setLoading(false)
  }

  const handleClear = () => {
    setUrl('')
    setDescription('')
    setYoutubeData(null)
    setError('')
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Share YouTube Video</h3>
      </div>

      {/* URL Input */}
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube URL (video or playlist)"
          className="input-field flex-1"
          onBlur={() => url && !youtubeData && handleValidate()}
        />
        <button
          type="button"
          onClick={handleValidate}
          disabled={validating || !url.trim()}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          {validating ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : 'Validate'}
        </button>
      </div>

      {/* Preview */}
      {youtubeData && (
        <div className="mt-3 relative">
          <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <img
                src={youtubeData.videos[0]?.thumbnail || undefined}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <svg className="w-16 h-16 text-white opacity-80" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
            <div className="p-3" style={{ backgroundColor: 'var(--card-bg)' }}>
              <p className="font-semibold text-sm line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                {youtubeData.videos[0]?.title}
              </p>
              {youtubeData.type === 'playlist' && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Playlist · {youtubeData.videos.length} videos
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors"
            style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Description */}
      {youtubeData && (
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description (optional)"
          className="input-field resize-none mt-3"
          rows={2}
        />
      )}

      {/* Subjects */}
      <div className="mt-3">
        <SubjectPicker selected={subjects} onChange={setSubjects} />
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}

      {/* Submit */}
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={loading || !youtubeData}
          className="px-5 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-medium text-sm transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Posting...' : 'Share Video'}
        </button>
      </div>
    </form>
  )
}
