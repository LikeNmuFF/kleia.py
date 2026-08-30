import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic='force-dynamic'
export async function GET(){
  try {
    const supabase=await createClient()
    const {data:{user}}=await supabase.auth.getUser()
    if(!user) return NextResponse.json({error:'Unauthorized'},{status:401})
    const { data, error } = await supabase.from('cohorts').select('id,name,description,code,creator_id,created_at')
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
  const { data, error } = await supabase.from('cohorts').insert({ name:body.name, description:body.description||null, creator_id:user.id }).select('id,code').single()
  if(error) return NextResponse.json({error:error.message},{status:500})
  await supabase.from('cohort_members').insert({ cohort_id:data.id, user_id:user.id, role:'faculty' })
  return NextResponse.json({ id:data.id, code:data.code })
}
