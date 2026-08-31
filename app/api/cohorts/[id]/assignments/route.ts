import { getSafeErrorMessage } from '@/lib/errorHandler'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('cohort_assignments').select('*').eq('cohort_id', id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: getSafeErrorMessage(error, 'Something went wrong. Please try again.') }, { status: 500 })
  return NextResponse.json({ assignments: data })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // faculty check: must be faculty member of this cohort or admin
  const { data: membership } = await supabase.from('cohort_members').select('role').eq('cohort_id', id).eq('user_id', user.id).maybeSingle()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!membership && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Not a cohort member' }, { status: 403 })
  }
  if (membership?.role !== 'faculty' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Faculty only' }, { status: 403 })
  }

  const body = await request.json()
  const title = (body.title || '').trim()
  const content_type = body.content_type as string
  const content_id = (body.content_id || body.title || '').trim()

  if (!title || title.length < 3 || title.length > 120) return NextResponse.json({ error: 'Title 3-120 chars' }, { status: 400 })
  if (!['learn_topic', 'ctf_challenge', 'custom'].includes(content_type)) return NextResponse.json({ error: 'Invalid content_type' }, { status: 400 })
  if (!content_id) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  const { data, error } = await supabase.from('cohort_assignments').insert({
    cohort_id: id,
    title,
    content_id,
    content_type,
  }).select('id').single()

  if (error) return NextResponse.json({ error: getSafeErrorMessage(error, 'Something went wrong. Please try again.') }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
