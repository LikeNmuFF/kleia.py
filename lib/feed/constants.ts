export const FEED_SUBJECTS = [
  'general',
  'python',
  'linux',
  'web',
  'crypto',
  'forensics',
  'career',
  'resources',
] as const

export const POST_REACTIONS = ['like', 'helpful', 'upvote'] as const

export type FeedSubject = (typeof FEED_SUBJECTS)[number]
export type ReactionType = (typeof POST_REACTIONS)[number]

export function isFeedSubject(value: string): value is FeedSubject {
  return FEED_SUBJECTS.includes(value as FeedSubject)
}

export function isPostReaction(value: string): value is ReactionType {
  return POST_REACTIONS.includes(value as ReactionType)
}

export function normalizeSubjects(values: string[]): FeedSubject[] {
  return Array.from(new Set(values.filter(isFeedSubject)))
}
