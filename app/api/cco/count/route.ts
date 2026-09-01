import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { ensureCcoClub } from '@/lib/clubs/cco'

export async function GET() {
  const supabase = getServiceClient() as any
  const { club, error: clubError } = await ensureCcoClub(supabase)

  if (clubError || !club) {
    return NextResponse.json({ count: 0 })
  }

  const { count, error } = await supabase
    .from('club_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('club_id', club.id)

  if (error) {
    return NextResponse.json({ count: 0 })
  }

  return NextResponse.json({ count: count ?? 0 })
}
