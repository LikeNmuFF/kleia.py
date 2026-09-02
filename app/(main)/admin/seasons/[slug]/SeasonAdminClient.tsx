'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Pause, Circle, Square, UserPlus, Trash2, Save, Upload, Loader2 } from 'lucide-react'
import type { SeasonStatus } from '@/app/actions/competition'
import { formatDateTime } from '@/lib/utils/time'
import {
  setSeasonStatus,
  addSeasonSpectator,
  removeSeasonSpectator,
  adjustSeasonScore,
} from '@/app/actions/competition'
import { createSeasonChallenge } from '@/app/actions/ctf'

interface Season {
  id: string
  name: string
  slug: string
  start_date: string
  end_date: string
}

interface Participant {
  user_id: string
  total_points: number
  challenges_solved: number
  codename: string | null
  username: string
  avatar_url: string | null
}

interface Spectator {
  user_id: string
  username: string
  avatar_url: string | null
}

interface Challenge {
  id: string
  title: string
  category: string
  difficulty: string
  points: number
  bonus_points: number
  seasonOnly: boolean
}

export default function SeasonAdminClient({
  season,
  effectiveStatus,
  participants,
  spectators,
  challenges,
}: {
  season: Season
  effectiveStatus: string
  participants: Participant[]
  spectators: Spectator[]
  challenges: Challenge[]
}) {
  const router = useRouter()
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [spectatorUsername, setSpectatorUsername] = useState('')
  const [adjustTarget, setAdjustTarget] = useState(participants[0]?.user_id || '')
  const [adjustPoints, setAdjustPoints] = useState(0)
  const [adjustSolved, setAdjustSolved] = useState(0)
  const [busy, setBusy] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [uploading, setUploading] = useState(false)

  const uploadChallengeFile = async (file: File) => {
    const body = new FormData()
    body.append('file', file)
    body.append('upload_preset', 'kleia-avatars')
    body.append('folder', 'kleia/challenges')
    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload`, { method: 'POST', body })
    if (!response.ok) throw new Error('Challenge file upload failed')
    return (await response.json()).secure_url as string
  }

  const notify = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type })
  }

  const run = async (fn: () => Promise<{ error?: string; success?: boolean }>, okText: string) => {
    setBusy(true)
    setMessage(null)
    const res = await fn()
    setBusy(false)
    if (res.error) notify(res.error, 'error')
    else {
      notify(okText)
      router.refresh()
    }
    return res
  }

  const statusBtn = (label: string, status: SeasonStatus, Icon: typeof Play, active: boolean, disabled: boolean) => (
    <button
      onClick={() => run(() => setSeasonStatus(season.id, status), `Season ${label.toLowerCase()}d`)}
      disabled={busy || disabled}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
      style={{ backgroundColor: active ? 'var(--accent)' : 'var(--card-bg)', color: active ? 'var(--accent-text)' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )

  const pickParticipant = (userId: string) => {
    const p = participants.find((x) => x.user_id === userId)
    setAdjustTarget(userId)
    setAdjustPoints(p?.total_points ?? 0)
    setAdjustSolved(p?.challenges_solved ?? 0)
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{season.name}</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {formatDateTime(season.start_date)} → {formatDateTime(season.end_date)} · status: <span className="font-mono font-semibold" style={{ color: '#8b5cf6' }}>{effectiveStatus}</span>
        </p>
      </div>

      {message && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            backgroundColor: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: message.type === 'success' ? '#22c55e' : '#ef4444',
            border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Status controls */}
      <section className="rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Competition status</h2>
        <div className="flex flex-wrap gap-3">
          {statusBtn('Start', 'live', Play, effectiveStatus === 'live', false)}
          {statusBtn('Pause', 'paused', Pause, effectiveStatus === 'paused', effectiveStatus !== 'live')}
          {statusBtn('Resume', 'live', Play, false, effectiveStatus !== 'paused')}
          {statusBtn('End', 'ended', Square, effectiveStatus === 'ended', false)}
          {statusBtn('Set Upcoming', 'upcoming', Circle, false, false)}
        </div>
      </section>

      {/* Spectators */}
      <section className="rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Spectators</h2>
        <div className="flex items-end gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Add by username</label>
            <input
              type="text"
              value={spectatorUsername}
              onChange={(e) => setSpectatorUsername(e.target.value)}
              placeholder="username"
              className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <button
            onClick={() => run(() => addSeasonSpectator(season.id, spectatorUsername), 'Spectator added')}
            disabled={busy || !spectatorUsername.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            <UserPlus className="w-4 h-4" />
            Add
          </button>
        </div>
        {spectators.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No spectators assigned.</p>
        ) : (
          <div className="space-y-2">
            {spectators.map((s) => (
              <div key={s.user_id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--input-bg)' }}>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>@{s.username}</span>
                <button
                  onClick={() => run(() => removeSeasonSpectator(season.id, s.user_id), 'Spectator removed')}
                  disabled={busy}
                  className="p-1 rounded transition-colors"
                  style={{ color: '#ef4444' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Season challenges */}
      <section className="rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Challenges ({challenges.length})
          </h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            {showCreate ? 'Cancel' : '+ Create season challenge'}
          </button>
        </div>

        {showCreate && (
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 p-4 rounded-xl"
            style={{ backgroundColor: 'var(--input-bg)' }}
            onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              let uploadedFileUrl = (fd.get('file_url') as string) || undefined
              const file = fd.get('challenge_file')
              if (file instanceof File && file.size > 0) {
                try {
                  setUploading(true)
                  uploadedFileUrl = await uploadChallengeFile(file)
                } catch (error) {
                  notify(error instanceof Error ? error.message : 'Challenge file upload failed', 'error')
                  setUploading(false)
                  return
                }
                setUploading(false)
              }
              const res = await run(
                () => createSeasonChallenge(season.id, {
                  title: fd.get('title') as string,
                  description: fd.get('description') as string,
                  category: fd.get('category') as string,
                  difficulty: fd.get('difficulty') as string,
                  points: parseInt(fd.get('points') as string),
                  flag: fd.get('flag') as string,
                  hint: (fd.get('hint') as string) || undefined,
                  hint_points_cost: parseInt(fd.get('hint_points_cost') as string) || 10,
                  file_url: uploadedFileUrl,
                  link_url: (fd.get('link_url') as string) || undefined,
                  author: (fd.get('author') as string) || undefined,
                }),
                'Challenge created'
              )
              if (res.success) setShowCreate(false)
            }}
          >
            <input name="title" placeholder="Title *" required className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent md:col-span-2" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            <textarea name="description" placeholder="Description *" required rows={3} className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent md:col-span-2" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            <select name="category" required className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="web">Web</option>
              <option value="crypto">Crypto</option>
              <option value="forensics">Forensics</option>
              <option value="misc">Misc</option>
            </select>
            <select name="difficulty" required className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <input name="points" type="number" min="1" placeholder="Points *" required className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            <input name="flag" type="text" placeholder="Flag (plaintext) *" required className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            <input name="hint" placeholder="Hint (optional)" className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            <input name="hint_points_cost" type="number" min="0" defaultValue="10" placeholder="Hint penalty (points)" className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            <input name="author" placeholder="Author (optional)" className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            <input name="link_url" placeholder="External link URL (optional)" className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent md:col-span-2" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            <input name="file_url" placeholder="File URL (optional)" className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent md:col-span-2" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            <label className="md:col-span-2 flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <Upload className="w-4 h-4" /> Upload challenge file
              <input name="challenge_file" type="file" className="text-xs" />
            </label>
            <button type="submit" disabled={busy} className="md:col-span-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
              {uploading ? <><Loader2 className="inline w-4 h-4 mr-1 animate-spin" /> Uploading...</> : 'Create'}
            </button>
          </form>
        )}

        {challenges.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No challenges in this season yet.</p>
        ) : (
          <div className="space-y-2">
            {challenges.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--input-bg)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {c.title}
                  </span>
                  {c.seasonOnly && (
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                      Season-only
                    </span>
                  )}
                </div>
                <span className="text-sm font-mono shrink-0" style={{ color: 'var(--text-primary)' }}>
                  {c.category} · {c.points + c.bonus_points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Score adjustment */}
      <section className="rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Adjust score</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Participant</label>
            <select
              value={adjustTarget}
              onChange={(e) => pickParticipant(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              {participants.map((p) => (
                <option key={p.user_id} value={p.user_id}>
                  {p.codename || p.username}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Points</label>
            <input
              type="number"
              value={adjustPoints}
              onChange={(e) => setAdjustPoints(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Solved</label>
            <input
              type="number"
              value={adjustSolved}
              onChange={(e) => setAdjustSolved(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => run(() => adjustSeasonScore(season.id, adjustTarget, adjustPoints, adjustSolved), 'Score updated')}
              disabled={busy || !adjustTarget}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </section>

      {/* Participants */}
      <section className="rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Participants ({participants.length})
        </h2>
        {participants.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No participants yet.</p>
        ) : (
          <div className="space-y-2">
            {participants.map((p) => (
              <div key={p.user_id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--input-bg)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {p.codename || p.username}
                  </span>
                  {p.codename && p.username && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>@{p.username}</span>
                  )}
                </div>
                <span className="text-sm font-mono shrink-0" style={{ color: 'var(--text-primary)' }}>
                  {p.total_points} pts · {p.challenges_solved} solved
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
