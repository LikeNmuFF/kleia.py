import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { getSafeErrorMessage } from '@/lib/errorHandler'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { code } = await request.json()
  if (!code || typeof code !== 'string' || code.trim().length < 4) return NextResponse.json({ error: 'Code required' }, { status: 400 })
  const svc = getServiceClient() as any
  const { data: cohort, error: findErr } = await svc.from('cohorts').select('id,code').eq('code', code.trim().toLowerCase()).maybeSingle()
  if (findErr) {
    console.error('cohorts join find error', findErr)
    return NextResponse.json({ error: getSafeErrorMessage(findErr, 'Something went wrong. Please try again.') }, { status: 500 })
  }
  if (!cohort) return NextResponse.json({ error: 'Invalid code' }, { status: 404 })
  const { data: existing } = await svc.from('cohort_members').select('user_id').eq('cohort_id', cohort.id).eq('user_id', user.id).maybeSingle()
  if (existing) return NextResponse.json({ id: cohort.id, already: true })
  const { error: insErr } = await svc.from('cohort_members').insert({ cohort_id: cohort.id, user_id: user.id, role: 'student' })
  if (insErr) {
    console.error('cohorts join insert error', insErr)
    return NextResponse.json({ error: getSafeErrorMessage(insErr, 'Something went wrong. Please try again.') }, { status: 500 })
  }
  return NextResponse.json({ id: cohort.id })
}
