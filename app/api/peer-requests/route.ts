import { getSafeErrorMessage } from '@/lib/errorHandler'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic='force-dynamic'
const VALID = ['learn','ctf','regexGolf','dailyCipher'] as const
export async function GET() {
  const supabase = await createClient()
  const { data:{user} } = await supabase.auth.getUser()
  if(!user) return NextResponse.json({error:'Unauthorized'},{status:401})
  const { data, error } = await supabase.from('tutor_requests').select('id,requester_id,skill_key,message,status,created_at,profiles:requester_id(username,avatar_url)').eq('status','open').order('created_at',{ascending:false}).limit(20)
  if(error) return NextResponse.json({ error: getSafeErrorMessage(error, 'Something went wrong. Please try again.')},{status:500})
  return NextResponse.json({ requests: data })
}
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data:{user} } = await supabase.auth.getUser()
  if(!user) return NextResponse.json({error:'Unauthorized'},{status:401})
  const body = await request.json()
  if(!VALID.includes(body.skill_key)) return NextResponse.json({error:'Invalid skill'},{status:400})
  const { data, error } = await supabase.from('tutor_requests').insert({ requester_id:user.id, skill_key:body.skill_key, message:(body.message||'').slice(0,300) }).select('id').single()
  if(error) return NextResponse.json({ error: getSafeErrorMessage(error, 'Something went wrong. Please try again.')},{status:500})
  return NextResponse.json({ id: data.id })
}
