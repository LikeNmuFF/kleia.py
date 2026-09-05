import { getSafeErrorMessage } from '@/lib/errorHandler'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { notifyUser } from '@/app/actions/notifications'
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
  if(!body.requester_id || !body.skill_key) return NextResponse.json({error:'Missing fields'},{status:400})
  if(body.requester_id === user.id) return NextResponse.json({error:'Cannot help your own request'},{status:400})
  // prevent duplicate
  const { data: existing } = await supabase.from('peer_matches').select('id').eq('requester_id', body.requester_id).eq('helper_id', user.id).eq('skill_key', body.skill_key).maybeSingle()
  if(existing) return NextResponse.json({error:'Already offered help', id: existing.id},{status:409})
  const { data, error } = await supabase.from('peer_matches').insert({ requester_id:body.requester_id, helper_id:user.id, skill_key:body.skill_key, status:'pending' }).select('id').single()
  if(error) return NextResponse.json({ error: getSafeErrorMessage(error, 'Something went wrong. Please try again.')},{status:500})
  // create direct chat + mark request as matched (best-effort, service bypass)
  try {
    await supabase.rpc('create_direct_conversation', { other_user_id: body.requester_id })
  } catch {}
  try {
    const svc = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: req } = await svc.from('tutor_requests').select('id').eq('requester_id', body.requester_id).eq('skill_key', body.skill_key).eq('status','open').maybeSingle()
    if(req) await svc.from('tutor_requests').update({ status:'matched' }).eq('id', req.id)
  } catch {}
  await notifyUser({ recipientId: body.requester_id, actorId: user.id, type: 'peer_request', title: 'A peer offered help', message: 'Someone offered to help with your learning request.', href: '/peer-matching', metadata: { match_id: data.id, skill_key: body.skill_key }, dedupeKey: `peer-request:${data.id}` })
  return NextResponse.json({ id: data.id, chatHint: 'Chat opened — check /chat' })
}
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data:{user} } = await supabase.auth.getUser()
  if(!user) return NextResponse.json({error:'Unauthorized'},{status:401})
  const { id, status } = await request.json()
  if(!['accepted','declined'].includes(status)) return NextResponse.json({error:'Invalid status'},{status:400})
  const { data: match } = await supabase.from('peer_matches').select('id,requester_id,helper_id').eq('id', id).maybeSingle()
  if(!match || (match.requester_id !== user.id && match.helper_id !== user.id)) return NextResponse.json({error:'Not found'},{status:404})
  // only requester can accept/decline
  if(match.requester_id !== user.id) return NextResponse.json({error:'Only requester can decide'},{status:403})
  const { error } = await supabase.from('peer_matches').update({ status }).eq('id', id)
  if(error) return NextResponse.json({ error: getSafeErrorMessage(error, 'Something went wrong.')},{status:500})
  await notifyUser({ recipientId: match.helper_id, actorId: user.id, type: 'peer_match', title: `Peer request ${status}`, message: `Your peer request was ${status}.`, href: '/peer-matching', metadata: { match_id: id, status }, dedupeKey: `peer-status:${id}:${status}` })
  // award badges best-effort
  try { const { checkBadges } = await import('@/app/actions/gamification'); await checkBadges() } catch {}
  return NextResponse.json({ success:true })
}
