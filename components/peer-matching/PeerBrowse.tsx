'use client'
import { useEffect, useState } from 'react'
export default function PeerBrowse() {
  const [requests,setRequests]=useState<any[]>([])
  const [skill,setSkill]=useState('learn')
  const [message,setMessage]=useState('')
  useEffect(()=>{ fetch('/api/peer-requests').then(r=>r.json()).then(d=> setRequests(d.requests||[])) },[])
  const create=async()=>{ await fetch('/api/peer-requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({skill_key:skill,message})}); setMessage(''); location.reload() }
  const help=async(req:any)=>{ await fetch('/api/peer-matches',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requester_id:req.requester_id, skill_key:req.skill_key})}); location.reload() }
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h3 className="font-semibold" style={{color:'var(--text-primary)'}}>Request help</h3>
        <select value={skill} onChange={e=>setSkill(e.target.value)} className="mt-2 w-full rounded-lg border p-2" style={{borderColor:'var(--border-color)'}}>
          <option value="learn">Learn</option><option value="ctf">CTF</option><option value="regexGolf">Regex Golf</option><option value="dailyCipher">Cipher</option>
        </select>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Message (optional, 300 chars)" maxLength={300} className="mt-2 w-full rounded-lg border p-2" style={{borderColor:'var(--border-color)'}} />
        <button onClick={create} className="mt-2 px-4 py-2 rounded-lg bg-violet-600 text-white">Post request</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {requests.map(r=> (
          <div key={r.id} className="card p-4 flex justify-between items-center">
            <div><p className="font-medium" style={{color:'var(--text-primary)'}}>{r.skill_key}</p><p className="text-sm" style={{color:'var(--text-muted)'}}>{r.message||'No message'}</p></div>
            <button onClick={()=>help(r)} className="px-3 py-1 rounded-lg border" style={{borderColor:'var(--border-color)'}}>Help</button>
          </div>
        ))}
        {requests.length===0 && <p style={{color:'var(--text-muted)'}}>No open requests.</p>}
      </div>
    </div>
  )
}
