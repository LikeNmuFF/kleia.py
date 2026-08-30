'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CohortCard from '@/components/cohorts/CohortCard'
export default function CohortsPage(){
  const [cohorts,setCohorts]=useState<any[]>([])
  const [name,setName]=useState('')
  const [code,setCode]=useState('')
  const [msg,setMsg]=useState('')
  const [role,setRole]=useState<string|null>(null)
  const refresh=()=> fetch('/api/cohorts').then(r=>r.json()).then(d=> setCohorts(d.cohorts||[]))
  useEffect(()=>{ refresh(); const sup=createClient(); sup.auth.getUser().then(({data:{user}}: any)=>{ if(user) sup.from('profiles').select('role').eq('id',user.id).maybeSingle().then(({data}: any)=> setRole(data?.role||null)) }) },[])
  const create=async()=>{ const r=await fetch('/api/cohorts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})}); const j=await r.json(); if(!r.ok){ setMsg(j.error||'Failed'); return } location.reload() }
  const join=async()=>{ const r=await fetch('/api/cohorts/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})}); const j=await r.json(); if(!r.ok){ setMsg(j.error||'Failed'); return } location.href=`/cohorts/${j.id}` }
  const isFaculty = role==='faculty' || role==='admin'
  return (<div className="max-w-3xl mx-auto py-8 px-4"><h1 className="text-2xl font-bold mb-4" style={{color:'var(--text-primary)'}}>Cohorts {role && <span className="text-sm font-normal ml-2" style={{color:'var(--text-muted)'}}>— {role}</span>}</h1>{isFaculty ? <div className="card p-4 mb-4 flex gap-2"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Cohort name" className="flex-1 rounded-lg border p-2" style={{borderColor:'var(--border-color)'}} /><button onClick={create} className="px-4 py-2 rounded-lg bg-violet-600 text-white">Create</button></div> : <div className="card p-4 mb-4 text-sm" style={{color:'var(--text-muted)', borderColor:'var(--border-color)'}}>Only faculty can create cohorts — ask your instructor for a code to join below.</div>}<div className="card p-4 mb-6 flex gap-2"><input value={code} onChange={e=>setCode(e.target.value)} placeholder="Enter code to join" className="flex-1 rounded-lg border p-2" style={{borderColor:'var(--border-color)'}} /><button onClick={join} className="px-4 py-2 rounded-lg border" style={{borderColor:'var(--border-color)'}}>Join</button></div>{msg && <p className="text-sm text-red-400 mb-4">{msg}</p>}<div className="grid gap-3">{cohorts.map(c=> <a key={c.id} href={`/cohorts/${c.id}`}><CohortCard cohort={c} /></a>)} {cohorts.length===0 && <p style={{color:'var(--text-muted)'}}>{isFaculty ? 'No cohorts yet — create one above.' : 'No cohorts yet — enter a code to join.'}</p>}</div></div>)
}
