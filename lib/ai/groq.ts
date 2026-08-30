import 'server-only'

import type { AiChatMessage } from './text'
import { getGroqModel } from './groq-model'

export { getGroqModel } from './groq-model'

interface GroqChoice {
  message?: {
    content?: string
  }
}

interface GroqChatResponse {
  choices?: GroqChoice[]
  error?: {
    message?: string
  }
}

export async function runGroqChat(messages: AiChatMessage[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('Groq API key is not configured')
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: getGroqModel(),
      messages,
      temperature: 0.2,
      max_tokens: 700,
    }),
  })

  const data = (await response.json().catch(() => ({}))) as GroqChatResponse
  if (!response.ok) {
    throw new Error(data.error?.message || 'Groq request failed')
  }

  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('Groq returned an empty response')
  }

  return content
}
