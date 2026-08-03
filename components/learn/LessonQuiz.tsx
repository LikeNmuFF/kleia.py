'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, Trophy, ArrowRight } from 'lucide-react'
import { completeLesson } from '@/app/actions/learn'
import {
  isFillAnswerCorrect,
  type LearnLesson,
  type LearnQuestion,
} from '@/lib/utils/learn'

interface AnswerState {
  value: string
  correct: boolean
  answered: boolean
}

export default function LessonQuiz({
  lesson,
  topicSlug,
  alreadyCompleted,
}: {
  lesson: LearnLesson
  topicSlug: string
  alreadyCompleted: boolean
}) {
  const router = useRouter()
  const questions: LearnQuestion[] = lesson.questions ?? []
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({})
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const [alreadyDone, setAlreadyDone] = useState(alreadyCompleted)
  const [error, setError] = useState('')

  const current = questions[currentIndex]
  const answer = current ? answers[String(current.id)] : undefined
  const allAnswered = questions.every((q) => answers[String(q.id)]?.answered)

  if (alreadyDone) {
    return (
      <div
        className="flex flex-col items-center gap-4 p-10 rounded-xl text-center"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid rgba(34,197,94,0.4)' }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}
        >
          <Trophy className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Lesson completed!
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            You already earned {lesson.xp_reward} XP from this lesson.
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href={`/learn/${topicSlug}`}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}
          >
            Back to topic
          </a>
          <a
            href="/learn"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }}
          >
            Browse lessons
          </a>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div
        className="flex flex-col items-center gap-4 p-10 rounded-xl text-center"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid rgba(34,197,94,0.4)' }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}
        >
          <Trophy className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Lesson complete!
          </h3>
          {xpEarned > 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>
              You earned <span className="font-bold text-violet-400">{xpEarned} XP</span>. Keep it up!
            </p>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>
              Lesson already completed — nice review!
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <a
            href={`/learn/${topicSlug}`}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}
          >
            Back to topic
          </a>
          <a
            href="/learn"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }}
          >
            Browse lessons
          </a>
        </div>
      </div>
    )
  }

  if (!current) {
    return (
      <div
        className="p-8 rounded-xl text-center"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
      >
        <p style={{ color: 'var(--text-secondary)' }}>No questions in this lesson yet.</p>
      </div>
    )
  }

  const submitAnswer = (value: string) => {
    if (answer?.answered) return
    const correct = current.type === 'mcq'
      ? value === current.answer
      : isFillAnswerCorrect(value, current)

    setAnswers((prev) => ({
      ...prev,
      [String(current.id)]: { value, correct, answered: true },
    }))
  }

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const prevQuestion = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  const finish = async () => {
    setLoading(true)
    setError('')

    const payload: Record<string, string> = {}
    for (const q of questions) {
      payload[String(q.id)] = answers[String(q.id)]?.value ?? ''
    }

    const result = await completeLesson(lesson.id, payload)

    if (result.success) {
      setXpEarned((result as { xpEarned: number }).xpEarned ?? 0)
      setCompleted(true)
      router.refresh()
    } else {
      setError((result as { error: string }).error || 'Something went wrong')
    }
    setLoading(false)
  }

  const progressPercent = Math.round((Object.keys(answers).length / questions.length) * 100)

  return (
    <div
      className="rounded-xl p-6"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
    >
      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
          Question {currentIndex + 1} / {questions.length}
        </span>
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--input-bg)' }}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        {current.prompt}
      </h3>

      {current.code && (
        <pre
          className="p-4 rounded-lg mb-4 text-sm overflow-x-auto"
          style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          {current.code}
        </pre>
      )}

      {current.type === 'mcq' ? (
        <div className="space-y-2">
          {(current.options || []).map((option) => {
            const isSelected = answer?.value === option
            const showCorrect = answer?.answered && option === current.answer
            const showWrong = answer?.answered && isSelected && !answer.correct

            return (
              <button
                key={option}
                onClick={() => submitAnswer(option)}
                disabled={!!answer?.answered}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all border ${
                  showCorrect
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : showWrong
                      ? 'bg-red-500/10 border-red-500/40 text-red-400'
                      : answer?.answered
                        ? 'opacity-50'
                        : 'hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: showCorrect
                    ? 'rgba(34,197,94,0.1)'
                    : showWrong
                      ? 'rgba(239,68,68,0.1)'
                      : undefined,
                  borderColor: showCorrect
                    ? 'rgba(34,197,94,0.4)'
                    : showWrong
                      ? 'rgba(239,68,68,0.4)'
                      : 'var(--border-color)',
                  color: showCorrect
                    ? '#22c55e'
                    : showWrong
                      ? '#ef4444'
                      : 'var(--text-primary)',
                }}
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{option}</span>
                  {showCorrect && <Check className="w-4 h-4" />}
                  {showWrong && <X className="w-4 h-4" />}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={answer?.value ?? ''}
            onChange={(e) => {
              const value = e.target.value
              setAnswers((prev) => ({
                ...prev,
                [String(current.id)]: {
                  value,
                  correct: false,
                  answered: false,
                },
              }))
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (answer?.value ?? '').trim()) {
                submitAnswer((answer?.value ?? '').trim())
              }
            }}
            disabled={answer?.answered}
            placeholder="Type your answer..."
            className="flex-1 px-3 py-2.5 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={() => submitAnswer((answer?.value ?? '').trim())}
            disabled={answer?.answered || !(answer?.value ?? '').trim()}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }}
          >
            Check
          </button>
        </div>
      )}

      {/* Feedback */}
      {answer?.answered && (
        <div
          className="mt-4 p-4 rounded-lg text-sm"
          style={{
            backgroundColor: answer.correct
              ? 'rgba(34,197,94,0.1)'
              : 'rgba(239,68,68,0.1)',
            border: `1px solid ${
              answer.correct ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'
            }`,
          }}
        >
          <p className="font-medium mb-1" style={{ color: answer.correct ? '#22c55e' : '#ef4444' }}>
            {answer.correct ? '✓ Correct!' : '✗ Not quite'}
          </p>
          {!answer.correct && current.type === 'fill' && (
            <p className="mb-1" style={{ color: 'var(--text-secondary)' }}>
              Correct answer: <code className="font-mono">{current.answer}</code>
            </p>
          )}
          <p style={{ color: 'var(--text-secondary)' }}>{current.explanation}</p>
        </div>
      )}

      {/* Nav buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 transition-all"
          style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}
        >
          Previous
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={nextQuestion}
            disabled={!answer?.answered}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 transition-all flex items-center gap-1"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }}
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={!allAnswered || loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 transition-all flex items-center gap-1"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              'Finish Lesson'
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm" style={{ color: '#ef4444' }}>
          {error}
        </p>
      )}
    </div>
  )
}
