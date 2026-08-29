// lib/youtube/types.ts

export interface YouTubeCaption {
  text: string
  start: number
  duration: number
}

export interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  captions: YouTubeCaption[]
}

export interface YouTubeData {
  type: 'video' | 'playlist'
  videos: YouTubeVideo[]
}

export interface YouTubeOEmbedResponse {
  title: string
  thumbnail_url: string
  author_name: string
  author_url: string
  type: string
  width: number
  height: number
}
