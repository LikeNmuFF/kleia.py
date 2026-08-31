import { getSafeErrorMessage } from '@/lib/errorHandler'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
export const dynamic='force-dynamic'
export async function GET() {
  const supabase = await createClient()
  const { data:{user} } = await supabase.auth.getUser()
  if(!user) return NextResponse.json({error:'Unauthorized'},{status:401})
  const { data, error } = await supabase.from('peer_matches').select('*').or(`requester_id.eq.${user.id},helper_id.eq.${user.id}`).order('created_at',{ascending:false})
  if(error) return NextResponse.json({ error: getSafeErrorMessage(error, 'Something went wrong. Please try again.')},{status:500})
  return NextResponse.json({ matches: data })
}
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data:{user} } = await supabase.auth.getUser()
  if(!user) return NextResponse.json({error:'Unauthorized'},{status:401})
  const body = await request.json()
  const { data, error } = await supabase.from('peer_matches').insert({ requester_id:body.requester_id, helper_id:user.id, skill_key:body.skill_key, status:'pending' }).select('id').single()
  if(error) return NextResponse.json({ error: getSafeErrorMessage(error, 'Something went wrong. Please try again.')},{status:500})
  return NextResponse.json({ id: data.id })
}
