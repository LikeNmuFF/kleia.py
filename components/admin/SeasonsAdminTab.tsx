'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Plus, Trash2, Edit3, Check, X, Link as LinkIcon, Unlink, Trophy } from 'lucide-react'
import { createSeason, updateSeason, deleteSeason, addChallengeToSeason, removeChallengeFromSeason } from '@/app/actions/seasons'

interface Season {
  id: string
  name: string
  slug: string
  description: string | null
  theme: string | null
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

interface Challenge {
  id: string
  title: string
  category: string
  difficulty: string
  points: number
}

interface SeasonChallenge {
  challenge_id: string
  bonus_points: number
}

export default function SeasonsAdminTab() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [seasonChallenges, setSeasonChallenges] = useState<Record<string, SeasonChallenge[]>>({})
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [linkingSeasonId, setLinkingSeasonId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formTheme, setFormTheme] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formActive, setFormActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from('ctf_seasons').select('*').order('created_at', { ascending: false }),
      supabase.from('ctf_challenges').select('id, title, category, difficulty, points').eq('status', 'approved').order('title'),
    ])
    setSeasons((s as Season[]) || [])
    setChallenges((c as Challenge[]) || [])

    // Load season challenges for each season
    const scMap: Record<string, SeasonChallenge[]> = {}
    for (const season of (s as Season[]) || []) {
      const { data: sc } = await supabase
        .from('ctf_season_challenges')
        .select('challenge_id, bonus_points')
        .eq('season_id', season.id)
      scMap[season.id] = (sc as SeasonChallenge[]) || []
    }
    setSeasonChallenges(scMap)
    setLoading(false)
  }

  function resetForm() {
    setFormName('')
    setFormSlug('')
    setFormDescription('')
    setFormTheme('')
    setFormStartDate('')
    setFormEndDate('')
    setFormActive(true)
  }

  function startEdit(season: Season) {
    setEditingId(season.id)
    setFormName(season.name)
    setFormSlug(season.slug)
    setFormDescription(season.description || '')
    setFormTheme(season.theme || '')
    setFormStartDate(season.start_date)
    setFormEndDate(season.end_date)
    setFormActive(season.is_active)
    setShowCreate(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    const result = await createSeason({
      name: formName,
      slug: formSlug || formName.toLowerCase().replace(/\s+/g, '-'),
      description: formDescription || undefined,
      theme: formTheme || undefined,
      start_date: formStartDate,
      end_date: formEndDate,
      is_active: formActive,
    })

    if (result.success) {
      setMessage({ text: 'Season created!', type: 'success' })
      setShowCreate(false)
      resetForm()
      loadData()
    } else {
      setMessage({ text: (result as { error: string }).error, type: 'error' })
    }
    setSubmitting(false)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setSubmitting(true)
    setMessage(null)

    const result = await updateSeason(editingId, {
      name: formName,
      description: formDescription || undefined,
      theme: formTheme || undefined,
      start_date: formStartDate,
      end_date: formEndDate,
      is_active: formActive,
    })

    if (result.success) {
      setMessage({ text: 'Season updated!', type: 'success' })
      setEditingId(null)
      resetForm()
      loadData()
    } else {
      setMessage({ text: (result as { error: string }).error, type: 'error' })
    }
    setSubmitting(false)
  }

  async function handleDelete(seasonId: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setMessage(null)

    const result = await deleteSeason(seasonId)
    if (result.success) {
      setMessage({ text: 'Season deleted', type: 'success' })
      loadData()
    } else {
      setMessage({ text: (result as { error: string }).error, type: 'error' })
    }
  }

  async function handleToggleActive(season: Season) {
    setMessage(null)
    const result = await updateSeason(season.id, { is_active: !season.is_active })
    if (result.success) {
      loadData()
    } else {
      setMessage({ text: (result as { error: string }).error, type: 'error' })
    }
  }

  async function handleAddChallenge(challengeId: string) {
    if (!linkingSeasonId) return
    setMessage(null)
    const result = await addChallengeToSeason(linkingSeasonId, challengeId)
    if (result.success) {
      loadData()
    } else {
      setMessage({ text: (result as { error: string }).error, type: 'error' })
    }
  }

  async function handleRemoveChallenge(challengeId: string) {
    if (!linkingSeasonId) return
    setMessage(null)
    const result = await removeChallengeFromSeason(linkingSeasonId, challengeId)
    if (result.success) {
      loadData()
    } else {
      setMessage({ text: (result as { error: string }).error, type: 'error' })
    }
  }

  function isTodayInRange(start: string, end: string) {
    const today = new Date().toISOString().split('T')[0]
    return today >= start && today <= end
  }

  if (loading) {
    return <div className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--card-bg)' }} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Seasons</h2>
        <button
          onClick={() => { setShowCreate(!showCreate); setEditingId(null); resetForm() }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
        >
          <Plus className="w-4 h-4" />
          New Season
        </button>
      </div>

      {message && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'success' ? '#22c55e' : '#ef4444',
            border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Create/Edit Form */}
      {(showCreate || editingId) && (
        <form
          onSubmit={editingId ? handleUpdate : handleCreate}
          className="rounded-xl border p-5 space-y-4"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {editingId ? 'Edit Season' : 'Create Season'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Name *</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="e.g. Hack4Gov Season 1"
                required
                className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Slug</label>
              <input
                type="text"
                value={formSlug}
                onChange={e => setFormSlug(e.target.value)}
                placeholder="auto-generated from name"
                className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Theme</label>
              <input
                type="text"
                value={formTheme}
                onChange={e => setFormTheme(e.target.value)}
                placeholder="e.g. Web Security Month"
                className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
              <input
                type="text"
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Brief description"
                className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Start Date *</label>
              <input
                type="date"
                value={formStartDate}
                onChange={e => setFormStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>End Date *</label>
              <input
                type="date"
                value={formEndDate}
                onChange={e => setFormEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formActive}
              onChange={e => setFormActive(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Active</span>
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || !formName.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              {submitting ? '...' : editingId ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setEditingId(null); resetForm() }}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ color: 'var(--text-muted)', backgroundColor: 'var(--hover-bg)' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Seasons List */}
      <div className="space-y-3">
        {seasons.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No seasons yet.</p>
        )}
        {seasons.map(season => {
          const active = isTodayInRange(season.start_date, season.end_date) && season.is_active
          const scs = seasonChallenges[season.id] || []
          const isLinking = linkingSeasonId === season.id
          const linkedIds = new Set(scs.map(sc => sc.challenge_id))

          return (
            <div
              key={season.id}
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
            >
              {/* Season Header */}
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 shrink-0" style={{ color: active ? '#eab308' : 'var(--text-muted)' }} />
                    <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {season.name}
                    </span>
                    {active && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase" style={{ background: '#22c55e20', color: '#22c55e' }}>
                        Active
                      </span>
                    )}
                    {!season.is_active && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase" style={{ background: 'var(--hover-bg)', color: 'var(--text-muted)' }}>
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {season.start_date} → {season.end_date}
                    </span>
                    {season.theme && <span>{season.theme}</span>}
                    <span>{scs.length} challenges</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleActive(season)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: season.is_active ? '#22c55e' : 'var(--text-muted)' }}
                    title={season.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setLinkingSeasonId(isLinking ? null : season.id) }}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: isLinking ? 'var(--accent)' : 'var(--text-muted)' }}
                    title="Link challenges"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startEdit(season)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(season.id, season.name)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: '#ef4444' }}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Challenge Linking */}
              {isLinking && (
                <div className="border-t p-4" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Link challenges to {season.name}
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {challenges.map(ch => {
                      const linked = linkedIds.has(ch.id)
                      return (
                        <div
                          key={ch.id}
                          className="flex items-center justify-between py-1.5 px-2 rounded text-sm"
                          style={{ backgroundColor: 'var(--input-bg)' }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate" style={{ color: 'var(--text-primary)' }}>{ch.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--hover-bg)', color: 'var(--text-muted)' }}>
                              {ch.category}
                            </span>
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>+{ch.points}</span>
                          </div>
                          {linked ? (
                            <button
                              onClick={() => handleRemoveChallenge(ch.id)}
                              className="p-1 rounded transition-colors shrink-0"
                              style={{ color: '#ef4444' }}
                            >
                              <Unlink className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAddChallenge(ch.id)}
                              className="p-1 rounded transition-colors shrink-0"
                              style={{ color: 'var(--accent)' }}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
