import { getSafeErrorMessage } from '@/lib/errorHandler'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // must be member of cohort
  const { data: isMember } = await supabase.from('cohort_members').select('user_id').eq('cohort_id', id).eq('user_id', user.id).maybeSingle()
  if (!isMember) return NextResponse.json({ error: 'Not a cohort member' }, { status: 403 })

  const { data: members } = await supabase.from('cohort_members').select('user_id').eq('cohort_id', id)
  const userIds = (members || []).map(m => m.user_id)
  if (userIds.length === 0) return NextResponse.json({ averages: null, members: 0 })

  // fetch snapshots via service role (bypasses RLS security_invoker limitation for other users)
  const svc = getServiceClient() as any
  const { data: snapshots, error } = await svc.from('skill_snapshots').select('*').in('user_id', userIds)
  if (error) return NextResponse.json({ error: getSafeErrorMessage(error, 'Something went wrong. Please try again.') }, { status: 500 })

  if (!snapshots?.length) return NextResponse.json({ averages: null, members: userIds.length })

  // averages: learn_completed, ctf_solved, regex_solved, cipher_solved, total_xp, streak
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
  const averages = {
    members: snapshots.length,
    avg_total_xp: Math.round(sum(snapshots.map((s: any) => s.total_xp || 0))),
    avg_learn_completed: Math.round(sum(snapshots.map((s: any) => s.learn_completed_count || 0)) * 10) / 10,
    avg_ctf_solved: Math.round(sum(snapshots.map((s: any) => s.ctf_solved_count || 0)) * 10) / 10,
    avg_regex_solved: Math.round(sum(snapshots.map((s: any) => s.regex_solved_count || 0)) * 10) / 10,
    avg_cipher_solved: Math.round(sum(snapshots.map((s: any) => s.cipher_solved_count || 0)) * 10) / 10,
    avg_streak: Math.round(sum(snapshots.map((s: any) => s.current_streak || 0)) * 10) / 10,
    // breakdown averages for chart
    breakdown: {
      learn: Math.round(sum(snapshots.map((s: any) => s.category_breakdown?.learn?.completed || 0)) * 10) / 10,
      ctf: Math.round(sum(snapshots.map((s: any) => s.category_breakdown?.ctf?.solved || 0)) * 10) / 10,
      regexGolf: Math.round(sum(snapshots.map((s: any) => s.category_breakdown?.regexGolf?.solved || 0)) * 10) / 10,
      dailyCipher: Math.round(sum(snapshots.map((s: any) => s.category_breakdown?.dailyCipher?.solved || 0)) * 10) / 10,
    }
  }

  return NextResponse.json({ averages, snapshots: snapshots.length })
}
