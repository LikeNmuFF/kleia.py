'use client'
import { useEffect, useState } from 'react'
export default function PeerBrowse() {
  const [requests,setRequests]=useState<any[]>([])
  const [matches,setMatches]=useState<any[]>([])
  const [skill,setSkill]=useState('learn')
  const [message,setMessage]=useState('')
  const [msg,setMsg]=useState('')
  const load=()=> {
    fetch('/api/peer-requests').then(r=>r.json()).then(d=> setRequests(d.requests||[]))
    fetch('/api/peer-matches').then(r=>r.json()).then(d=> setMatches(d.matches||[]))
  }
  useEffect(()=>{ load() },[])
  const create=async()=>{ const r=await fetch('/api/peer-requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({skill_key:skill,message})}); const j=await r.json(); if(!r.ok){ setMsg(j.error); return } setMessage(''); load() }
  const help=async(req:any)=>{ const r=await fetch('/api/peer-matches',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requester_id:req.requester_id, skill_key:req.skill_key})}); const j=await r.json(); if(!r.ok){ setMsg(j.error); return } setMsg('Offered help — chat opened at /chat'); load() }
  const decide=async(id:string,status:string)=>{ const r=await fetch('/api/peer-matches',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status})}); const j=await r.json(); if(!r.ok){ setMsg(j.error); return } setMsg(status==='accepted'?'Accepted — badge progress updated':'Declined'); load() }
  const myId = typeof window !== 'undefined' ? null : null
  return (
    <div className="space-y-6">
      <div className="card p-4">
        <h3 className="font-semibold" style={{color:'var(--text-primary)'}}>Request help</h3>
        <select value={skill} onChange={e=>setSkill(e.target.value)} className="mt-2 w-full rounded-lg border p-2" style={{borderColor:'var(--border-color)'}}>
          <option value="learn">Learn</option><option value="ctf">CTF</option><option value="regexGolf">Regex Golf</option><option value="dailyCipher">Cipher</option>
        </select>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Message (optional, 300 chars)" maxLength={300} className="mt-2 w-full rounded-lg border p-2" style={{borderColor:'var(--border-color)'}} />
        <button onClick={create} className="mt-2 px-4 py-2 rounded-lg bg-violet-600 text-white">Post request</button>
        {msg && <p className="text-xs mt-2" style={{color:'var(--text-muted)'}}>{msg}</p>}
      </div>

      <div>
        <h4 className="font-semibold text-sm mb-2" style={{color:'var(--text-primary)'}}>Open requests — click Help to offer tutoring (creates chat)</h4>
        <div className="grid gap-3 md:grid-cols-2">
          {requests.map(r=> (
            <div key={r.id} className="card p-4 flex justify-between items-center">
              <div><p className="font-medium" style={{color:'var(--text-primary)'}}>{r.skill_key} · {r.profiles?.username || 'anon'}</p><p className="text-sm" style={{color:'var(--text-muted)'}}>{r.message||'No message'}</p></div>
              <button onClick={()=>help(r)} className="px-3 py-1 rounded-lg bg-violet-600 text-white text-sm">Help</button>
            </div>
          ))}
          {requests.length===0 && <p className="text-sm" style={{color:'var(--text-muted)'}}>No open requests.</p>}
        </div>
      </div>

      {matches.length>0 && (
        <div>
          <h4 className="font-semibold text-sm mb-2" style={{color:'var(--text-primary)'}}>My tutoring — accept to earn badges, chat at <a href="/chat" className="text-violet-400 underline">/chat</a></h4>
          <div className="grid gap-2">
            {matches.map((m:any)=> (
              <div key={m.id} className="card p-3 flex justify-between items-center text-sm">
                <span style={{color:'var(--text-secondary)'}}>{m.skill_key} — {m.status} · {m.helper_id === m.requester_id ? 'self' : m.status}</span>
                <div className="flex gap-2">
                  {m.status==='pending' && <><button onClick={()=>decide(m.id,'accepted')} className="px-2 py-1 rounded bg-emerald-600 text-white text-xs">Accept</button><button onClick={()=>decide(m.id,'declined')} className="px-2 py-1 rounded border text-xs" style={{borderColor:'var(--border-color)'}}>Decline</button></>}
                  <a href="/chat" className="px-2 py-1 rounded border text-xs" style={{borderColor:'var(--border-color)'}}>Chat</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
