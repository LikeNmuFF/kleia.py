import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ users: [] })
  }

  // Strip ILIKE wildcards to prevent pattern injection
  const safeQuery = query.replace(/[%*_]/g, '')

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .ilike('username', `%${safeQuery}%`)
    .limit(10)

  return NextResponse.json({ users: users || [] })
}
