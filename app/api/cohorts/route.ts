import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
export const dynamic='force-dynamic'
export async function GET(){
  try {
    const supabase=await createClient()
    const {data:{user}}=await supabase.auth.getUser()
    if(!user) return NextResponse.json({error:'Unauthorized'},{status:401})
    // Use service client to avoid RLS recursion on cohort_members self-check; filter to user's memberships
    const svc = getServiceClient() as any
    const { data: memberships, error: memErr } = await svc.from('cohort_members').select('cohort_id').eq('user_id', user.id)
    if (memErr) {
      console.error('cohorts GET memberships error', memErr)
      return NextResponse.json({error: memErr.message, details: memErr}, {status:500})
    }
    const ids = (memberships || []).map((m:any)=> m.cohort_id)
    if (ids.length===0) return NextResponse.json({ cohorts: [] })
    const { data, error } = await svc.from('cohorts').select('id,name,description,code,creator_id,created_at').in('id', ids)
    if(error) {
      console.error('cohorts GET error', error)
      return NextResponse.json({error:error.message, details: error}, {status:500})
    }
    return NextResponse.json({ cohorts: data || [] })
  } catch (e:any) {
    console.error('cohorts GET exception', e)
    return NextResponse.json({error: e.message || 'Internal error'}, {status:500})
  }
}
export async function POST(request: NextRequest){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) return NextResponse.json({error:'Unauthorized'},{status:401})
  const { role } = (await supabase.from('profiles').select('role').eq('id',user.id).single()).data || {}
  if(role!=='faculty' && role!=='admin') return NextResponse.json({error:'Faculty only'},{status:403})
  const body = await request.json()
  if(!body.name || body.name.length<3) return NextResponse.json({error:'Name required'},{status:400})
  // Use service client to bypass RLS chicken-egg for initial faculty membership
  const svc = getServiceClient() as any
  const { data, error } = await svc.from('cohorts').insert({ name:body.name, description:body.description||null, creator_id:user.id }).select('id,code').single()
  if(error) return NextResponse.json({error:error.message},{status:500})
  const { error: memErr } = await svc.from('cohort_members').insert({ cohort_id:data.id, user_id:user.id, role:'faculty' })
  if(memErr) {
    console.error('cohorts POST member error', memErr)
    return NextResponse.json({error: memErr.message, details: memErr}, {status:500})
  }
  return NextResponse.json({ id:data.id, code:data.code })
}
