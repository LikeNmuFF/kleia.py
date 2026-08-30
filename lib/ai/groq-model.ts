export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-20b'

export function getGroqModel(): string {
  return process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL
}
