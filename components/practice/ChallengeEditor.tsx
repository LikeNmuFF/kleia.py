'use client'

import { useState, useTransition } from 'react'
import { savePracticeChallenge } from '@/app/actions/practice'
import type { PracticeChallenge, PracticeChallengeInput } from '@/lib/practice/types'

export default function ChallengeEditor({ roomId, challenge, onSaved, onCancel }: { roomId: string; challenge?: PracticeChallenge; onSaved: () => void; onCancel: () => void }) {
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [uploadId, setUploadId] = useState<string | null>(challenge?.upload_id ?? null)
  const [uploadMessage, setUploadMessage] = useState('')
  const [error, setError] = useState('')

  async function upload(file: File) {
    setUploading(true); setUploadMessage('Uploading…')
    try {
      const body = new FormData(); body.append('file', file); body.append('room_id', roomId)
      const response = await fetch('/api/ctf/uploads', { method: 'POST', body })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Upload failed.')
      if (result.status !== 'approved') throw new Error('The attachment is not available for use.')
      setUploadId(result.id); setUploadMessage(`${result.fileName}: ready`)
    } catch (e) { setUploadMessage(e instanceof Error ? e.message : 'Upload failed.') } finally { setUploading(false) }
  }

  function submit(formData: FormData) {
    setError('')
    const input: PracticeChallengeInput = {
      title: String(formData.get('title') || ''), description: String(formData.get('description') || ''),
      category: String(formData.get('category') || 'misc'), difficulty: String(formData.get('difficulty') || 'easy'),
      points: Number(formData.get('points')), flag: String(formData.get('flag') || '') || undefined,
      hint: String(formData.get('hint') || ''), explanation: String(formData.get('explanation') || ''), upload_id: uploadId,
      learn_topic_slug: String(formData.get('learn_topic_slug') || ''), learn_lesson_slug: String(formData.get('learn_lesson_slug') || ''),
      is_active: formData.get('is_active') === 'on',
    }
    startTransition(async () => { try { const result = await savePracticeChallenge(roomId, challenge?.id ?? null, input); if ('error' in result) setError(result.error); else onSaved() } catch { setError('Unable to save the challenge. Please try again.') } })
  }

  const label = 'block text-sm font-medium'; const field = 'input-field mt-1 w-full'
  return <form action={submit} className="grid gap-4 rounded-xl border p-5 md:grid-cols-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
    <h3 className="text-lg font-semibold md:col-span-2" style={{ color: 'var(--text-primary)' }}>{challenge ? 'Edit challenge' : 'Add challenge'}</h3>
    {error && <p className="text-sm text-red-500 md:col-span-2">{error}</p>}
    <label className={label}>Title<input required maxLength={160} name="title" defaultValue={challenge?.title} className={field} /></label>
    <label className={label}>Points<input required min={1} max={10000} type="number" name="points" defaultValue={challenge?.points ?? 100} className={field} /></label>
    <label className={`${label} md:col-span-2`}>Description<textarea required maxLength={20000} rows={5} name="description" defaultValue={challenge?.description} className={field} /></label>
    <label className={label}>Category<select name="category" defaultValue={challenge?.category ?? 'web'} className={field}>{['web','crypto','forensics','osint','misc'].map(v => <option key={v}>{v}</option>)}</select></label>
    <label className={label}>Difficulty<select name="difficulty" defaultValue={challenge?.difficulty ?? 'easy'} className={field}>{['easy','medium','hard'].map(v => <option key={v}>{v}</option>)}</select></label>
    <label className={`${label} md:col-span-2`}>Flag {challenge && <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(leave blank to keep the current flag)</span>}<input required={!challenge} maxLength={500} name="flag" autoComplete="off" className={field} /></label>
    <label className={label}>Hint<textarea maxLength={20000} rows={3} name="hint" defaultValue={challenge?.hint ?? ''} className={field} /></label>
    <label className={label}>Explanation<textarea maxLength={20000} rows={3} name="explanation" defaultValue={challenge?.explanation ?? ''} className={field} /></label>
    <label className={label}>Learn topic slug<input name="learn_topic_slug" defaultValue={challenge?.learn_topic_slug ?? ''} className={field} placeholder="python-basics" /></label>
    <label className={label}>Learn lesson slug<input name="learn_lesson_slug" defaultValue={challenge?.learn_lesson_slug ?? ''} className={field} placeholder="variables" /></label>
    <label className={`${label} md:col-span-2`}>Attachment<input type="file" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file) }} className={`${field} file:mr-3`} /></label>
    {uploadMessage && <p className="text-xs md:col-span-2" style={{ color: 'var(--text-muted)' }}>{uploadMessage}</p>}
    {uploadId && <button type="button" className="justify-self-start text-sm text-red-500 md:col-span-2" onClick={() => { setUploadId(null); setUploadMessage('Attachment removed. Save to apply this change.') }}>Remove attachment</button>}
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={challenge?.is_active ?? true} /> Active for invited testers</label>
    <div className="flex justify-end gap-2 md:col-span-2"><button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm" style={{ backgroundColor: 'var(--input-bg)' }}>Cancel</button><button disabled={pending || uploading} className="btn-primary disabled:opacity-50">{uploading ? 'Uploading…' : pending ? 'Saving…' : 'Save challenge'}</button></div>
  </form>
}
