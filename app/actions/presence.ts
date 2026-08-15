'use server'

import { createClient } from '@/lib/supabase/server'

export async function pingPresence() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('profiles')
    .update({ last_seen: new Date().toISOString(), status: 'online' })
    .eq('id', user.id)
}