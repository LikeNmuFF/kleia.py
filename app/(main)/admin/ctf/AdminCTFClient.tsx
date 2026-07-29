'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createChallenge, updateChallenge, deleteChallenge } from '@/app/actions/ctf'

interface Challenge {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  points: number
  hint: string | null
  is_active: boolean
  created_at: string
}

const CATEGORIES = ['web', 'crypto', 'pwn', 'forensics', 'misc']
const DIFFICULTIES = ['easy', 'medium', 'hard']

export default function AdminCTFClient({ challenges }: { challenges: Challenge[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const clearMessages = () => { setError(''); setSuccess('') }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearMessages()
    const form = new FormData(e.currentTarget)
    const result = await createChallenge({
      title: form.get('title') as string,
      description: form.get('description') as string,
      category: form.get('category') as string,
      difficulty: form.get('difficulty') as string,
      points: parseInt(form.get('points') as string),
      flag: form.get('flag') as string,
      hint: form.get('hint') as string || undefined,
    })

    if (result.error) setError(result.error)
    else {
      setSuccess('Challenge created!')
      setShowCreate(false)
      router.refresh()
    }
  }

  const handleUpdate = async (id: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearMessages()
    const form = new FormData(e.currentTarget)
    const result = await updateChallenge(id, {
      title: form.get('title') as string,
      description: form.get('description') as string,
      category: form.get('category') as string,
      difficulty: form.get('difficulty') as string,
      points: parseInt(form.get('points') as string),
      flag: (form.get('flag') as string) || undefined,
      hint: form.get('hint') as string || undefined,
    })

    if (result.error) setError(result.error)
    else {
      setSuccess('Challenge updated!')
      setEditingId(null)
      router.refresh()
    }
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    clearMessages()
    const result = await updateChallenge(id, { is_active: !current })
    if (result.error) setError(result.error)
    else {
      setSuccess(`Challenge ${current ? 'deactivated' : 'activated'}`)
      router.refresh()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this challenge permanently?')) return
    clearMessages()
    const result = await deleteChallenge(id)
    if (result.error) setError(result.error)
    else {
      setSuccess('Challenge deleted')
      router.refresh()
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{success}</div>
      )}

      <button
        onClick={() => { setShowCreate(!showCreate); setEditingId(null) }}
        className="mb-6 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
      >
        {showCreate ? 'Cancel' : 'New Challenge'}
      </button>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-8 p-4 rounded-xl space-y-3" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div className="grid grid-cols-2 gap-3">
            <input name="title" placeholder="Title" required className="input-field col-span-2" />
            <textarea name="description" placeholder="Description" required rows={4} className="input-field col-span-2 resize-none" />
            <select name="category" required className="input-field">
              <option value="">Category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select name="difficulty" required className="input-field">
              <option value="">Difficulty</option>
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input name="points" type="number" min="1" placeholder="Points" required className="input-field" />
            <input name="flag" type="text" placeholder="Flag (plaintext)" required className="input-field" />
            <input name="hint" placeholder="Hint (optional)" className="input-field col-span-2" />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white">
            Create
          </button>
        </form>
      )}

      <div className="space-y-2">
        {challenges.map(ch => (
          <div key={ch.id} className="rounded-xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', opacity: ch.is_active ? 1 : 0.5 }}>
            {editingId === ch.id ? (
              <form onSubmit={(e) => handleUpdate(ch.id, e)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input name="title" defaultValue={ch.title} required className="input-field col-span-2" />
                  <textarea name="description" defaultValue={ch.description} required rows={3} className="input-field col-span-2 resize-none" />
                  <select name="category" defaultValue={ch.category} required className="input-field">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select name="difficulty" defaultValue={ch.difficulty} required className="input-field">
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input name="points" type="number" defaultValue={ch.points} min="1" required className="input-field" />
                  <input name="flag" placeholder="New flag (leave blank to keep)" className="input-field" />
                  <input name="hint" defaultValue={ch.hint || ''} placeholder="Hint" className="input-field col-span-2" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white">Save</button>
                  <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--text-muted)' }}>Cancel</button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{ch.title}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full capitalize" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-muted)' }}>
                        {ch.category}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full capitalize" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-muted)' }}>
                        {ch.difficulty}
                      </span>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{ch.points}pts</span>
                      {!ch.is_active && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400">inactive</span>
                      )}
                    </div>
                    <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{ch.description}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button onClick={() => { setEditingId(ch.id); setShowCreate(false) }} className="px-2 py-1 text-xs rounded hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>Edit</button>
                    <button onClick={() => handleToggleActive(ch.id, ch.is_active)} className="px-2 py-1 text-xs rounded hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
                      {ch.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(ch.id)} className="px-2 py-1 text-xs rounded hover:bg-white/5 text-red-400">Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {challenges.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: 'var(--text-muted)' }}>No challenges yet. Create your first one!</p>
          </div>
        )}
      </div>
    </div>
  )
}
