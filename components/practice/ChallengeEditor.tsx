'use client'

import { useState, useTransition } from 'react'
import { BookOpen, CheckCircle2, FileUp, Flag, Lightbulb, X, type LucideIcon } from 'lucide-react'
import { savePracticeChallenge } from '@/app/actions/practice'
import type { PracticeChallenge, PracticeChallengeInput } from '@/lib/practice/types'

const fieldClass = 'input-field mt-1.5 w-full'
const labelClass = 'block text-sm font-medium'

function SectionHeading({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div>
        <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h4>
        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
    </div>
  )
}

export default function ChallengeEditor({ roomId, challenge, onSaved, onCancel }: { roomId: string; challenge?: PracticeChallenge; onSaved: () => void; onCancel: () => void }) {
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [uploadId, setUploadId] = useState<string | null>(challenge?.upload_id ?? null)
  const [uploadMessage, setUploadMessage] = useState('')
  const [error, setError] = useState('')

  async function upload(file: File) {
    setUploading(true)
    setUploadMessage('Uploading…')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('room_id', roomId)
      const response = await fetch('/api/ctf/uploads', { method: 'POST', body })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Upload failed.')
      if (result.status !== 'approved') throw new Error('The attachment is not available for use.')
      setUploadId(result.id)
      setUploadMessage(`${result.fileName}: ready`)
    } catch (uploadError) {
      setUploadMessage(uploadError instanceof Error ? uploadError.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  function submit(formData: FormData) {
    setError('')
    const input: PracticeChallengeInput = {
      title: String(formData.get('title') || ''),
      description: String(formData.get('description') || ''),
      category: String(formData.get('category') || 'misc'),
      difficulty: String(formData.get('difficulty') || 'easy'),
      points: Number(formData.get('points')),
      flag: String(formData.get('flag') || '') || undefined,
      hint: String(formData.get('hint') || ''),
      explanation: String(formData.get('explanation') || ''),
      upload_id: uploadId,
      learn_topic_slug: String(formData.get('learn_topic_slug') || ''),
      learn_lesson_slug: String(formData.get('learn_lesson_slug') || ''),
      is_active: formData.get('is_active') === 'on',
    }
    startTransition(async () => {
      try {
        const result = await savePracticeChallenge(roomId, challenge?.id ?? null, input)
        if ('error' in result) setError(result.error)
        else onSaved()
      } catch {
        setError('Unable to save the challenge. Please try again.')
      }
    })
  }

  return (
    <form action={submit} className="overflow-hidden rounded-2xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-start justify-between gap-4 border-b px-5 py-5 sm:px-6" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--accent)' }}>Challenge setup</p>
          <h3 className="mt-1 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{challenge ? 'Edit challenge' : 'Create a challenge'}</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Prepare the complete tester experience before publishing.</p>
        </div>
        <button type="button" onClick={onCancel} aria-label="Close challenge editor" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)' }}><X className="h-4 w-4" aria-hidden /></button>
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        <fieldset className="border-b p-5 sm:p-6 lg:border-r" style={{ borderColor: 'var(--border-color)' }}>
          <legend className="sr-only">Challenge basics</legend>
          <SectionHeading icon={Flag} title="Challenge basics" description="Define what testers see and how the challenge is classified." />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={`${labelClass} sm:col-span-2`}>Title<input required maxLength={160} name="title" defaultValue={challenge?.title} className={fieldClass} placeholder="Signed cookie trail" /></label>
            <label className={labelClass}>Category<select name="category" defaultValue={challenge?.category ?? 'web'} className={fieldClass}>{['web', 'crypto', 'forensics', 'osint', 'misc'].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label className={labelClass}>Difficulty<select name="difficulty" defaultValue={challenge?.difficulty ?? 'easy'} className={fieldClass}>{['easy', 'medium', 'hard'].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label className={labelClass}>Lab points<input required min={1} max={10000} type="number" name="points" defaultValue={challenge?.points ?? 100} className={fieldClass} /></label>
            <label className={`${labelClass} sm:col-span-2`}>Description<textarea required maxLength={20000} rows={6} name="description" defaultValue={challenge?.description} className={fieldClass} placeholder="Explain the scenario and objective." /></label>
          </div>
        </fieldset>

        <fieldset className="border-b p-5 sm:p-6" style={{ borderColor: 'var(--border-color)' }}>
          <legend className="sr-only">Solution guide</legend>
          <SectionHeading icon={Lightbulb} title="Solution guide" description="Store the expected flag and reveal supporting guidance when needed." />
          <div className="space-y-4">
            <label className={labelClass}>Flag {challenge && <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(leave blank to keep the current flag)</span>}<input required={!challenge} maxLength={500} name="flag" autoComplete="off" className={`${fieldClass} font-mono`} placeholder="flag{...}" /></label>
            <label className={labelClass}>Hint<textarea maxLength={20000} rows={3} name="hint" defaultValue={challenge?.hint ?? ''} className={fieldClass} placeholder="A small nudge for blocked testers." /></label>
            <label className={labelClass}>Explanation<textarea maxLength={20000} rows={4} name="explanation" defaultValue={challenge?.explanation ?? ''} className={fieldClass} placeholder="Describe the intended solution and learning outcome." /></label>
          </div>
        </fieldset>

        <fieldset className="border-b p-5 sm:p-6 lg:border-b-0 lg:border-r" style={{ borderColor: 'var(--border-color)' }}>
          <legend className="sr-only">Learning path</legend>
          <SectionHeading icon={BookOpen} title="Learning path" description="Optionally connect the challenge to an existing Kleia lesson." />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Topic slug<input name="learn_topic_slug" defaultValue={challenge?.learn_topic_slug ?? ''} className={fieldClass} placeholder="python-basics" /></label>
            <label className={labelClass}>Lesson slug<input name="learn_lesson_slug" defaultValue={challenge?.learn_lesson_slug ?? ''} className={fieldClass} placeholder="variables" /></label>
          </div>
          <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>Enter both slugs or leave both empty.</p>
        </fieldset>

        <fieldset className="p-5 sm:p-6">
          <legend className="sr-only">Delivery</legend>
          <SectionHeading icon={FileUp} title="Delivery" description="Attach a room-scoped file and choose whether testers can start now." />
          <label className={labelClass}>Challenge attachment<input type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file) }} className={`${fieldClass} file:mr-3`} /></label>
          {uploadMessage && <p className="mt-2 text-xs" style={{ color: uploadId ? '#22c55e' : 'var(--text-muted)' }}>{uploadMessage}</p>}
          {uploadId && <button type="button" className="mt-2 text-sm font-medium text-red-500" onClick={() => { setUploadId(null); setUploadMessage('Attachment removed. Save to apply this change.') }}>Remove attachment</button>}
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border p-4" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)' }}>
            <input type="checkbox" name="is_active" defaultChecked={challenge?.is_active ?? true} className="mt-1" />
            <span><span className="flex items-center gap-1.5 text-sm font-semibold"><CheckCircle2 className="h-4 w-4" aria-hidden />Active for invited testers</span><span className="mt-1 block text-xs" style={{ color: 'var(--text-muted)' }}>Turn this off while the challenge is still being prepared.</span></span>
          </label>
        </fieldset>
      </div>

      {error && <p role="alert" className="mx-5 mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500 sm:mx-6">{error}</p>}
      <div className="flex flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end sm:px-6" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--input-bg)' }}>
        <button type="button" onClick={onCancel} className="min-h-10 rounded-lg px-4 text-sm font-medium" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}>Cancel</button>
        <button disabled={pending || uploading} className="btn-primary min-h-10 px-5 disabled:opacity-50">{uploading ? 'Uploading…' : pending ? 'Saving…' : challenge ? 'Save changes' : 'Create challenge'}</button>
      </div>
    </form>
  )
}
