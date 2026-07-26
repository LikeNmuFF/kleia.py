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
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Create Event
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Event</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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
