'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import { FEEDBACK_STATUSES, type FeedbackReport } from '@/lib/feedback/admin'
import { FEEDBACK_TYPES } from '@/lib/feedback/validation'

export async function getAdminFeedback(status = '', type = '', page = 0) {
  const supabase = await createClient()
  await requireAdmin(supabase)
  if ((status && !FEEDBACK_STATUSES.some(value => value === status)) ||
      (type && !FEEDBACK_TYPES.some(value => value === type)) ||
      !Number.isSafeInteger(page) || page < 0 || page > 100000) {
    return { error: 'Invalid feedback filters.' }
  }
  let query = supabase.from('feedback_reports')
    .select('id,type,status,title,message,display_name,rating,page_url,allow_public,created_at,updated_at', { count: 'exact' })
  if (status) query = query.eq('status', status)
  if (type) query = query.eq('type', type)
  const { data, error, count } = await query.order('created_at', { ascending: false })
    .order('id', { ascending: false }).range(page * 25, page * 25 + 24)
  if (error) return { error: 'Could not load feedback. Please try again.' }
  return { reports: (data ?? []) as FeedbackReport[], total: count ?? 0 }
}

export async function updateFeedbackStatus(id: string, status: string) {
  const supabase = await createClient()
  await requireAdmin(supabase)
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id) ||
      !FEEDBACK_STATUSES.some(value => value === status)) {
    return { error: 'Invalid feedback or status.' }
  }
  const { data, error } = await supabase.from('feedback_reports').update({ status })
    .eq('id', id).select('id,status,updated_at').maybeSingle()
  if (error) return { error: 'Could not update feedback. Please try again.' }
  if (!data) return { error: 'Feedback no longer exists or is unavailable.' }
  return { success: true }
}
