'use client'

import type { YouTubeData } from '@/lib/youtube/types'

interface YouTubeEmbedProps {
  data: YouTubeData
}

export default function YouTubeEmbed({ data }: YouTubeEmbedProps) {
  if (!data?.videos?.length) return null

  const firstVideo = data.videos[0]
  if (!firstVideo?.video_id) return null

  return (
    <div className="mt-3 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={`https://www.youtube.com/embed/${firstVideo.video_id}`}
          title={firstVideo.title || 'YouTube video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  )
}
