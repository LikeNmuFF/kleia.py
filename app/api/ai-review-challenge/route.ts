import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { getSafeErrorMessage } from '@/lib/errorHandler'
import { runGroqChat } from '@/lib/ai/groq'
import { buildAdminReviewPrompt, quickBrokenChecks } from '@/lib/ai/admin-review'
import { checkNamedRateLimit, rateLimitResponse } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

function getClientIp(request: NextRequest): string {
  const ip = request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || 'unknown'
  return ip
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // admin check
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  // rate limit: 10 reviews per hour per admin
  const ip = getClientIp(request)
  const key = `ai-review-${user.id}-${ip}`
  const { allowed, retryAfter } = checkNamedRateLimit(key, ip, { windowMs: 60 * 60 * 1000, maxRequests: 20 })
  if (!allowed && retryAfter) return rateLimitResponse(retryAfter)

  const { challengeId } = await request.json()
  if (!challengeId) return NextResponse.json({ error: 'challengeId required' }, { status: 400 })

  const svc = getServiceClient() as any
  const { data: pending, error: pendErr } = await svc.from('ctf_challenges').select('id,title,description,category,difficulty,points,flag_hash,hint,file_url,link_url,status').eq('id', challengeId).maybeSingle()
  if (pendErr) return NextResponse.json({ error: getSafeErrorMessage(pendErr, 'Failed to load challenge') }, { status: 500 })
  if (!pending) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  if (pending.status !== 'pending') return NextResponse.json({ error: 'Only pending challenges can be reviewed' }, { status: 400 })

  // quick local checks (no LLM)
  const quick = quickBrokenChecks({
    id: pending.id,
    title: pending.title,
    description: pending.description,
    category: pending.category,
    difficulty: pending.difficulty,
    points: pending.points,
    flag: 'placeholder', // flag_hash not reversible, so skip format check via placeholder
    hint: pending.hint,
    file_url: pending.file_url,
    link_url: pending.link_url,
  })

  // fetch existing approved for duplicate context
  const { data: existing } = await svc.from('ctf_challenges').select('id,title,category,difficulty').eq('status', 'approved').limit(30)

  let aiNotes = ''
  try {
    const messages = buildAdminReviewPrompt(
      {
        id: pending.id,
        title: pending.title,
        description: pending.description,
        category: pending.category,
        difficulty: pending.difficulty,
        points: pending.points,
        flag: pending.flag_hash ? 'present' : null,
        hint: pending.hint,
        file_url: pending.file_url,
        link_url: pending.link_url,
      },
      (existing || []) as any
    )
    const raw = await runGroqChat(messages)
    aiNotes = raw.slice(0, 4000)
  } catch (e: any) {
    aiNotes = `AI review failed: ${getSafeErrorMessage(e, 'LLM unavailable')}\n` + (quick.length ? `Quick checks: ${quick.join('; ')}` : 'Quick checks: none')
  }

  // prepend quick checks if any
  if (quick.length) {
    aiNotes = `Quick checks: ${quick.join('; ')}\n\n${aiNotes}`
  }

  // store (does not auto-approve)
  const { error: updErr } = await svc.from('ctf_challenges').update({ ai_review_notes: aiNotes }).eq('id', challengeId)
  if (updErr) return NextResponse.json({ error: getSafeErrorMessage(updErr, 'Failed to save review') }, { status: 500 })

  return NextResponse.json({ ai_review_notes: aiNotes })
}
