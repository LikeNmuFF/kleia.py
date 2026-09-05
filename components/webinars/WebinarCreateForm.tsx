'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createWebinar } from '@/app/actions/webinars'
import type { WebinarProviderType, WebinarSkillCategory, WebinarVerificationMode } from '@/lib/webinars/types'

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`

const providerOptions: { value: WebinarProviderType; label: string }[] = [
  { value: 'internal', label: 'Kleia' },
  { value: 'dict', label: 'DICT' },
  { value: 'school', label: 'School' },
  { value: 'partner', label: 'Partner' },
  { value: 'other', label: 'Other' },
]

const modeOptions: { value: WebinarVerificationMode; label: string }[] = [
  { value: 'internal_attendance', label: 'Kleia attendance' },
  { value: 'external_certificate', label: 'External certificate' },
  { value: 'resource_only', label: 'Resource only' },
]

const categoryOptions: { value: WebinarSkillCategory; label: string }[] = [
  { value: 'career', label: 'Career' },
  { value: 'learn', label: 'Learn' },
  { value: 'ctf', label: 'CTF' },
  { value: 'regexGolf', label: 'Regex Golf' },
  { value: 'dailyCipher', label: 'Daily Cipher' },
  { value: 'other', label: 'Other' },
]

export default function WebinarCreateForm() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  async function uploadThumbnail(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file for the thumbnail')
      return null
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Thumbnail must be 5 MB or smaller')
      return null
    }

    setUploading(true)
    const uploadData = new FormData()
    uploadData.append('file', file)
    uploadData.append('upload_preset', 'kleia-avatars')
    uploadData.append('folder', 'kleia/webinar-thumbnails')

    try {
      const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: uploadData })
      if (!response.ok) throw new Error('Thumbnail upload failed')
      const result = await response.json()
      return typeof result.secure_url === 'string' ? result.secure_url : null
    } catch {
      setError('Thumbnail upload failed. Please try another image.')
      return null
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const thumbnailFile = formData.get('thumbnail_file')
      let thumbnailUrl = String(formData.get('thumbnail_url') || '')
      if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
        const uploadedUrl = await uploadThumbnail(thumbnailFile)
        if (!uploadedUrl) return
        thumbnailUrl = uploadedUrl
      }

      const result = await createWebinar({
        title: String(formData.get('title') || ''),
        description: String(formData.get('description') || ''),
        provider_name: String(formData.get('provider_name') || ''),
        provider_type: String(formData.get('provider_type') || 'internal') as WebinarProviderType,
        verification_mode: String(formData.get('verification_mode') || 'internal_attendance') as WebinarVerificationMode,
        external_url: String(formData.get('external_url') || ''),
        thumbnail_url: thumbnailUrl,
        capacity: formData.get('capacity') ? Number(formData.get('capacity')) : null,
        min_attendance_minutes: Number(formData.get('min_attendance_minutes') || 30),
        starts_at: String(formData.get('starts_at') || ''),
        ends_at: String(formData.get('ends_at') || ''),
        skill_category: String(formData.get('skill_category') || 'career') as WebinarSkillCategory,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium transition hover:bg-violet-500"
      >
        Post webinar
      </button>
    )
  }

  return (
    <form action={handleSubmit} className="border rounded-lg p-4 space-y-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Post webinar or certification</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Cancel
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Title</span>
          <input name="title" required minLength={3} maxLength={160} className="input-field" placeholder="DICT Cybersecurity Essentials" />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Provider</span>
          <select name="provider_type" className="input-field">
            {providerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Provider name</span>
          <input name="provider_name" className="input-field" placeholder="DICT, Cisco, School Office" />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Verification</span>
          <select name="verification_mode" className="input-field">
            {modeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Starts</span>
          <input name="starts_at" type="datetime-local" required className="input-field" />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Ends</span>
          <input name="ends_at" type="datetime-local" required className="input-field" />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Capacity</span>
          <input name="capacity" type="number" min={1} max={10000} className="input-field" placeholder="Optional" />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Minimum minutes</span>
          <input name="min_attendance_minutes" type="number" min={0} max={1440} defaultValue={30} className="input-field" />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Skill area</span>
          <select name="skill_category" className="input-field">
            {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Thumbnail URL</span>
          <input name="thumbnail_url" type="url" className="input-field" placeholder="https://... (optional)" />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Or upload thumbnail</span>
          <input name="thumbnail_file" type="file" accept="image/*" className="input-field" />
          <span className="block text-[11px]" style={{ color: 'var(--text-muted)' }}>Max 5 MB. Upload takes priority over the URL.</span>
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>External link</span>
          <input name="external_url" type="url" className="input-field" placeholder="https://..." />
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Description</span>
          <textarea name="description" rows={3} required minLength={10} className="input-field resize-none" placeholder="Who should join, what they will learn, and what certificate applies." />
        </label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button type="submit" disabled={pending || uploading} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium transition hover:bg-violet-500 disabled:opacity-50">
        {uploading ? 'Uploading thumbnail...' : pending ? 'Posting...' : 'Post'}
      </button>
    </form>
  )
}
