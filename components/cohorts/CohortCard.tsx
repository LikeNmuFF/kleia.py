export default function CohortCard({ cohort }:{ cohort:any }){
  return <div className="card p-4"><h3 className="font-semibold" style={{color:'var(--text-primary)'}}>{cohort.name}</h3><p className="text-sm" style={{color:'var(--text-muted)'}}>{cohort.description||'No description'} · Code {cohort.code}</p></div>
}
