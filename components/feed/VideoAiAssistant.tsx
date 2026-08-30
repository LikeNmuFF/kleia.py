'use client'

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Bot, Loader2, Send, X } from 'lucide-react'

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
  const [open, setOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [promptDismissed, setPromptDismissed] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const loadSummary = useCallback(async () => {
    if (loadingSummary) return
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
  }, [loadingSummary, postId])

  useEffect(() => {
    const element = containerRef.current
    if (!enabled || !element) return

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.35 },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [enabled])

  useEffect(() => {
    if (!enabled || !isVisible || open || promptDismissed) return

    const timer = window.setTimeout(() => {
      setShowPrompt(true)
    }, 45_000)

    return () => window.clearTimeout(timer)
  }, [enabled, isVisible, open, promptDismissed])

  const openAssistant = () => {
    setOpen(true)
    setShowPrompt(false)
    setPromptDismissed(true)

    if (!summary) {
      void loadSummary()
    }
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

  if (!enabled) return null

  return (
    <div ref={containerRef} className="mt-4">
      {!open && (
        <button
          type="button"
          onClick={openAssistant}
          className="group inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition hover:-translate-y-0.5 hover:border-violet-400/70 active:translate-y-0"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}
          title="Open Kleia AI"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
            <Bot className="h-4 w-4" />
          </span>
          <span className="truncate">Kleia AI</span>
        </button>
      )}

      {showPrompt && !open && (
        <div
          className="mt-3 flex items-start gap-3 rounded-2xl border p-3 shadow-sm"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}
        >
          <button
            type="button"
            onClick={openAssistant}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition hover:scale-105 active:scale-95"
            title="Summarize with Kleia AI"
          >
            <Bot className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={openAssistant}
            className="min-w-0 flex-1 text-left"
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Want a quick summary?</p>
            <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Kleia can summarize this video and answer questions while you watch.
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowPrompt(false)
              setPromptDismissed(true)
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {open && (
        <div className="rounded-2xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(124, 58, 237, 0.06)' }}>
          <div className="flex items-start gap-3 border-b p-3" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Kleia AI video helper</h3>
                {limits && (
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {limits.remainingVideoQuestions} video questions left today
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                {title || videoUrl}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:bg-white/5"
              style={{ color: 'var(--text-muted)' }}
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[70dvh] overflow-y-auto p-3">
            <div className="space-y-2">
              {(loadingSummary || summary) && (
                <div className="mr-4 rounded-2xl rounded-tl-sm px-3 py-2 text-sm leading-relaxed" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}>
                  {loadingSummary ? (
                    <span className="inline-flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Summarizing the video...
                    </span>
                  ) : summary}
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${message.role === 'user' ? 'ml-8 rounded-tr-sm' : 'mr-8 rounded-tl-sm'}`}
                  style={{
                    backgroundColor: message.role === 'user' ? 'rgba(124,58,237,0.20)' : 'var(--card-bg)',
                    color: message.role === 'user' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {message.content}
                </div>
              ))}

              {asking && (
                <div className="inline-flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              )}
            </div>

            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
          </div>

          <form onSubmit={askQuestion} className="flex gap-2 border-t p-3" style={{ borderColor: 'var(--border-color)' }}>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about this video"
              disabled={asking}
              className="min-w-0 flex-1 rounded-full border bg-transparent px-4 py-2 text-sm"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={asking || !question.trim()}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-500 active:scale-95 disabled:opacity-50"
              title="Ask"
            >
              {asking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      )}
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
