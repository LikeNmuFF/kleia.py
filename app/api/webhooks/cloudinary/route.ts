import { NextRequest, NextResponse } from 'next/server'
import { destroyChallengeFile, getModerationStatus, verifyCloudinaryWebhookSignature } from '@/lib/ctf/uploads/cloudinary'
import { getServiceClient } from '@/lib/supabase/service'
import { logEvent } from '@/lib/logEvent'

export const runtime = 'nodejs'

function readString(input: unknown) {
  return typeof input === 'string' ? input : null
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-cld-signature')
  const timestamp = request.headers.get('x-cld-timestamp')

  if (!verifyCloudinaryWebhookSignature(body, signature, timestamp)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const assetId = readString(payload.asset_id)
  const publicId = readString(payload.public_id)
  const moderationStatus = getModerationStatus(payload) ?? readString(payload.moderation_status)
  if (!assetId || !publicId || !['approved', 'rejected', 'pending'].includes(moderationStatus ?? '')) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const service = getServiceClient()
  const { data: upload } = await service
    .from('ctf_challenge_uploads')
    .select('id, cloudinary_asset_id, cloudinary_public_id, scan_status')
    .eq('cloudinary_public_id', publicId)
    .maybeSingle()

  if (!upload) return NextResponse.json({ ok: true })
  if (upload.cloudinary_asset_id !== assetId) return NextResponse.json({ error: 'Asset mismatch' }, { status: 400 })
  if (upload.scan_status !== 'pending') return NextResponse.json({ ok: true })

  const nextStatus = moderationStatus === 'approved' ? 'approved' : moderationStatus === 'rejected' ? 'rejected' : 'pending'
  const scannedAt = nextStatus === 'pending' ? null : new Date().toISOString()
  const { error } = await service
    .from('ctf_challenge_uploads')
    .update({
      scan_status: nextStatus,
      scan_result: payload,
      scanned_at: scannedAt,
    })
    .eq('id', upload.id)
    .eq('scan_status', 'pending')

  if (error) {
    await logEvent({ endpoint: 'cloudinary.webhook', status: 'error', durationMs: 0, errorMessage: error.message })
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }

  if (nextStatus === 'rejected') await destroyChallengeFile(publicId)

  return NextResponse.json({ ok: true })
}
