import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import { Readable } from 'node:stream'
import { v2 as cloudinary } from 'cloudinary'
import type { UploadApiResponse } from 'cloudinary'

export type CloudinaryUploadResult = {
  assetId: string
  publicId: string
}

export type ChallengeUploadInput = {
  buffer: Buffer
  originalName: string
  storedName: string
  sha256: string
}

export type PublicImageUploadResult = {
  secureUrl: string
  publicId: string
}

type ModerationStatus = 'pending' | 'approved' | 'rejected'
type ResourceFetcher = (publicId: string, options: Record<string, unknown>) => Promise<unknown>

export function cloudinaryUploadError(error: unknown): Error {
  if (error instanceof Error) return error
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return new Error(`Cloudinary upload failed: ${error.message}`)
  }
  return new Error('Cloudinary upload failed without an error message')
}

function configureCloudinary() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Missing Cloudinary upload configuration')
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true })
}

export function getModerationStatus(input: unknown): ModerationStatus | null {
  if (!input || typeof input !== 'object') return null
  const moderation = (input as { moderation?: unknown }).moderation
  if (!Array.isArray(moderation)) return null

  for (const item of moderation) {
    if (!item || typeof item !== 'object') continue
    const entry = item as { kind?: unknown; status?: unknown; response?: { status?: unknown } }
    const kind = typeof entry.kind === 'string' ? entry.kind.toLowerCase() : ''
    const status = typeof entry.status === 'string'
      ? entry.status.toLowerCase()
      : typeof entry.response?.status === 'string'
        ? entry.response.status.toLowerCase()
        : ''
    if (kind === 'perception_point' && (status === 'pending' || status === 'approved' || status === 'rejected')) {
      return status
    }
  }
  return null
}

export async function refreshChallengeFileModerationStatus(
  publicId: string,
  fetchResource?: ResourceFetcher
): Promise<ModerationStatus | null> {
  if (!fetchResource) configureCloudinary()
  const resource = fetchResource ?? ((id, options) => cloudinary.api.resource(id, options))
  const result = await resource(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    moderation: true,
  })
  return getModerationStatus(result)
}

export async function uploadChallengeFile(upload: ChallengeUploadInput, ownerId: string): Promise<CloudinaryUploadResult> {
  configureCloudinary()
  const publicId = `kleia-ctf-files/${ownerId}/${randomUUID()}`

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'raw',
        type: 'authenticated',
        context: {
          owner_id: ownerId,
          original_name: upload.originalName,
          sha256: upload.sha256,
          stored_name: upload.storedName,
        },
      },
      (error, response) => {
        if (error || !response) reject(cloudinaryUploadError(error))
        else resolve(response)
      }
    )
    Readable.from(upload.buffer).pipe(stream)
  })

  return {
    assetId: result.asset_id,
    publicId: result.public_id,
  }
}

export async function uploadPublicImageBuffer(
  buffer: Buffer,
  options: { folder: string; mimeType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' }
): Promise<PublicImageUploadResult> {
  configureCloudinary()

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: 'image',
        type: 'upload',
        format: options.mimeType.split('/').at(-1),
      },
      (error, response) => {
        if (error || !response) reject(cloudinaryUploadError(error))
        else resolve(response)
      }
    )
    Readable.from(buffer).pipe(stream)
  })

  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
  }
}

export async function destroyChallengeFile(publicId: string): Promise<void> {
  configureCloudinary()
  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw', type: 'authenticated', invalidate: true })
}

export function verifyCloudinaryWebhookSignature(
  body: string,
  signature: string | null,
  timestamp: string | null,
  nowMs = Date.now()
): boolean {
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!apiSecret || !signature || !timestamp || !/^\d+$/.test(timestamp)) return false

  const timestampMs = Number(timestamp) * 1000
  if (!Number.isFinite(timestampMs) || Math.abs(nowMs - timestampMs) > 5 * 60 * 1000) return false

  const expected = createHash('sha1').update(body + timestamp + apiSecret).digest('hex')
  const expectedBuffer = Buffer.from(expected, 'hex')
  const signatureBuffer = Buffer.from(signature, 'hex')
  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer)
}

export async function getChallengeFileDownloadUrl(publicId: string, extension: string): Promise<string> {
  configureCloudinary()
  return cloudinary.utils.private_download_url(publicId, extension, {
    resource_type: 'raw',
    type: 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + 60,
  })
}
