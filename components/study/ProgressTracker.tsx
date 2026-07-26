'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
  const supabase = createClient()

  const handleAdd = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user && subject && hours) {
      await supabase.from('progress_tracking').insert({
        user_id: user.id,
        subject,
        hours_studied: parseFloat(hours),
      })
      setSubject('')
      setHours('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Progress Tracking</h2>
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <input
          type="number"
          placeholder="Hours"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="w-24 border rounded-lg px-3 py-2"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !subject || !hours}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      <div className="space-y-2">
        {progress.map((p) => (
          <div key={p.id} className="flex justify-between p-2 bg-gray-50 rounded">
            <span>{p.subject}</span>
            <span className="text-gray-600">{p.hours_studied}h</span>
          </div>
        ))}
      </div>
    </div>
  )
}
