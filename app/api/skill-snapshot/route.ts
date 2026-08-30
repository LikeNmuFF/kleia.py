import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SkillSnapshot } from '@/lib/skill-analytics/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('skill_snapshots')
    .select('*')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Failed to load skill snapshot' }, { status: 500 })
  }

  return NextResponse.json({ snapshot: (data ?? null) as SkillSnapshot | null })
}
