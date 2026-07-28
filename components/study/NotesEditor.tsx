'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveNote } from '@/app/actions/study'

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

  const handleSave = async () => {
    if (!title.trim()) return
    setLoading(true)
    const result = await saveNote(selectedNote?.id || null, title, content)
    if (result.success) {
      setTitle('')
      setContent('')
      setSelectedNote(null)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Shared Notes</h2>
        {selectedNote && (
          <button
            onClick={() => {
              setSelectedNote(null)
              setTitle('')
              setContent('')
            }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            New Note
          </button>
        )}
      </div>

      {notes.length > 0 && (
        <div className="mb-4 max-h-40 overflow-y-auto space-y-1">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => {
                setSelectedNote(note)
                setTitle(note.title)
                setContent(note.content || '')
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                selectedNote?.id === note.id
                  ? 'bg-violet-600/20 text-violet-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {note.title}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field"
        />
        <textarea
          placeholder="Write your note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="input-field resize-none"
        />
        <button
          onClick={handleSave}
          disabled={loading || !title.trim()}
          className="btn-primary"
        >
          {loading ? 'Saving...' : selectedNote ? 'Update Note' : 'Save Note'}
        </button>
      </div>
    </div>
  )
}
