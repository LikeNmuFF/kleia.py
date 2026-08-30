'use client'
import { useEffect, useState } from 'react'
import CohortCard from '@/components/cohorts/CohortCard'
export default function CohortsPage(){
  const [cohorts,setCohorts]=useState<any[]>([])
  const [name,setName]=useState('')
  const [code,setCode]=useState('')
  const [msg,setMsg]=useState('')
  const refresh=()=> fetch('/api/cohorts').then(r=>r.json()).then(d=> setCohorts(d.cohorts||[]))
  useEffect(()=>{ refresh() },[])
  const create=async()=>{ const r=await fetch('/api/cohorts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})}); const j=await r.json(); if(!r.ok){ setMsg(j.error||'Failed'); return } location.reload() }
  const join=async()=>{ const r=await fetch('/api/cohorts/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})}); const j=await r.json(); if(!r.ok){ setMsg(j.error||'Failed'); return } location.href=`/cohorts/${j.id}` }
  return (<div className="max-w-3xl mx-auto py-8 px-4"><h1 className="text-2xl font-bold mb-4" style={{color:'var(--text-primary)'}}>Cohorts</h1><div className="card p-4 mb-4 flex gap-2"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Cohort name (faculty only)" className="flex-1 rounded-lg border p-2" style={{borderColor:'var(--border-color)'}} /><button onClick={create} className="px-4 py-2 rounded-lg bg-violet-600 text-white">Create</button></div><div className="card p-4 mb-6 flex gap-2"><input value={code} onChange={e=>setCode(e.target.value)} placeholder="Join with code (students)" className="flex-1 rounded-lg border p-2" style={{borderColor:'var(--border-color)'}} /><button onClick={join} className="px-4 py-2 rounded-lg border" style={{borderColor:'var(--border-color)'}}>Join</button></div>{msg && <p className="text-sm text-red-400 mb-4">{msg}</p>}<div className="grid gap-3">{cohorts.map(c=> <a key={c.id} href={`/cohorts/${c.id}`}><CohortCard cohort={c} /></a>)} {cohorts.length===0 && <p style={{color:'var(--text-muted)'}}>No cohorts yet — create or join with a code.</p>}</div></div>)
}
