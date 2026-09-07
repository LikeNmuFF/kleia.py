import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { checkNamedRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { logEvent } from '@/lib/logEvent'
import { getSafeErrorMessage } from '@/lib/errorHandler'
import { createHash } from 'node:crypto'
import {
  destroyChallengeFile,
  refreshChallengeFileModerationStatus,
  uploadChallengeFile,
} from '@/lib/ctf/uploads/cloudinary'
import { normalizeUploadFileName } from '@/lib/ctf/uploads/filename'
import { isAllowedUploadOrigin } from '@/lib/ctf/uploads/origin'
import {
  canUploadGlobalChallengeFile,
  canUploadSeasonChallengeFile,
  type CallerRole,
} from '@/lib/ctf/uploads/scope'
import { MAX_UPLOAD_BYTES } from '@/lib/ctf/uploads/types'

export const runtime = 'nodejs'

function jsonError(error: string, status: number) {
  return NextResponse.json({ error: getSafeErrorMessage(null, error) }, { status })
}

function isSameOrigin(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const origin = request.headers.get('origin')
  return isAllowedUploadOrigin(origin, siteUrl)
}

async function getCaller() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, role: null as CallerRole }
  const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (error) throw new Error(`Upload profile lookup failed: ${error.message}`)
  return { supabase, user, role: (profile?.role ?? null) as CallerRole }
}

export async function POST(request: NextRequest) {
  try {
    return await upload(request)
  } catch (error) {
    await logEvent({ endpoint: 'ctf.upload', status: 'error', durationMs: 0, errorMessage: error instanceof Error ? error.message : String(error) })
    return jsonError('Unable to attach the file. Please try again later.', 500)
  }
}

async function upload(request: NextRequest) {
  const start = Date.now()
  if (!isSameOrigin(request)) {
    await logEvent({ endpoint: 'ctf.upload', status: 'error', durationMs: Date.now() - start, errorMessage: `Origin rejected: ${request.headers.get('origin')}; configured site: ${process.env.NEXT_PUBLIC_SITE_URL ?? 'unset'}` })
    return jsonError('Unable to attach the file. Please refresh the page and try again.', 403)
  }

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
  if (file.size < 1) return jsonError('File is empty', 400)
  if (file.size > MAX_UPLOAD_BYTES) return jsonError('File exceeds 25 MB', 413)

  const seasonIdValue = form.get('season_id')
  const seasonId = typeof seasonIdValue === 'string' && seasonIdValue.trim() ? seasonIdValue.trim() : null
  let invited = false
  if (seasonId && role === 'contributor') {
    const { data: invitation, error } = await supabase
      .from('ctf_season_contributors')
      .select('user_id')
      .eq('season_id', seasonId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) throw new Error(`Upload invitation lookup failed: ${error.message}`)
    invited = Boolean(invitation)
  }

  const allowed = seasonId
    ? canUploadSeasonChallengeFile({ role, invited })
    : canUploadGlobalChallengeFile(role)
  if (!allowed) {
    await logEvent({ endpoint: 'ctf.upload', status: 'error', durationMs: Date.now() - start, userId: user.id, errorMessage: `Upload permission denied: role=${role}, season=${seasonId}, invited=${invited}` })
    return jsonError('You do not have permission to attach files in this workspace.', 403)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  let normalized
  try {
    normalized = normalizeUploadFileName(file.name)
  } catch {
    await logEvent({ endpoint: 'ctf.upload', status: 'error', durationMs: Date.now() - start, errorMessage: 'Unsupported file type', userId: user.id })
    return jsonError('Unsupported file type', 400)
  }
  const sha256 = createHash('sha256').update(buffer).digest('hex')

  let uploaded
  try {
    uploaded = await uploadChallengeFile(
      {
        buffer,
        originalName: normalized.originalName,
        storedName: normalized.storedName,
        sha256,
      },
      user.id
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cloudinary upload failed'
    await logEvent({ endpoint: 'ctf.upload', status: 'error', durationMs: Date.now() - start, errorMessage: message, userId: user.id })
    return jsonError('File upload is temporarily unavailable. Please try again later.', 503)
  }

  const service = getServiceClient() as any
  const { data: row, error: insertError } = await service
    .from('ctf_challenge_uploads')
    .insert({
      owner_id: user.id,
      challenge_id: null,
      scope_season_id: seasonId,
      cloudinary_asset_id: uploaded.assetId,
      cloudinary_public_id: uploaded.publicId,
      original_name: normalized.originalName,
      stored_name: normalized.storedName,
      extension: normalized.extension,
      size_bytes: buffer.byteLength,
      sha256,
      // Approved means attachable; these files have not been malware-scanned.
      scan_status: 'approved',
      scan_provider: 'none',
      scan_result: { scanning: 'disabled' },
      scanned_at: null,
    })
    .select('id, scan_status, stored_name')
    .single()

  if (insertError || !row) {
    await logEvent({ endpoint: 'ctf.upload', status: 'error', durationMs: Date.now() - start, errorMessage: insertError?.message ?? 'Insert failed', userId: user.id })
    await destroyChallengeFile(uploaded.publicId)
    return jsonError('File upload is temporarily unavailable. Please try again later.', 503)
  }

  await logEvent({ endpoint: 'ctf.upload', status: 'success', durationMs: Date.now() - start, userId: user.id })
  return NextResponse.json({ id: row.id, status: row.scan_status, fileName: row.stored_name })
}

export async function GET(request: NextRequest) {
  try {
    return await uploadStatus(request)
  } catch (error) {
    await logEvent({ endpoint: 'ctf.upload.status', status: 'error', durationMs: 0, errorMessage: error instanceof Error ? error.message : String(error) })
    return jsonError('Unable to check the file. Please try again later.', 500)
  }
}

async function uploadStatus(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return jsonError('Upload required', 400)

  const { supabase, user } = await getCaller()
  if (!user) return jsonError('Not logged in', 401)

  const { data: upload, error: lookupError } = await supabase
    .from('ctf_challenge_uploads')
    .select('id, scan_status, stored_name, cloudinary_public_id')
    .eq('id', id)
    .maybeSingle()

  if (lookupError) throw new Error(`Upload status lookup failed: ${lookupError.message}`)
  if (!upload) return jsonError('Upload not found', 404)

  let status = upload.scan_status
  if (status === 'pending') {
    try {
      const refreshedStatus = await refreshChallengeFileModerationStatus(upload.cloudinary_public_id)
      if (refreshedStatus === 'approved' || refreshedStatus === 'rejected') {
        const service = getServiceClient() as any
        const { error } = await service
          .from('ctf_challenge_uploads')
          .update({ scan_status: refreshedStatus, scan_result: { moderation_status: refreshedStatus }, scanned_at: new Date().toISOString() })
          .eq('id', upload.id)
          .eq('scan_status', 'pending')

        if (error) throw new Error(`Upload status update failed: ${error.message}`)
        if (!error) {
          status = refreshedStatus
          if (refreshedStatus === 'rejected') await destroyChallengeFile(upload.cloudinary_public_id)
        }
      }
    } catch (error) {
      await logEvent({
        endpoint: 'ctf.upload.status',
        status: 'error',
        durationMs: 0,
        errorMessage: error instanceof Error ? error.message : 'Moderation status lookup failed',
        userId: user.id,
      })
    }
  }

  return NextResponse.json({ id: upload.id, status, fileName: upload.stored_name })
}
