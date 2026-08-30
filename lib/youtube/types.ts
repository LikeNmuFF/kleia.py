export interface CaptionSegment {
  text: string
  start: number
  duration: number
}

export interface YouTubeVideo {
  video_id: string
  title: string | null
  thumbnail: string | null
  captions?: CaptionSegment[]
}

export interface YouTubeData {
  type: 'video' | 'playlist'
  videos: YouTubeVideo[]
}
