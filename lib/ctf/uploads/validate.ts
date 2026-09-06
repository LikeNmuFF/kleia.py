import { createHash } from 'node:crypto'
import sharp from 'sharp'
import yauzl from 'yauzl'
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  BLOCKED_UPLOAD_EXTENSIONS,
  MAX_IMAGE_PIXELS,
  MAX_UPLOAD_BYTES,
  MAX_ZIP_ENTRIES,
  MAX_ZIP_EXPANDED_BYTES,
  MAX_ZIP_RATIO,
  type AllowedUploadExtension,
  type UploadContentKind,
  type ValidatedUpload,
} from './types'

type ImageUploadExtension = 'png' | 'jpg' | 'jpeg' | 'gif' | 'webp'

const IMAGE_EXTENSIONS = new Set<AllowedUploadExtension>(['png', 'jpg', 'jpeg', 'gif', 'webp'])
const TEXT_EXTENSIONS = new Set<AllowedUploadExtension>(['txt', 'md', 'json', 'csv'])
const BINARY_DOCUMENT_EXTENSIONS = new Set<AllowedUploadExtension>(['pdf'])
const CAPTURE_EXTENSIONS = new Set<AllowedUploadExtension>(['pcap', 'pcapng'])
const NESTED_ARCHIVE_EXTENSIONS = new Set(['zip', '7z', 'rar', 'gz', 'tar', 'tgz', 'xz', 'bz2'])

function validationError(message = 'Unsupported file type') {
  return new Error(message)
}

function isAllowedExtension(value: string): value is AllowedUploadExtension {
  return (ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(value)
}

export function normalizeUploadFileName(fileName: string): {
  originalName: string
  storedName: string
  extension: AllowedUploadExtension
} {
  const basename = (fileName.normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, '').split(/[\\/]/).pop() || '').trim()
  const collapsed = basename.replace(/^\.+/, '').slice(0, 100)
  const extension = collapsed.includes('.') ? collapsed.split('.').pop()!.toLowerCase() : ''

  if (!collapsed || !extension || BLOCKED_UPLOAD_EXTENSIONS.has(extension) || !isAllowedExtension(extension)) {
    throw validationError()
  }

  const stem = collapsed.slice(0, collapsed.length - extension.length - 1).trim() || 'attachment'
  return {
    originalName: collapsed,
    storedName: `${stem}.${extension}`,
    extension,
  }
}

function ensureSize(buffer: Buffer) {
  if (buffer.byteLength < 1) throw validationError()
  if (buffer.byteLength > MAX_UPLOAD_BYTES) throw validationError('File exceeds 25 MB')
}

function hasPrefix(buffer: Buffer, hex: string) {
  return buffer.subarray(0, hex.length / 2).equals(Buffer.from(hex, 'hex'))
}

function detectBinaryExtension(buffer: Buffer): AllowedUploadExtension | null {
  if (hasPrefix(buffer, '89504e470d0a1a0a')) return 'png'
  if (hasPrefix(buffer, 'ffd8ff')) return 'jpg'
  if (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a') return 'gif'
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp'
  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') return 'pdf'
  if (buffer.subarray(0, 4).toString('ascii') === 'PK\u0003\u0004') return 'zip'
  if (['d4c3b2a1', 'a1b2c3d4', '4d3cb2a1', 'a1b23c4d'].some((magic) => hasPrefix(buffer, magic))) return 'pcap'
  if (hasPrefix(buffer, '0a0d0d0a')) return 'pcapng'
  return null
}

function isImageExtension(extension: AllowedUploadExtension): extension is ImageUploadExtension {
  return IMAGE_EXTENSIONS.has(extension)
}

function ensureText(buffer: Buffer, extension: AllowedUploadExtension) {
  if (buffer.includes(0)) throw validationError()
  const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  if (extension === 'json') JSON.parse(text)
  if (extension === 'csv' && text.trim() && !text.includes(',') && !text.includes('\n')) throw validationError()
}

async function ensureImage(buffer: Buffer, extension: ImageUploadExtension): Promise<Buffer> {
  const image = sharp(buffer, { animated: false, limitInputPixels: MAX_IMAGE_PIXELS })
  const metadata = await image.metadata()
  if (!metadata.width || !metadata.height) throw validationError()
  if (metadata.width * metadata.height > MAX_IMAGE_PIXELS) throw validationError()
  if ((metadata.pages ?? 1) > 1) throw validationError()

  const format: 'png' | 'jpeg' | 'gif' | 'webp' = extension === 'jpg' || extension === 'jpeg' ? 'jpeg' : extension
  return image.rotate().toFormat(format).toBuffer()
}

function inspectZip(buffer: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true, decodeStrings: true }, (openError, zipfile) => {
      if (openError || !zipfile) {
        reject(validationError('Archive contains unsafe content'))
        return
      }

      let entries = 0
      let expandedBytes = 0
      let settled = false

      const fail = () => {
        if (settled) return
        settled = true
        zipfile.close()
        reject(validationError('Archive contains unsafe content'))
      }

      zipfile.on('entry', (entry) => {
        if (settled) return
        entries += 1
        expandedBytes += entry.uncompressedSize
        const name = entry.fileName.replaceAll('\\', '/')
        const parts = name.split('/')
        const entryExt = parts.at(-1)?.includes('.') ? parts.at(-1)!.split('.').pop()!.toLowerCase() : ''
        const compressionRatio = entry.compressedSize === 0 ? entry.uncompressedSize : entry.uncompressedSize / entry.compressedSize
        const mode = (entry.externalFileAttributes >>> 16) & 0o170000
        const encrypted = (entry.generalPurposeBitFlag & 0x1) === 0x1
        const directory = name.endsWith('/')

        if (
          entries > MAX_ZIP_ENTRIES ||
          expandedBytes > MAX_ZIP_EXPANDED_BYTES ||
          compressionRatio > MAX_ZIP_RATIO ||
          encrypted ||
          name.startsWith('/') ||
          /^[a-z]:\//i.test(name) ||
          parts.includes('..') ||
          mode === 0o120000 ||
          (!directory && (!entryExt || BLOCKED_UPLOAD_EXTENSIONS.has(entryExt) || NESTED_ARCHIVE_EXTENSIONS.has(entryExt)))
        ) {
          fail()
          return
        }
        zipfile.readEntry()
      })

      zipfile.once('error', fail)
      zipfile.once('end', () => {
        if (settled) return
        settled = true
        zipfile.close()
        if (entries === 0) reject(validationError('Archive contains unsafe content'))
        else resolve()
      })
      zipfile.readEntry()
    })
  })
}

function contentKindForExtension(extension: AllowedUploadExtension): UploadContentKind {
  if (extension === 'zip') return 'archive'
  if (IMAGE_EXTENSIONS.has(extension)) return 'image'
  if (CAPTURE_EXTENSIONS.has(extension)) return 'capture'
  return 'document'
}

export async function validateChallengeUpload(fileName: string, input: Buffer): Promise<ValidatedUpload> {
  ensureSize(input)
  const normalized = normalizeUploadFileName(fileName)
  const detected = detectBinaryExtension(input)
  let outputBuffer = input

  if (isImageExtension(normalized.extension)) {
    if (!detected || (normalized.extension === 'jpeg' ? detected !== 'jpg' : detected !== normalized.extension)) throw validationError()
    outputBuffer = await ensureImage(input, normalized.extension)
  } else if (normalized.extension === 'zip') {
    if (detected !== 'zip') throw validationError()
    await inspectZip(input)
  } else if (BINARY_DOCUMENT_EXTENSIONS.has(normalized.extension)) {
    if (detected !== normalized.extension) throw validationError()
  } else if (CAPTURE_EXTENSIONS.has(normalized.extension)) {
    if (detected !== normalized.extension) throw validationError()
  } else if (TEXT_EXTENSIONS.has(normalized.extension)) {
    if (detected) throw validationError()
    try {
      ensureText(input, normalized.extension)
    } catch {
      throw validationError()
    }
  }

  return {
    ...normalized,
    buffer: outputBuffer,
    sizeBytes: outputBuffer.byteLength,
    sha256: createHash('sha256').update(outputBuffer).digest('hex'),
    contentKind: contentKindForExtension(normalized.extension),
  }
}
