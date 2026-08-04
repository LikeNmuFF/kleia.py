import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import WriteupsClient from './WriteupsClient'

export default async function WriteupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: challenge } = await supabase
    .from('ctf_challenges')
    .select('id, title')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (!challenge) notFound()

  let solved = false
  if (user) {
    const { data: sub } = await supabase
      .from('ctf_submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('challenge_id', id)
      .eq('is_correct', true)
      .maybeSingle()

    solved = !!sub
  }

  return <WriteupsClient challengeId={challenge.id} solved={solved} />
}
