'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CreateEvent() {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('events').insert({
        creator_id: user.id,
        title,
        description,
        start_time: startTime,
        location,
      })
      setTitle('')
      setDescription('')
      setStartTime('')
      setLocation('')
      setIsOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-medium transition-all hover:from-violet-500 hover:to-cyan-500 hover:shadow-lg hover:shadow-violet-500/25"
      >
        Create Event
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121a] rounded-2xl border border-white/10 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create Event</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  placeholder="Event title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  placeholder="What's this event about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="Where will this take place?"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-3 border border-white/10 text-white rounded-xl font-medium hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-medium transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
