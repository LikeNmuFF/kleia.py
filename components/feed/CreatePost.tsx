'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPost } from '@/app/actions/posts'
import LinkPreviewCard, { type LinkPreviewData } from './LinkPreviewCard'

function extractHttpsUrl(text: string): string | null {
  const match = text.match(/https:\/\/[^\s]+/)
  return match ? match[0] : null
}

export default function CreatePost() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<LinkPreviewData | null>(null)
  const [fetchingPreview, setFetchingPreview] = useState(false)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastFetchedUrl = useRef<string | null>(null)

  const fetchPreview = useCallback(async (url: string) => {
    if (lastFetchedUrl.current === url) return
    lastFetchedUrl.current = url
    setFetchingPreview(true)
    try {
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.title || data.image) {
          setPreview(data)
        } else {
          setPreview(null)
        }
      } else {
        setPreview(null)
      }
    } catch {
      setPreview(null)
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

    const result = await createPost(content, preview ?? undefined)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setContent('')
    setPreview(null)
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

      {/* Link Preview */}
      {(preview || fetchingPreview) && (
        <div className="mt-2">
          {fetchingPreview && !preview && (
            <div className="flex items-center gap-2 text-xs py-2" style={{ color: 'var(--text-muted)' }}>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Fetching preview...
            </div>
          )}
          {preview && (
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
