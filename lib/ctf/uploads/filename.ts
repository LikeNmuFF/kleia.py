import {
  ALLOWED_UPLOAD_EXTENSIONS,
  BLOCKED_UPLOAD_EXTENSIONS,
  type AllowedUploadExtension,
} from './types'

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
    throw new Error('Unsupported file type')
  }

  const stem = collapsed.slice(0, collapsed.length - extension.length - 1).trim() || 'attachment'
  return {
    originalName: collapsed,
    storedName: `${stem}.${extension}`,
    extension,
  }
}
