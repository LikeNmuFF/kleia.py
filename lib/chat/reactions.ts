export const CHAT_REACTIONS = [
  { id: 'like', emoji: '\u{1F44D}', label: 'Like' },
  { id: 'heart', emoji: '\u{2764}\u{FE0F}', label: 'Love' },
  { id: 'laugh', emoji: '\u{1F602}', label: 'Laugh' },
  { id: 'wow', emoji: '\u{1F62E}', label: 'Wow' },
  { id: 'sad', emoji: '\u{1F622}', label: 'Sad' },
  { id: 'celebrate', emoji: '\u{1F389}', label: 'Celebrate' },
] as const

export type ReactionId = typeof CHAT_REACTIONS[number]['id']
export type MessageReaction = {
  message_id: string
  conversation_id: string
  user_id: string
  emoji: string
  active: boolean
}

export function isReactionId(value: unknown): value is ReactionId {
  return CHAT_REACTIONS.some((reaction) => reaction.id === value)
}
