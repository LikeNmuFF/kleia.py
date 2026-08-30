'use client'
import { useEffect, useState } from 'react'

type Avg = {
  members: number
  avg_total_xp: number
  avg_learn_completed: number
  avg_ctf_solved: number
  avg_regex_solved: number
  avg_cipher_solved: number
  avg_streak: number
  breakdown: { learn:number; ctf:number; regexGolf:number; dailyCipher:number }
}

export default function CohortStatsChart({ cohortId }: { cohortId: string }) {
  const [avgs, setAvgs] = useState<Avg | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/cohorts/${cohortId}/stats`).then(r=>r.json()).then(j=>{
      if (j.error) setError(j.error)
      else setAvgs(j.averages)
      setLoading(false)
    }).catch(e=> { setError(e.message); setLoading(false)})
  }, [cohortId])

  if (loading) return <p className="text-sm" style={{color:'var(--text-muted)'}}>Loading cohort stats…</p>
  if (error) return <p className="text-sm text-red-400">{error}</p>
  if (!avgs) return <p className="text-sm" style={{color:'var(--text-muted)'}}>No member snapshots yet — members need Learn/CTF activity.</p>

  const bars = [
    { label: 'Learn', value: avgs.breakdown.learn, max: 20, color: 'from-violet-500 to-cyan-500' },
    { label: 'CTF', value: avgs.breakdown.ctf, max: 20, color: 'from-emerald-500 to-teal-500' },
    { label: 'Regex', value: avgs.breakdown.regexGolf, max: 15, color: 'from-amber-500 to-orange-500' },
    { label: 'Cipher', value: avgs.breakdown.dailyCipher, max: 30, color: 'from-indigo-500 to-purple-500' },
  ]

  return (
    <div className="card p-4 space-y-3">
      <h4 className="font-semibold text-sm" style={{color:'var(--text-primary)'}}>Cohort averages — {avgs.members} members (RLS-scoped, faculty view)</h4>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg p-2" style={{background:'rgba(139,92,246,0.08)', border:'1px solid var(--border-color)'}}><p style={{color:'var(--text-muted)'}}>Avg XP</p><p className="text-lg font-bold" style={{color:'var(--text-primary)'}}>{avgs.avg_total_xp}</p></div>
        <div className="rounded-lg p-2" style={{background:'rgba(6,182,212,0.08)', border:'1px solid var(--border-color)'}}><p style={{color:'var(--text-muted)'}}>Avg streak</p><p className="text-lg font-bold" style={{color:'var(--text-primary)'}}>{avgs.avg_streak}d</p></div>
      </div>
      <div className="space-y-2">
        {bars.map(b=> (
          <div key={b.label}>
            <div className="flex justify-between text-xs" style={{color:'var(--text-muted)'}}><span>{b.label}</span><span>{b.value}</span></div>
            <div className="h-2 rounded-full overflow-hidden" style={{background:'var(--border-color)'}}>
              <div className={`h-full bg-gradient-to-r ${b.color}`} style={{width:`${Math.min(100, (b.value/b.max)*100)}%`}} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px]" style={{color:'var(--text-muted)'}}>Learn completed {avgs.avg_learn_completed} · CTF solved {avgs.avg_ctf_solved} · Regex {avgs.avg_regex_solved} · Cipher {avgs.avg_cipher_solved}</p>
    </div>
  )
}
