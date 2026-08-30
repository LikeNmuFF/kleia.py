'use client'

import { useState } from 'react'
import type { CaptionSegment } from '@/lib/youtube/types'

interface TranscriptViewerProps {
  captions?: CaptionSegment[]
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function TranscriptViewer({ captions }: TranscriptViewerProps) {
  const [expanded, setExpanded] = useState(false)

  if (!captions || captions.length === 0) return null

  const visibleCaptions = expanded ? captions : captions.slice(0, 5)

  return (
    <div className="mt-3 rounded-xl border p-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium w-full text-left"
        style={{ color: 'var(--text-primary)' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Transcript ({captions.length} segments)
        <svg className={`w-4 h-4 ml-auto transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
        {visibleCaptions.map((cap, i) => (
          <div key={i} className="flex gap-2 text-xs">
            <span className="shrink-0 font-mono" style={{ color: 'var(--text-muted)' }}>{formatTime(cap.start)}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{cap.text}</span>
          </div>
        ))}
      </div>
      {!expanded && captions.length > 5 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs mt-2 hover:underline"
          style={{ color: 'var(--text-muted)' }}
        >
          Show all {captions.length} segments...
        </button>
      )}
    </div>
  )
}
