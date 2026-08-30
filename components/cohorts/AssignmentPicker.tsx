'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'learn_topic' | 'ctf_challenge' | 'custom'

export default function AssignmentPicker({ cohortId, onCreated }: { cohortId: string; onCreated: () => void }) {
  const [tab, setTab] = useState<Tab>('learn_topic')
  const [title, setTitle] = useState('')
  const [contentId, setContentId] = useState('')
  const [learnTopics, setLearnTopics] = useState<{ slug: string; title: string }[]>([])
  const [ctfChallenges, setCtfChallenges] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('learn_topics').select('slug,title').order('sort_order').then(({ data }: any) => setLearnTopics(data || []))
    supabase.from('ctf_challenges').select('id,title').eq('status', 'approved').order('created_at', { ascending: false }).limit(50).then(({ data }: any) => setCtfChallenges((data as any) || []))
  }, [])

  const submit = async () => {
    setError('')
    if (!title.trim() || title.length < 3) { setError('Title 3-120 chars'); return }
    setLoading(true)
    const res = await fetch(`/api/cohorts/${cohortId}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), content_type: tab, content_id: tab === 'custom' ? title.trim() : contentId }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setError(json.error || 'Failed'); return }
    setTitle(''); setContentId('')
    onCreated()
  }

  return (
    <div className="card p-4 space-y-3">
      <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>New assignment (faculty)</h4>
      <div className="flex gap-2">
        {(['learn_topic','ctf_challenge','custom'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded-lg text-xs border ${tab===t ? 'bg-violet-600 text-white border-violet-600' : ''}`} style={tab!==t ? { borderColor:'var(--border-color)', color:'var(--text-muted)'} : {}}>{t.replace('_',' ')}</button>
        ))}
      </div>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Assignment title" maxLength={120} className="w-full rounded-lg border p-2 text-sm" style={{ borderColor:'var(--border-color)', background:'transparent', color:'var(--text-primary)'}} />
      {tab === 'learn_topic' && (
        <select value={contentId} onChange={e=>setContentId(e.target.value)} className="w-full rounded-lg border p-2 text-sm" style={{ borderColor:'var(--border-color)'}}>
          <option value="">Select topic</option>
          {learnTopics.map(t=> <option key={t.slug} value={t.slug}>{t.title} ({t.slug})</option>)}
        </select>
      )}
      {tab === 'ctf_challenge' && (
        <select value={contentId} onChange={e=>setContentId(e.target.value)} className="w-full rounded-lg border p-2 text-sm" style={{ borderColor:'var(--border-color)'}}>
          <option value="">Select challenge</option>
          {ctfChallenges.map(c=> <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      )}
      {tab !== 'custom' && !contentId && <p className="text-xs" style={{color:'var(--text-muted)'}}>Pick existing content — will link to Learn/CTF.</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button onClick={submit} disabled={loading} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm disabled:opacity-60">{loading ? 'Creating…' : 'Add assignment'}</button>
    </div>
  )
}
