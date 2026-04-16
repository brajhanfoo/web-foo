import { randomUUID } from 'node:crypto'

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024
const DANGEROUS_EXTENSIONS = new Set([
  'exe',
  'msi',
  'bat',
  'cmd',
  'ps1',
  'sh',
  'js',
  'mjs',
  'cjs',
  'html',
  'svg',
  'php',
])

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'application/msword': 'doc',
  'text/plain': 'txt',
}

export type ValidatedSubmissionFile = {
  bytes: Uint8Array
  mimeType: string
  extension: string
  size: number
  sanitizedName: string
}

function sanitizeName(name: string): string {
  const withoutSpecial = name.replace(/[^\w.-]/g, '_')
  return withoutSpecial.slice(0, 120) || 'submission'
}

function hasDangerousDoubleExtension(filename: string): boolean {
  const parts = filename.toLowerCase().split('.').filter(Boolean)
  if (parts.length <= 1) return false
  const nonFinalParts = parts.slice(0, -1)
  return nonFinalParts.some((part) => DANGEROUS_EXTENSIONS.has(part))
}

function validateMagicBytes(mimeType: string, bytes: Uint8Array): boolean {
  if (mimeType === 'application/pdf') {
    return (
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46
    )
  }

  if (mimeType === 'image/png') {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    )
  }

  if (mimeType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8
  }

  if (mimeType === 'image/webp') {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    )
  }

  return true
}

export async function validateSubmissionFile(
  file: File
): Promise<ValidatedSubmissionFile> {
  if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Archivo inválido o supera 25 MB.')
  }

  const mimeType = file.type.trim().toLowerCase()
  const extension = ALLOWED_MIME_TO_EXT[mimeType]
  if (!extension) {
    throw new Error('Tipo de archivo no permitido.')
  }

  const sanitizedName = sanitizeName(file.name)
  if (hasDangerousDoubleExtension(sanitizedName)) {
    throw new Error('Nombre de archivo inválido.')
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!validateMagicBytes(mimeType, bytes)) {
    throw new Error('Firma binaria del archivo no coincide con el MIME.')
  }

  return {
    bytes,
    mimeType,
    extension,
    size: file.size,
    sanitizedName,
  }
}

type ObjectPathInput = {
  programId: string
  editionId: string
  teamId: string
  assignmentId: string
  scope: 'team' | 'individual'
  ownerProfileId?: string | null
  extension: string
}

export function buildSubmissionObjectPath(input: ObjectPathInput): string {
  const ownerSegment =
    input.scope === 'individual'
      ? `owner-${(input.ownerProfileId ?? 'unknown').replace(/[^a-zA-Z0-9_-]/g, '')}`
      : 'team'

  const id = randomUUID().replace(/-/g, '')
  return [
    'programs',
    input.programId,
    'editions',
    input.editionId,
    'teams',
    input.teamId,
    'assignments',
    input.assignmentId,
    ownerSegment,
    `${Date.now()}-${id}.${input.extension}`,
  ].join('/')
}

export function sanitizeFeedbackComment(
  value: string,
  maxLength = 5000
): string {
  const stripped = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
  return stripped.trim().slice(0, maxLength)
}
