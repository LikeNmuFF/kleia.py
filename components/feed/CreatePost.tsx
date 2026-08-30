'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPost } from '@/app/actions/posts'
import type { FeedSubject } from '@/lib/feed/constants'
import { isYouTubeUrl } from '@/lib/youtube/parse'
import type { YouTubeData } from '@/lib/youtube/types'
import LinkPreviewCard, { type LinkPreviewData } from './LinkPreviewCard'
import SubjectPicker from './SubjectPicker'

function extractHttpsUrl(text: string): string | null {
  const match = text.match(/https:\/\/[^\s]+/)
  return match ? match[0].replace(/[),.;!?]+$/, '') : null
}

async function fetchLinkPreview(url: string): Promise<LinkPreviewData | null> {
  const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
  if (!res.ok) return null

  const data = await res.json()
  return data.title || data.image ? data : null
}

async function fetchYouTubeData(url: string): Promise<YouTubeData | null> {
  const res = await fetch(`/api/youtube?url=${encodeURIComponent(url)}`)
  if (!res.ok) return null
  return res.json()
}

export default function CreatePost() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<LinkPreviewData | null>(null)
  const [youtubeData, setYoutubeData] = useState<YouTubeData | null>(null)
  const [subjects, setSubjects] = useState<FeedSubject[]>([])
  const [fetchingPreview, setFetchingPreview] = useState(false)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastFetchedUrl = useRef<string | null>(null)

  const fetchPreview = useCallback(async (url: string) => {
    if (lastFetchedUrl.current === url) return
    lastFetchedUrl.current = url
    setFetchingPreview(true)
    try {
      if (isYouTubeUrl(url)) {
        setPreview(null)
        const data = await fetchYouTubeData(url)
        setYoutubeData(data)
      } else {
        setYoutubeData(null)
        setPreview(await fetchLinkPreview(url))
      }
    } catch {
      setPreview(null)
      setYoutubeData(null)
    } finally {
      setFetchingPreview(false)
    }
  }, [])

  const handleContentChange = useCallback((value: string) => {
    setContent(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const url = extractHttpsUrl(value)
    if (url) {
      debounceRef.current = setTimeout(() => fetchPreview(url), 800)
    } else {
      setPreview(null)
      setYoutubeData(null)
      lastFetchedUrl.current = null
    }
  }, [fetchPreview])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError('')

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    const url = extractHttpsUrl(content)
    let previewToSave = preview
    let youtubeDataToSave = youtubeData

    if (url && !youtubeData && !preview) {
      setFetchingPreview(true)
      try {
        if (isYouTubeUrl(url)) {
          youtubeDataToSave = await fetchYouTubeData(url)
          setYoutubeData(youtubeDataToSave)
        } else {
          previewToSave = await fetchLinkPreview(url)
          setPreview(previewToSave)
        }
        lastFetchedUrl.current = url
      } catch {
        previewToSave = null
        youtubeDataToSave = null
      } finally {
        setFetchingPreview(false)
      }
    }

    const result = await createPost(content, previewToSave ?? undefined, subjects, youtubeDataToSave ?? undefined)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setContent('')
    setPreview(null)
    setYoutubeData(null)
    setSubjects([])
    lastFetchedUrl.current = null
    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Share something with the community... Paste an HTTPS link to preview it"
        className="input-field resize-none min-h-[100px]"
        rows={3}
      />

      {/* Link Preview or YouTube Preview */}
      {(preview || youtubeData || fetchingPreview) && (
        <div className="mt-2">
          {fetchingPreview && !preview && !youtubeData && (
            <div className="flex items-center gap-2 text-xs py-2" style={{ color: 'var(--text-muted)' }}>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Fetching preview...
            </div>
          )}
          {youtubeData && (
            <div className="relative rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <img
                  src={youtubeData.videos[0]?.thumbnail ?? undefined}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <svg className="w-12 h-12 text-white opacity-80" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              <div className="p-2" style={{ backgroundColor: 'var(--card-bg)' }}>
                <p className="font-semibold text-sm line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                  {youtubeData.videos[0]?.title}
                </p>
                {youtubeData.type === 'playlist' && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Playlist · {youtubeData.videos.length} videos
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setYoutubeData(null); lastFetchedUrl.current = null }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors"
                style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
              >
                ✕
              </button>
            </div>
          )}
          {preview && !youtubeData && (
            <div className="relative">
              <LinkPreviewCard preview={preview} />
              <button
                type="button"
                onClick={() => { setPreview(null); lastFetchedUrl.current = null }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors"
                style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-3">
        <SubjectPicker selected={subjects} onChange={setSubjects} />
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
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
