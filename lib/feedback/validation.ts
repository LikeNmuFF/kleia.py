export const FEEDBACK_TYPES = [
  'app_feedback',
  'bug_report',
  'error_report',
  'feature_suggestion',
] as const

export type FeedbackType = typeof FEEDBACK_TYPES[number]

export interface FeedbackInput {
  type: string
  rating: string
  title: string
  message: string
  pageUrl: string
  allowPublic: boolean
}

export interface NormalizedFeedbackInput {
  type: FeedbackType
  rating: number | null
  title: string
  message: string
  pageUrl: string | null
  allowPublic: boolean
}

export type FeedbackValidationResult =
  | NormalizedFeedbackInput
  | { error: string }

export function isFeedbackType(value: string): value is FeedbackType {
  return FEEDBACK_TYPES.includes(value as FeedbackType)
}

export function normalizeFeedbackInput(input: FeedbackInput): FeedbackValidationResult {
  const title = input.title.trim()
  const message = input.message.trim()
  const pageUrl = input.pageUrl.trim()

  if (!isFeedbackType(input.type)) {
    return { error: 'Choose a valid feedback type.' }
  }

  if (title.length < 3) {
    return { error: 'Add a short title with at least 3 characters.' }
  }

  if (title.length > 120) {
    return { error: 'Keep the title under 120 characters.' }
  }

  if (message.length < 10) {
    return { error: 'Add details with at least 10 characters.' }
  }

  if (message.length > 4000) {
    return { error: 'Keep the details under 4000 characters.' }
  }

  if (pageUrl.length > 500) {
    return { error: 'Keep the page URL under 500 characters.' }
  }

  const rating = Number(input.rating)
  const isAppFeedback = input.type === 'app_feedback'

  if (isAppFeedback && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return { error: 'Choose a star rating from 1 to 5.' }
  }

  return {
    type: input.type,
    rating: isAppFeedback ? rating : null,
    title,
    message,
    pageUrl: pageUrl || null,
    allowPublic: isAppFeedback ? input.allowPublic : false,
  }
}
