'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Note {
  id: string
  title: string
  content: string | null
  tags: string[] | null
}

interface NotesEditorProps {
  notes: Note[]
}

export default function NotesEditor({ notes }: NotesEditorProps) {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSave = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      if (selectedNote) {
        await supabase
          .from('shared_notes')
          .update({ title, content })
          .eq('id', selectedNote.id)
      } else {
        await supabase.from('shared_notes').insert({
          author_id: user.id,
          title,
          content,
        })
      }
      setTitle('')
      setContent('')
      setSelectedNote(null)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Shared Notes</h2>
      <div className="space-y-2 mb-4">
        {notes.map((note) => (
          <button
            key={note.id}
            onClick={() => {
              setSelectedNote(note)
              setTitle(note.title)
              setContent(note.content || '')
            }}
            className="w-full text-left p-2 rounded hover:bg-gray-100"
          >
            {note.title}
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder="Note title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 mb-2"
      />
      <textarea
        placeholder="Write your note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        className="w-full border rounded-lg px-3 py-2 mb-2"
      />
      <button
        onClick={handleSave}
        disabled={loading || !title.trim()}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Note'}
      </button>
    </div>
  )
}
