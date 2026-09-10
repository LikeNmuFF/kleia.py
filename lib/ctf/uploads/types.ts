export const ALLOWED_UPLOAD_EXTENSIONS = [
  'zip',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'pdf',
  'txt',
  'md',
  'json',
  'csv',
  'pcap',
  'pcapng',
] as const

export type AllowedUploadExtension = (typeof ALLOWED_UPLOAD_EXTENSIONS)[number]

export const BLOCKED_UPLOAD_EXTENSIONS = new Set([
  'html',
  'htm',
  'svg',
  'js',
  'mjs',
  'cjs',
  'wasm',
  'sh',
  'bash',
  'ps1',
  'bat',
  'cmd',
  'exe',
  'dll',
  'so',
  'dylib',
  'msi',
  'jar',
  'apk',
  'iso',
  'img',
  'docm',
  'xlsm',
  'pptm',
])

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024
export const MAX_ZIP_EXPANDED_BYTES = 100 * 1024 * 1024
export const MAX_ZIP_ENTRIES = 200
export const MAX_ZIP_RATIO = 100
export const MAX_IMAGE_PIXELS = 25_000_000

export type UploadScope = { seasonId: string | null }

export type UploadContentKind = 'archive' | 'image' | 'document' | 'capture'

export type ValidatedUpload = {
  buffer: Buffer
  originalName: string
  storedName: string
  extension: AllowedUploadExtension
  sizeBytes: number
  sha256: string
  contentKind: UploadContentKind
}

export type ChallengeUploadRow = {
  id: string
  owner_id: string
  challenge_id: string | null
  scope_season_id: string | null
  scope_room_id?: string | null
  cloudinary_asset_id: string
  cloudinary_public_id: string
  original_name: string
  stored_name: string
  extension: AllowedUploadExtension
  size_bytes: number
  sha256: string
  scan_status: 'pending' | 'approved' | 'rejected'
  scan_provider: 'perception_point' | 'none'
  scan_result: unknown
  created_at: string
  scanned_at: string | null
}
