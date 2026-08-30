// components/feed/YouTubeEmbed.tsx

'use client'

import { useState } from 'react'
import { getYouTubeEmbedUrl } from '@/lib/youtube/parse'
import type { YouTubeData } from '@/lib/youtube/types'

interface YouTubeEmbedProps {
  data: YouTubeData
}

export default function YouTubeEmbed({ data }: YouTubeEmbedProps) {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0)
  const activeVideo = data.videos[activeVideoIndex]

  if (!activeVideo) return null

  return (
    <div className="mt-3 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
      {/* Main Player */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={getYouTubeEmbedUrl(activeVideo.id)}
          title={activeVideo.title}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>

      {/* Video Title */}
      <div className="p-3" style={{ backgroundColor: 'var(--card-bg)' }}>
        <p className="font-semibold text-sm line-clamp-2" style={{ color: 'var(--text-primary)' }}>
          {activeVideo.title}
        </p>
        {data.type === 'playlist' && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Playlist · {data.videos.length} videos
          </p>
        )}
      </div>

      {/* Playlist Thumbnail Strip */}
      {data.type === 'playlist' && data.videos.length > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto" style={{ backgroundColor: 'var(--card-bg)', borderTop: '1px solid var(--border-color)' }}>
          {data.videos.map((video, index) => (
            <button
              key={video.id}
              onClick={() => setActiveVideoIndex(index)}
              className={`relative flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === activeVideoIndex ? 'border-violet-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] px-1 rounded">
                {index + 1}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
