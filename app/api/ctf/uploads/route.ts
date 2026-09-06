import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { checkNamedRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { logEvent } from '@/lib/logEvent'
import { destroyChallengeFile, uploadValidatedChallengeFile } from '@/lib/ctf/uploads/cloudinary'
import { validateChallengeUpload } from '@/lib/ctf/uploads/validate'
import {
  canUploadGlobalChallengeFile,
  canUploadSeasonChallengeFile,
  type CallerRole,
} from '@/lib/ctf/uploads/scope'
import { MAX_UPLOAD_BYTES } from '@/lib/ctf/uploads/types'

export const runtime = 'nodejs'

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

function isSameOrigin(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const origin = request.headers.get('origin')
  return Boolean(siteUrl && origin && origin === siteUrl.replace(/\/$/, ''))
}

async function getCaller() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, role: null as CallerRole }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { supabase, user, role: (profile?.role ?? null) as CallerRole }
}

export async function POST(request: NextRequest) {
  const start = Date.now()
  if (!isSameOrigin(request)) return jsonError('Unauthorized', 403)

  const length = Number(request.headers.get('content-length') || 0)
  if (Number.isFinite(length) && length > MAX_UPLOAD_BYTES) return jsonError('File exceeds 25 MB', 413)

  const { supabase, user, role } = await getCaller()
  if (!user) return jsonError('Not logged in', 401)

  const rate = checkNamedRateLimit('ctf-upload', user.id, { windowMs: 60 * 60 * 1000, maxRequests: 5 })
  if (!rate.allowed) return rateLimitResponse(rate.retryAfter ?? 3600)

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return jsonError('Unsupported file type', 400)
  }

  const file = form.get('file')
  if (!(file instanceof File)) return jsonError('Unsupported file type', 400)

  const seasonIdValue = form.get('season_id')
  const seasonId = typeof seasonIdValue === 'string' && seasonIdValue.trim() ? seasonIdValue.trim() : null
  let invited = false
  if (seasonId && role === 'contributor') {
    const { data: invitation } = await supabase
      .from('ctf_season_contributors')
      .select('user_id')
      .eq('season_id', seasonId)
      .eq('user_id', user.id)
      .maybeSingle()
    invited = Boolean(invitation)
  }

  const allowed = seasonId
    ? canUploadSeasonChallengeFile({ role, invited })
    : canUploadGlobalChallengeFile(role)
  if (!allowed) return jsonError('Unauthorized', 403)

  let validated
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    validated = await validateChallengeUpload(file.name, buffer)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unsupported file type'
    await logEvent({ endpoint: 'ctf.upload', status: 'error', durationMs: Date.now() - start, errorMessage: message, userId: user.id })
    return jsonError(message, message === 'File exceeds 25 MB' ? 413 : 400)
  }

  let uploaded
  try {
    uploaded = await uploadValidatedChallengeFile(validated, user.id)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'File scanning is temporarily unavailable'
    await logEvent({ endpoint: 'ctf.upload', status: 'error', durationMs: Date.now() - start, errorMessage: message, userId: user.id })
    return jsonError('File scanning is temporarily unavailable', 503)
  }

  const service = getServiceClient()
  const { data: row, error: insertError } = await service
    .from('ctf_challenge_uploads')
    .insert({
      owner_id: user.id,
      challenge_id: null,
      scope_season_id: seasonId,
      cloudinary_asset_id: uploaded.assetId,
      cloudinary_public_id: uploaded.publicId,
      original_name: validated.originalName,
      stored_name: validated.storedName,
      extension: validated.extension,
      size_bytes: validated.sizeBytes,
      sha256: validated.sha256,
      scan_status: uploaded.moderationStatus,
      scan_provider: 'perception_point',
      scan_result: { moderation_status: uploaded.moderationStatus },
      scanned_at: uploaded.moderationStatus === 'approved' ? new Date().toISOString() : null,
    })
    .select('id, scan_status, stored_name')
    .single()

  if (insertError || !row) {
    await destroyChallengeFile(uploaded.publicId)
    await logEvent({ endpoint: 'ctf.upload', status: 'error', durationMs: Date.now() - start, errorMessage: insertError?.message ?? 'Insert failed', userId: user.id })
    return jsonError('File scanning is temporarily unavailable', 503)
  }

  await logEvent({ endpoint: 'ctf.upload', status: 'success', durationMs: Date.now() - start, userId: user.id })
  return NextResponse.json({ id: row.id, status: row.scan_status, fileName: row.stored_name })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return jsonError('Upload required', 400)

  const { supabase, user } = await getCaller()
  if (!user) return jsonError('Not logged in', 401)

  const { data: upload } = await supabase
    .from('ctf_challenge_uploads')
    .select('id, scan_status, stored_name')
    .eq('id', id)
    .maybeSingle()

  if (!upload) return jsonError('Upload not found', 404)
  return NextResponse.json({ id: upload.id, status: upload.scan_status, fileName: upload.stored_name })
}
