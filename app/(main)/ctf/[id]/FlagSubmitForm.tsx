'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Send, XCircle } from 'lucide-react'
import { submitFlag } from '@/app/actions/ctf'
import { useSpecialUser } from '@/lib/context/SpecialUserContext'
import dynamic from 'next/dynamic'
import styles from './FlagSubmitForm.module.css'

const TulipConfetti = dynamic(() => import('@/components/special/TulipConfetti'), { ssr: false })
type FeedbackType = 'success' | 'incorrect' | 'error'

export default function FlagSubmitForm({
  challengeId,
  alreadySolved,
}: {
  challengeId: string
  alreadySolved?: boolean
}) {
  const router = useRouter()
  const { isSpecial } = useSpecialUser()
  const [flag, setFlag] = useState('')
  const [message, setMessage] = useState<{ text: string; type: FeedbackType } | null>(null)
  const [loading, setLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  if (alreadySolved) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-[#0a0a0f] p-4 text-sm font-medium text-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.12)]">
        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
        Challenge solved. Nice work!
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!flag.trim() || loading) return

    setLoading(true)
    setMessage(null)

    try {
      const result = await submitFlag(challengeId, flag)

      if (result.success && result.isCorrect !== undefined) {
        setMessage({
          text: result.message || 'Submitted!',
          type: result.isCorrect ? 'success' : 'incorrect',
        })
        if (result.isCorrect) {
          setFlag('')
          if (isSpecial) {
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 4000)
          }
          router.refresh()
        }
      } else {
        setMessage({ text: (result as { error: string }).error || 'Something went wrong', type: 'error' })
      }
    } catch {
      setMessage({ text: 'Unable to submit the flag. Please try again.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const isSuccess = message?.type === 'success'
  const isIncorrect = message?.type === 'incorrect'
  const isError = message?.type === 'error'
  const inputStateClass = isSuccess
    ? 'border-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.2)] shadow-emerald-500/20'
    : isIncorrect || isError
      ? 'border-red-500 shadow-[0_0_16px_rgba(239,68,68,0.14)]'
      : 'border-white/10 hover:border-white/20'

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-[#0a0a0f] p-4 sm:p-5">
      {showConfetti && <TulipConfetti onComplete={() => setShowConfetti(false)} />}
      <label htmlFor={`flag-${challengeId}`} className="block text-sm font-semibold text-white">
        Submit your flag
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <input
          id={`flag-${challengeId}`}
          type="text"
          name="flag"
          required
          value={flag}
          onChange={(event) => {
            setFlag(event.target.value)
            if (message) setMessage(null)
          }}
          placeholder="Enter flag (e.g. flag{...})"
          className={`w-full min-w-0 flex-1 rounded-xl border bg-white/[0.03] px-4 py-3 font-mono text-sm text-white outline-none transition placeholder:text-white/35 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 ${inputStateClass} ${isIncorrect ? styles.flagShake : ''}`}
          disabled={loading}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={isIncorrect || isError}
          aria-describedby={message ? `flag-feedback-${challengeId}` : undefined}
        />
        <button
          type="submit"
          disabled={loading || !flag.trim()}
          className="w-fit self-start shrink-0 px-6 py-3 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0f] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 sm:self-auto"
        >
          <Send className="h-4 w-4" aria-hidden />
          {loading ? 'Checking…' : 'Submit flag'}
        </button>
      </div>

      {message && (
        <div
          id={`flag-feedback-${challengeId}`}
          role={isSuccess ? 'status' : 'alert'}
          className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${isSuccess ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}
        >
          {isSuccess
            ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            : <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
          <span>{message.text}
          {message.type === 'success' && isSpecial && (
            <span className="ml-1">A tulip for your victory!</span>
          )}</span>
        </div>
      )}
    </form>
  )
}
