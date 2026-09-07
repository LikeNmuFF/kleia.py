export interface ChatMessage {
  id: string
  content: string
  created_at: string
  sender_id: string
  read: boolean
  reply_to_id: string | null
}

export interface ReplyTarget {
  id: string
  content: string
  username: string
}
