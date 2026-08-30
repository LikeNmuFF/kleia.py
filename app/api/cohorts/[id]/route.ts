import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic='force-dynamic'
export async function GET(_:NextRequest,{params}:{params:{id:string}}){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) return NextResponse.json({error:'Unauthorized'},{status:401})
  const { data: cohort } = await supabase.from('cohorts').select('*').eq('id',params.id).maybeSingle()
  if(!cohort) return NextResponse.json({error:'Not found'},{status:404})
  const { data: members } = await supabase.from('cohort_members').select('user_id,role,profiles:user_id(username,avatar_url)').eq('cohort_id',params.id)
  const { data: assignments } = await supabase.from('cohort_assignments').select('*').eq('cohort_id',params.id)
  return NextResponse.json({ cohort, members, assignments })
}
