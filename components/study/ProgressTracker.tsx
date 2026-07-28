'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addProgress } from '@/app/actions/study'

interface Progress {
  id: string
  subject: string
  hours_studied: number
  date: string
}

interface ProgressTrackerProps {
  progress: Progress[]
}

export default function ProgressTracker({ progress }: ProgressTrackerProps) {
  const [subject, setSubject] = useState('')
  const [hours, setHours] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAdd = async () => {
    if (!subject || !hours) return
    setLoading(true)
    const result = await addProgress(subject, parseFloat(hours))
    if (result.success) {
      setSubject('')
      setHours('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-white mb-4">Progress Tracking</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="flex-1 input-field"
        />
        <input
          type="number"
          placeholder="Hours"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="w-24 input-field"
          step="0.5"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !subject || !hours}
          className="px-4 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-medium transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <div className="space-y-2">
        {progress.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            No progress logged yet. Start tracking your study hours!
          </p>
        ) : (
          progress.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-white text-sm">{p.subject}</span>
              </div>
              <span className="text-gray-400 text-sm font-medium">{p.hours_studied}h</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
