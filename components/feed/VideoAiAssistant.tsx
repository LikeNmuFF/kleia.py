'use client'

import { FormEvent, useState } from 'react'
import { Bot, Loader2, Send, Sparkles } from 'lucide-react'

interface VideoAiAssistantProps {
  postId: string
  videoUrl: string
  title?: string | null
  enabled: boolean
}

interface LimitState {
  remainingDailyQuestions: number
  remainingVideoQuestions: number
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function VideoAiAssistant({ postId, videoUrl, title, enabled }: VideoAiAssistantProps) {
  const [summary, setSummary] = useState('')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [limits, setLimits] = useState<LimitState | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState('')

  if (!enabled) return null

  const loadSummary = async () => {
    setLoadingSummary(true)
    setError('')

    const result = await callVideoAi({ action: 'summary', postId })
    setLoadingSummary(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSummary(result.summary ?? '')
    if (result.limits) setLimits(result.limits)
  }

  const askQuestion = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = question.trim()
    if (!trimmed) return

    setAsking(true)
    setError('')
    setQuestion('')
    setMessages((current) => [...current, { role: 'user', content: trimmed }])

    const result = await callVideoAi({ action: 'question', postId, question: trimmed })
    setAsking(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setMessages((current) => [...current, { role: 'assistant', content: result.answer ?? '' }])
    if (result.limits) setLimits(result.limits)
  }

  return (
    <div className="mt-4 rounded-xl border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(139, 92, 246, 0.06)' }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Kleia AI video helper</h3>
            {limits && (
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {limits.remainingVideoQuestions} video questions left today
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
            {title || videoUrl}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={loadSummary}
          disabled={loadingSummary}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-60"
          style={{ background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }}
        >
          {loadingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {summary ? 'Refresh summary' : 'Summarize video'}
        </button>
      </div>

      {summary && (
        <div className="mt-3 rounded-lg p-3 text-sm whitespace-pre-wrap leading-relaxed" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}>
          {summary}
        </div>
      )}

      {messages.length > 0 && (
        <div className="mt-3 space-y-2">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${message.role === 'user' ? 'ml-8' : 'mr-8'}`}
              style={{
                backgroundColor: message.role === 'user' ? 'rgba(124,58,237,0.18)' : 'var(--card-bg)',
                color: 'var(--text-secondary)',
              }}
            >
              {message.content}
            </div>
          ))}
          {asking && (
            <div className="inline-flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              Thinking...
            </div>
          )}
        </div>
      )}

      <form onSubmit={askQuestion} className="mt-3 flex gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about this video"
          disabled={asking}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm bg-transparent border"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={asking || !question.trim()}
          className="w-10 h-10 rounded-lg inline-flex items-center justify-center text-white disabled:opacity-50"
          style={{ backgroundColor: '#7c3aed' }}
          title="Ask"
        >
          {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}

async function callVideoAi(body: { action: 'summary' | 'question'; postId: string; question?: string }) {
  const response = await fetch('/api/feed-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return response.json()
}
