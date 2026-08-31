'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createChallenge, updateChallenge, deleteChallenge, approveChallenge, rejectChallenge } from '@/app/actions/ctf'
import LearnLinkPicker from '@/components/ctf/LearnLinkPicker'

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload`

interface Challenge {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  points: number
  hint: string | null
  file_url: string | null
  link_url: string | null
  author: string | null
  status: string
  is_active: boolean
  created_at: string
  learn_topic_slug: string | null
  learn_lesson_slug: string | null
  season_id: string | null
  ai_review_notes?: string | null
}

interface TopicLink {
  id: string
  slug: string
  title: string
  icon: string
}

interface LessonLink {
  topic_id: string
  slug: string
  title: string
}

const CATEGORIES = ['web', 'crypto', 'forensics', 'misc']
const DIFFICULTIES = ['easy', 'medium', 'hard']
const TABS = ['all', 'pending', 'approved', 'rejected', 'draft']

export default function AdminCTFClient({
  challenges,
  topics,
  lessons,
}: {
  challenges: Challenge[]
  topics: TopicLink[]
  lessons: LessonLink[]
}) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const [uploading, setUploading] = useState<string | null>(null)
  const [fileInputUrl, setFileInputUrl] = useState('')
  const [aiReviewing, setAiReviewing] = useState<string | null>(null)
  const [aiNotes, setAiNotes] = useState<Record<string, string>>({})

  const clearMessages = () => { setError(''); setSuccess('') }

  const filtered = activeTab === 'all' ? challenges : challenges.filter(c => c.status === activeTab)

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'kleia-ctf-files')
    try {
      const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData })
      const data = await res.json()
      return data.secure_url || null
    } catch {
      setError('Upload failed. Check your Cloudinary preset name.')
      return null
    }
  }

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
      file_url: fileInputUrl || undefined,
      link_url: (form.get('link_url') as string) || undefined,
      author: (form.get('author') as string) || undefined,
      learn_topic_slug: (form.get('learn_topic_slug') as string) || undefined,
      learn_lesson_slug: (form.get('learn_lesson_slug') as string) || undefined,
    })

    if (result.error) setError(result.error)
    else {
      setSuccess('Challenge created!')
      setShowCreate(false)
      setFileInputUrl('')
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
      file_url: (form.get('file_url') as string) || undefined,
      link_url: (form.get('link_url') as string) || undefined,
      author: (form.get('author') as string) || undefined,
      learn_topic_slug: (form.get('learn_topic_slug') as string) || undefined,
      learn_lesson_slug: (form.get('learn_lesson_slug') as string) || undefined,
    })

    if (result.error) setError(result.error)
    else {
      setSuccess('Challenge updated!')
      setEditingId(null)
      router.refresh()
    }
  }

  const handleApprove = async (id: string) => {
    clearMessages()
    const result = await approveChallenge(id)
    if (result.error) setError(result.error)
    else {
      setSuccess('Challenge approved!')
      router.refresh()
    }
  }

  const handleReject = async (id: string) => {
    clearMessages()
    const result = await rejectChallenge(id)
    if (result.error) setError(result.error)
    else {
      setSuccess('Challenge rejected')
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

  const handleAiReview = async (id: string) => {
    clearMessages()
    setAiReviewing(id)
    try {
      const res = await fetch('/api/ai-review-challenge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeId: id }) })
      const json = await res.json()
      if (!res.ok) setError(json.error || 'AI review failed')
      else {
        setAiNotes(prev => ({ ...prev, [id]: json.ai_review_notes }))
        setSuccess('AI review complete — human approve still required')
        router.refresh()
      }
    } catch (e: any) {
      setError(e.message || 'AI review failed')
    }
    setAiReviewing(null)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(file.name)
    const url = await uploadToCloudinary(file)
    if (url) setFileInputUrl(url)
    setUploading(null)
  }

  const pendingCount = challenges.filter(c => c.status === 'pending').length

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{success}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {TABS.map(tab => {
          const count = tab === 'all' ? challenges.length : challenges.filter(c => c.status === tab).length
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setEditingId(null); setShowCreate(false) }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors"
              style={{
                backgroundColor: activeTab === tab ? 'var(--card-bg)' : 'transparent',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                border: activeTab === tab ? '1px solid var(--border-color)' : '1px solid transparent',
              }}
            >
              {tab} {count > 0 && <span className="ml-1 text-xs opacity-60">({count})</span>}
            </button>
          )
        })}
      </div>

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
            <input name="hint" placeholder="Hint (optional)" className="input-field col-span-1" />
            <input name="author" placeholder="Author (optional)" className="input-field col-span-1" />
            <input name="link_url" placeholder="External link URL (optional)" className="input-field col-span-2" />
          </div>
          <LearnLinkPicker topics={topics} lessons={lessons} />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {uploading ? `Uploading ${uploading}...` : 'Attach file'}
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
            {fileInputUrl && (
              <span className="text-xs truncate flex-1" style={{ color: 'var(--text-muted)' }}>
                ✓ {fileInputUrl.split('/').pop()}
              </span>
            )}
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white">
            Create
          </button>
        </form>
      )}

      <div className="space-y-2">
        {filtered.map(ch => (
          <div key={ch.id} className="rounded-xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', opacity: ch.status === 'approved' ? 1 : 0.6 }}>
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
                  <input name="hint" defaultValue={ch.hint || ''} placeholder="Hint" className="input-field col-span-1" />
                  <input name="author" defaultValue={ch.author || ''} placeholder="Author" className="input-field col-span-1" />
                  <input name="file_url" defaultValue={ch.file_url || ''} placeholder="File URL" className="input-field col-span-2" />
                  <input name="link_url" defaultValue={ch.link_url || ''} placeholder="External link URL" className="input-field col-span-2" />
                </div>
                <LearnLinkPicker
                  topics={topics}
                  lessons={lessons}
                  defaultTopicSlug={ch.learn_topic_slug}
                  defaultLessonSlug={ch.learn_lesson_slug}
                />
                <div className="flex gap-2">
                  <button type="submit" className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white">Save</button>
                  <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--text-muted)' }}>Cancel</button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{ch.title}</span>
                      {ch.season_id && (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                          Season-only
                        </span>
                      )}
                      <span className="text-xs px-1.5 py-0.5 rounded-full capitalize shrink-0" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-muted)' }}>
                        {ch.category}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full capitalize shrink-0" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-muted)' }}>
                        {ch.difficulty}
                      </span>
                      <span className="text-xs font-bold shrink-0" style={{ color: 'var(--text-secondary)' }}>{ch.points}pts</span>
                      {ch.status !== 'approved' && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full capitalize shrink-0 ${
                          ch.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                          ch.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                          {ch.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{ch.description}</p>
                    {(ch.ai_review_notes || aiNotes[ch.id]) && (
                      <div className="mt-2 p-2 rounded-lg text-xs whitespace-pre-wrap" style={{ backgroundColor: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: 'var(--text-secondary)' }}>
                        <span className="font-semibold">AI review:</span> {ch.ai_review_notes || aiNotes[ch.id]}
                      </div>
                    )}
                    <div className="flex gap-3 mt-1">
                      {ch.author && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>by {ch.author}</span>}
                      {ch.file_url && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>📎 file</span>}
                      {ch.link_url && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>🔗 link</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                    {ch.status === 'pending' && (
                      <>
                        <button onClick={() => handleAiReview(ch.id)} disabled={aiReviewing===ch.id} className="px-2 py-1 text-xs rounded hover:bg-white/5 text-violet-400 disabled:opacity-50">{aiReviewing===ch.id ? 'Reviewing…' : 'AI Review'}</button>
                        <button onClick={() => handleApprove(ch.id)} className="px-2 py-1 text-xs rounded hover:bg-white/5 text-emerald-400">Approve</button>
                        <button onClick={() => handleReject(ch.id)} className="px-2 py-1 text-xs rounded hover:bg-white/5 text-red-400">Reject</button>
                      </>
                    )}
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

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: 'var(--text-muted)' }}>
              {activeTab === 'pending' ? 'No pending challenges to review.' : `No ${activeTab} challenges.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
