// components/feed/TranscriptViewer.tsx

'use client'

import { useState } from 'react'
import type { YouTubeCaption } from '@/lib/youtube/types'

interface TranscriptViewerProps {
  captions: YouTubeCaption[]
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function TranscriptViewer({ captions }: TranscriptViewerProps) {
  const [expanded, setExpanded] = useState(false)

  if (!captions || captions.length === 0) return null

  return (
    <div className="mt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-sm font-medium transition-colors hover:bg-white/5"
        style={{ color: 'var(--text-primary)' }}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Transcript
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-3 max-h-64 overflow-y-auto">
          <div className="space-y-2">
            {captions.map((caption, index) => (
              <div key={index} className="flex gap-2 text-sm">
                <span className="font-mono text-xs shrink-0 w-12" style={{ color: 'var(--text-muted)' }}>
                  {formatTime(caption.start)}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>{caption.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
