'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Eye, EyeOff, TestTube } from 'lucide-react'
import { getAdminRegexPuzzles, createRegexPuzzle, updateRegexPuzzle, deleteRegexPuzzle } from '@/app/actions/admin'

const DANGEROUS_PATTERNS = /\(\?.*?\)|\(\?\=|\(\?!|\(\?\<|\(\?<=|\(\?<!|\\A|\\Z|\{[0-9]{3,}\}|\\\w\+\+|\\\w\*\*/

interface Puzzle {
  id: string
  title: string
  description: string | null
  difficulty: string
  solution_regex: string
  match_strings: string[]
  reject_strings: string[]
  min_length: number | null
  xp_reward: number
  is_active: boolean
  created_at: string
}

interface FormData {
  title: string
  description: string
  difficulty: string
  solution_regex: string
  match_strings: string
  reject_strings: string
  min_length: string
  xp_reward: string
}

const emptyForm: FormData = {
  title: '',
  description: '',
  difficulty: 'easy',
  solution_regex: '',
  match_strings: '',
  reject_strings: '',
  min_length: '',
  xp_reward: '20',
}

export default function RegexGolfAdminTab() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [testResult, setTestResult] = useState<{ valid: boolean; matchesAll: boolean; rejectsAll: boolean; error?: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadPuzzles()
  }, [])

  async function loadPuzzles() {
    const { puzzles } = await getAdminRegexPuzzles()
    setPuzzles(
      [...puzzles].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    )
    setLoading(false)
  }

  function openCreate() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
    setTestResult(null)
    setMessage(null)
  }

  function openEdit(puzzle: Puzzle) {
    setForm({
      title: puzzle.title,
      description: puzzle.description || '',
      difficulty: puzzle.difficulty,
      solution_regex: puzzle.solution_regex,
      match_strings: puzzle.match_strings.join('\n'),
      reject_strings: puzzle.reject_strings.join('\n'),
      min_length: puzzle.min_length?.toString() || '',
      xp_reward: puzzle.xp_reward.toString(),
    })
    setEditingId(puzzle.id)
    setShowForm(true)
    setTestResult(null)
    setMessage(null)
  }

  function testRegex() {
    setTestResult(null)
    if (!form.solution_regex) return

    if (DANGEROUS_PATTERNS.test(form.solution_regex)) {
      setTestResult({ valid: false, matchesAll: false, rejectsAll: false, error: 'Pattern contains disallowed constructs' })
      return
    }

    let regex: RegExp
    try {
      regex = new RegExp(form.solution_regex)
    } catch (e) {
      setTestResult({ valid: false, matchesAll: false, rejectsAll: false, error: `Invalid syntax: ${e}` })
      return
    }

    const matchStrings = form.match_strings.split('\n').map(s => s.trim()).filter(Boolean)
    const rejectStrings = form.reject_strings.split('\n').map(s => s.trim()).filter(Boolean)

    const matchesAll = matchStrings.every(s => regex.test(s))
    const rejectsAll = rejectStrings.every(s => !regex.test(s))

    setTestResult({ valid: true, matchesAll, rejectsAll })
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)

    const matchStrings = form.match_strings.split('\n').map(s => s.trim()).filter(Boolean)
    const rejectStrings = form.reject_strings.split('\n').map(s => s.trim()).filter(Boolean)

    const data = {
      title: form.title,
      description: form.description,
      difficulty: form.difficulty,
      solution_regex: form.solution_regex,
      match_strings: matchStrings,
      reject_strings: rejectStrings,
      min_length: form.min_length ? parseInt(form.min_length) : null,
      xp_reward: parseInt(form.xp_reward) || 20,
    }

    let result
    if (editingId) {
      result = await updateRegexPuzzle(editingId, data)
    } else {
      result = await createRegexPuzzle(data)
    }

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: editingId ? 'Puzzle updated!' : 'Puzzle created!' })
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      await loadPuzzles()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteRegexPuzzle(id)
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Puzzle deleted!' })
      await loadPuzzles()
    }
    setDeletingId(null)
  }

  async function handleToggleActive(id: string, current: boolean) {
    const result = await updateRegexPuzzle(id, { is_active: !current })
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      await loadPuzzles()
    }
  }

  if (loading) {
    return <div className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--card-bg)' }} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Regex Golf Puzzles</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{puzzles.length} puzzles total</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'linear-gradient(to right, #7c3aed, #06b6d4)' }}
        >
          <Plus className="w-4 h-4" />
          Create Puzzle
        </button>
      </div>

      {message && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'success' ? '#22c55e' : '#ef4444',
            border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {editingId ? 'Edit Puzzle' : 'Create Puzzle'}
            </h3>
            <button onClick={() => { setShowForm(false); setEditingId(null) }} style={{ color: 'var(--text-muted)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Title *</label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="e.g. Hex Colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Difficulty</label>
              <select
                value={form.difficulty}
                onChange={e => setForm({ ...form, difficulty: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Description</label>
            <input
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Solution Regex *</label>
            <input
              value={form.solution_regex}
              onChange={e => setForm({ ...form, solution_regex: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none font-mono"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="e.g. ^#[0-9a-fA-F]{6}$"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Match Strings * (one per line)</label>
              <textarea
                value={form.match_strings}
                onChange={e => setForm({ ...form, match_strings: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none font-mono resize-none"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="#fff&#10;#ffffff&#10;#000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Reject Strings * (one per line)</label>
              <textarea
                value={form.reject_strings}
                onChange={e => setForm({ ...form, reject_strings: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none font-mono resize-none"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="ffffff&#10;#ffff&#10;red"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>XP Reward</label>
              <input
                type="number"
                value={form.xp_reward}
                onChange={e => setForm({ ...form, xp_reward: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Max Regex Length (optional)</label>
              <input
                type="number"
                value={form.min_length}
                onChange={e => setForm({ ...form, min_length: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="e.g. 50"
              />
            </div>
          </div>

          {/* Test Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={testRegex}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
            >
              <TestTube className="w-4 h-4" />
              Test Regex
            </button>
            {testResult && (
              <div className="text-sm flex items-center gap-4">
                <span style={{ color: testResult.valid ? '#22c55e' : '#ef4444' }}>
                  {testResult.valid ? '✓ Valid syntax' : `✗ ${testResult.error}`}
                </span>
                {testResult.valid && (
                  <>
                    <span style={{ color: testResult.matchesAll ? '#22c55e' : '#ef4444' }}>
                      {testResult.matchesAll ? '✓ Matches all' : '✗ Missing matches'}
                    </span>
                    <span style={{ color: testResult.rejectsAll ? '#22c55e' : '#ef4444' }}>
                      {testResult.rejectsAll ? '✓ Rejects all' : '✗ Rejecting too many'}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.title || !form.solution_regex}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(to right, #7c3aed, #06b6d4)' }}
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null) }}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Puzzles List */}
      <div className="space-y-2">
        {puzzles.map(puzzle => (
          <div
            key={puzzle.id}
            className="flex items-center gap-4 p-4 rounded-xl"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{puzzle.title}</span>
                <span
                  className="px-2 py-0.5 text-xs font-medium rounded"
                  style={{
                    backgroundColor: puzzle.difficulty === 'easy' ? 'rgba(34, 197, 94, 0.1)' : puzzle.difficulty === 'medium' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: puzzle.difficulty === 'easy' ? '#22c55e' : puzzle.difficulty === 'medium' ? '#eab308' : '#ef4444',
                  }}
                >
                  {puzzle.difficulty}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+{puzzle.xp_reward} XP</span>
              </div>
              <div className="text-xs mt-1 font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                {puzzle.solution_regex}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {puzzle.match_strings.length} match / {puzzle.reject_strings.length} reject
              </div>
            </div>

            <button
              onClick={() => handleToggleActive(puzzle.id, puzzle.is_active)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: puzzle.is_active ? '#22c55e' : 'var(--text-muted)' }}
              title={puzzle.is_active ? 'Active' : 'Inactive'}
            >
              {puzzle.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            <button
              onClick={() => openEdit(puzzle)}
              className="p-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-muted)' }}
            >
              <Pencil className="w-4 h-4" />
            </button>

            {deletingId === puzzle.id ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDelete(puzzle.id)}
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-2 py-1 rounded text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeletingId(puzzle.id)}
                className="p-2 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {puzzles.length === 0 && (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>
            No puzzles yet. Create one to get started.
          </p>
        )}
      </div>
    </div>
  )
}
