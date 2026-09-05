'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PenTool, Plus, Save } from 'lucide-react'
import { createChallenge, createSeasonChallenge, updateChallenge } from '@/app/actions/ctf'

interface Season {
  id: string
  name: string
  slug: string
  status: string
  start_date: string
  end_date: string
}

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
  season_id: string | null
  created_at: string
}

const categories = ['web', 'crypto', 'forensics', 'misc']
const difficulties = ['easy', 'medium', 'hard']

export default function ContributorDashboard({ seasons, challenges }: { seasons: Season[]; challenges: Challenge[] }) {
  const router = useRouter()
  const [workspaceId, setWorkspaceId] = useState('global')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const workspaceChallenges = useMemo(
    () => challenges.filter((challenge) => (
      workspaceId === 'global' ? challenge.season_id === null : challenge.season_id === workspaceId
    )),
    [challenges, workspaceId]
  )

  const values = (form: FormData) => ({
    title: String(form.get('title') || ''),
    description: String(form.get('description') || ''),
    category: String(form.get('category') || 'misc'),
    difficulty: String(form.get('difficulty') || 'easy'),
    points: Number(form.get('points')),
    flag: String(form.get('flag') || ''),
    hint: String(form.get('hint') || ''),
    file_url: String(form.get('file_url') || ''),
    link_url: String(form.get('link_url') || ''),
    author: String(form.get('author') || ''),
  })

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    const challenge = values(new FormData(event.currentTarget))
    const result = workspaceId === 'global'
      ? await createChallenge(challenge)
      : await createSeasonChallenge(workspaceId, challenge)
    if (result.error) setMessage(result.error)
    else {
      setCreating(false)
      setMessage(workspaceId === 'global' ? 'Global challenge published to /ctf.' : 'Season challenge published.')
      router.refresh()
    }
  }

  const update = async (id: string, event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    const data = values(new FormData(event.currentTarget))
    const result = await updateChallenge(id, { ...data, flag: data.flag || undefined, status: 'approved' })
    if (result.error) setMessage(result.error)
    else {
      setEditing(null)
      setMessage('Challenge updated and published.')
      router.refresh()
    }
  }

  const fields = (challenge?: Challenge) => <>
    <input name="title" defaultValue={challenge?.title} required placeholder="Challenge title" className="input-field md:col-span-2" />
    <textarea name="description" defaultValue={challenge?.description} required placeholder="Challenge description" rows={5} className="input-field md:col-span-2" />
    <select name="category" defaultValue={challenge?.category ?? 'web'} className="input-field">{categories.map((value) => <option key={value}>{value}</option>)}</select>
    <select name="difficulty" defaultValue={challenge?.difficulty ?? 'easy'} className="input-field">{difficulties.map((value) => <option key={value}>{value}</option>)}</select>
    <input name="points" type="number" min="1" defaultValue={challenge?.points ?? 100} required className="input-field" placeholder="Points" />
    <input name="flag" type="password" required={!challenge} className="input-field" placeholder={challenge ? 'New flag (leave blank to keep)' : 'Flag'} />
    <textarea name="hint" defaultValue={challenge?.hint ?? ''} placeholder="Hint (optional)" className="input-field md:col-span-2" />
    <input name="file_url" defaultValue={challenge?.file_url ?? ''} placeholder="File URL (optional)" className="input-field" />
    <input name="link_url" defaultValue={challenge?.link_url ?? ''} placeholder="Challenge URL (optional)" className="input-field" />
    <input name="author" defaultValue={challenge?.author ?? ''} placeholder="Author credit (optional)" className="input-field md:col-span-2" />
  </>

  return <div className="max-w-5xl mx-auto px-4 py-8">
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#22c55e' }}>Contributor workspace</p>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>CTF challenges</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Publish global challenges for everyone, or create challenges for your invited seasons.</p>
      </div>
      <PenTool className="w-8 h-8 text-emerald-400" />
    </div>

    {message && <div className="mb-5 rounded-xl p-3 text-sm" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>{message}</div>}

    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <select value={workspaceId} onChange={(event) => { setWorkspaceId(event.target.value); setEditing(null); setCreating(false) }} className="input-field max-w-sm">
        <option value="global">Global CTF</option>
        {seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}
      </select>
      <button onClick={() => setCreating((value) => !value)} className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
        <Plus className="w-4 h-4" />{creating ? 'Cancel' : 'Create challenge'}
      </button>
    </div>

    {seasons.length === 0 && <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>You have no season invitations, but you can still publish challenges to Global CTF.</p>}

    {creating && <form onSubmit={create} className="grid md:grid-cols-2 gap-3 rounded-2xl p-5 mb-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      {fields()}
      <button className="md:col-span-2 flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold bg-emerald-600 text-white"><Save className="w-4 h-4" />Publish challenge</button>
    </form>}

    <div className="space-y-3">
      {workspaceChallenges.length === 0
        ? <p className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-muted)' }}>{workspaceId === 'global' ? 'No global challenges created yet.' : 'No challenges created for this season.'}</p>
        : workspaceChallenges.map((challenge) => <div key={challenge.id} className="rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div className="flex justify-between gap-4">
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{challenge.title}</h2>
              <p className="text-xs mt-1 capitalize" style={{ color: 'var(--text-muted)' }}>{challenge.category} · {challenge.difficulty} · {challenge.points} points · {challenge.status}</p>
            </div>
            <button onClick={() => setEditing(editing === challenge.id ? null : challenge.id)} className="text-sm" style={{ color: 'var(--accent)' }}>{editing === challenge.id ? 'Cancel' : 'Edit'}</button>
          </div>
          {editing === challenge.id && <form onSubmit={(event) => update(challenge.id, event)} className="grid md:grid-cols-2 gap-3 mt-5 pt-5 border-t" style={{ borderColor: 'var(--border-color)' }}>
            {fields(challenge)}
            <button className="md:col-span-2 rounded-lg px-4 py-2 font-semibold bg-emerald-600 text-white">Save and publish</button>
          </form>}
        </div>)}
    </div>
  </div>
}
