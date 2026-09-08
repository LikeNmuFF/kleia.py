export const FEEDBACK_STATUSES = ['open', 'reviewing', 'planned', 'fixed', 'closed'] as const
export type FeedbackStatus = typeof FEEDBACK_STATUSES[number]
export interface FeedbackReport {
  id: string
  type: string
  status: FeedbackStatus
  title: string
  message: string
  display_name: string | null
  rating: number | null
  page_url: string | null
  allow_public: boolean
  created_at: string
  updated_at: string
}
