import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { userId, status } = await request.json()

    if (!userId || !status) {
      return NextResponse.json({ error: 'Missing userId or status' }, { status: 400 })
    }

    const supabase = await createClient()
    await supabase
      .from('profiles')
      .update({
        status,
        last_seen: new Date().toISOString(),
      })
      .eq('id', userId)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
