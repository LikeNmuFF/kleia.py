'use client'
import { useEffect, useState } from 'react'
import AssignmentPicker from './AssignmentPicker'
import CohortStatsChart from './CohortStatsChart'
export default function CohortDashboard({ id }:{ id:string }){
  const [data,setData]=useState<any>(null)
  const [error,setError]=useState<string|null>(null)
  const refresh = () => fetch(`/api/cohorts/${id}`).then(r=>r.json()).then(j=> { if(j.error) setError(j.error); else setData(j) }).catch(e=> setError(e.message))
  useEffect(()=>{ refresh() },[id])
  if(error) return <p className="text-sm text-red-400 p-4 card">{error} — cohort not found or not a member.</p>
  if(!data) return <p style={{color:'var(--text-muted)'}}>Loading…</p>
  if(!data.cohort) return <p className="text-sm text-red-400 p-4 card">Cohort not found.</p>
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold" style={{color:'var(--text-primary)'}}>{data.cohort?.name}</h2>
      <p style={{color:'var(--text-muted)'}}>Code: {data.cohort?.code}</p>
      <CohortStatsChart cohortId={id} />
      <AssignmentPicker cohortId={id} onCreated={refresh} />
      <div><h3 className="font-semibold" style={{color:'var(--text-primary)'}}>Members ({data.members?.length||0})</h3><div className="grid gap-2">{data.members?.map((m:any)=><div key={m.user_id} className="card p-2 text-sm" style={{color:'var(--text-secondary)'}}>{m.profiles?.username} — {m.role}</div>)}</div></div>
      <div><h3 className="font-semibold" style={{color:'var(--text-primary)'}}>Assignments ({data.assignments?.length||0})</h3>{data.assignments?.length ? data.assignments.map((a:any)=><div key={a.id} className="card p-2 text-sm flex justify-between"><span>{a.title}</span><span style={{color:'var(--text-muted)'}}>{a.content_type}</span></div>) : <p style={{color:'var(--text-muted)'}}>No assignments</p>}</div>
    </div>
  )
}
