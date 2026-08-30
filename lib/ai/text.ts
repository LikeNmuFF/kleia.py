export type AiChatRole = 'system' | 'user' | 'assistant'

export interface AiChatMessage {
  role: AiChatRole
  content: string
}

const PROMPT_OVERRIDE_PATTERNS = [
  /\bignore\s+(?:all\s+)?instructions\b/gi,
  /\bignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions\b/gi,
  /\bdisregard\s+(?:all\s+)?instructions\b/gi,
  /\bdisregard\s+(?:all\s+)?(?:previous|prior|above)\s+instructions\b/gi,
  /\bforget\s+(?:all\s+)?instructions\b/gi,
  /\bforget\s+(?:all\s+)?(?:previous|prior|above)\s+instructions\b/gi,
  /\bsystem\s*:/gi,
  /\bdeveloper\s*:/gi,
]

export function sanitizePromptText(text: string): string {
  return PROMPT_OVERRIDE_PATTERNS.reduce(
    (clean, pattern) => clean.replace(pattern, ''),
    text,
  )
    .replace(/^[\s.,!?;:]+/, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim()
}

export function cleanAiResponseText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
