'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSafeErrorMessage } from '@/lib/errorHandler'
import { extractClientIp, logEvent } from '@/lib/logEvent'
import { checkNamedRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { normalizeFeedbackInput } from '@/lib/feedback/validation'

function field(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

export async function submitFeedback(formData: FormData) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const headerList = await headers()
  const clientIp = extractClientIp(headerList) ?? user.id
  const rateLimit = checkNamedRateLimit('feedback.submit', clientIp, {
    windowMs: 10 * 60 * 1000,
    maxRequests: 5,
  })

  if (!rateLimit.allowed) {
    redirect('/feedback?error=' + encodeURIComponent('Too many submissions. Please try again soon.'))
  }

  const normalized = normalizeFeedbackInput({
    type: field(formData, 'type'),
    rating: field(formData, 'rating'),
    title: field(formData, 'title'),
    message: field(formData, 'message'),
    pageUrl: field(formData, 'pageUrl'),
    allowPublic: formData.get('allowPublic') === 'on',
  })

  if ('error' in normalized) {
    redirect('/feedback?error=' + encodeURIComponent(normalized.error))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name')
    .eq('id', user.id)
    .maybeSingle()

  const displayName = profile?.username || profile?.full_name || user.email?.split('@')[0] || 'Kleia learner'

  const { error } = await supabase.from('feedback_reports').insert({
    user_id: user.id,
    type: normalized.type,
    rating: normalized.rating,
    title: normalized.title,
    message: normalized.message,
    page_url: normalized.pageUrl,
    allow_public: normalized.allowPublic,
    display_name: displayName,
  })

  if (error) {
    await logEvent({
      endpoint: 'feedback.submitFeedback',
      status: 'error',
      durationMs: Date.now() - start,
      errorMessage: error.message,
      userId: user.id,
    })
    redirect('/feedback?error=' + encodeURIComponent(getSafeErrorMessage(error, 'Could not submit feedback. Please try again.')))
  }

  await logEvent({
    endpoint: 'feedback.submitFeedback',
    status: 'success',
    durationMs: Date.now() - start,
    userId: user.id,
  })
  revalidatePath('/')
  revalidatePath('/feedback')
  redirect('/feedback?sent=true')
}
