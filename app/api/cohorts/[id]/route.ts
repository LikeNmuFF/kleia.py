import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
export const dynamic='force-dynamic'
export async function GET(_:NextRequest,{params}:{params: Promise<{id:string}>}){
  const { id } = await params
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) return NextResponse.json({error:'Unauthorized'},{status:401})
  const svc = getServiceClient() as any
  const { data: cohort } = await svc.from('cohorts').select('*').eq('id',id).maybeSingle()
  if(!cohort) return NextResponse.json({error:'Not found'},{status:404})
  // check membership (RLS bypass via service, enforce manually + heal missing creator membership)
  const { data: isMember } = await svc.from('cohort_members').select('user_id').eq('cohort_id',id).eq('user_id',user.id).maybeSingle()
  const isCreator = cohort.creator_id === user.id
  let isAllowed = !!isMember || isCreator
  // also allow if user is member of any cohort via service? strict: must be member of this cohort or creator
  if (!isAllowed) {
    // check profiles role admin bypass
    const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (profile?.role === 'admin') isAllowed = true
  }
  if (!isAllowed) return NextResponse.json({error:'Not a cohort member'}, {status:403})
  // heal: creator missing member row (cohorts created before RLS fix)
  if (!isMember && isCreator) {
    await svc.from('cohort_members').insert({ cohort_id: id, user_id: user.id, role: 'faculty' })
  }
  const { data: members } = await svc.from('cohort_members').select('user_id,role,profiles:user_id(username,avatar_url)').eq('cohort_id',id)
  const { data: assignments } = await svc.from('cohort_assignments').select('*').eq('cohort_id',id)
  return NextResponse.json({ cohort, members, assignments })
}
