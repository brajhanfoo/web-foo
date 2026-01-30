// src/app/plataforma/admin/postulaciones/%5BpostulacionesId%5D/helpers.ts
import type {
  ApplicantProfileSummary,
  ApplicationRow,
  ApplicationStatus,
  ParsedAnswers,
} from './types/types'

/* ----------------------------- Helpers (safe) ----------------------------- */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function getStringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

export function getBooleanValue(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

export function getStringArrayValue(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const allStrings = value.every((item) => typeof item === 'string')
  return allStrings ? (value as string[]) : null
}

export function formatDateTimeIsoLike(timestamp: string): string {
  const normalized = timestamp.replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return timestamp
  return date.toLocaleString()
}

export function buildWhatsAppLink(whatsappE164: string): string {
  const digits = whatsappE164.replace(/[^\d]/g, '')
  return `https://wa.me/${digits}`
}

export function statusToStepIndex(status: ApplicationStatus): number {
  if (status === 'received') return 1
  if (status === 'payment_pending') return 2
  if (status === 'enrolled') return 4
  return 1
}

export function statusBadgeLabel(status: ApplicationStatus): string {
  if (status === 'received') return 'Recibida'
  if (status === 'payment_pending') return 'Pago pendiente'
  if (status === 'enrolled') return 'Matriculada'
  if (status === 'rejected') return 'Rechazada'
  return status
}

export function buildFullName(profile: ApplicantProfileSummary | null): string | null {
  if (!profile) return null
  const parts = [profile.first_name ?? '', profile.last_name ?? '']
    .map((segment) => segment.trim())
    .filter(Boolean)
  return parts.length ? parts.join(' ') : null
}

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return (
    value === 'received' ||
    value === 'admitted' ||
    value === 'payment_pending' ||
    value === 'enrolled' ||
    value === 'rejected'
  )
}

export function normalizeParam(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return null
}

export function textOrNA(value: string | null | undefined): string {
  const normalized = (value ?? '').trim()
  return normalized ? normalized : 'No definido'
}

export function arrayOrNull(value: string[] | null | undefined): string[] | null {
  return Array.isArray(value) && value.length ? value : null
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function getEmailFromAnswers(answers: ParsedAnswers | undefined): string | null {
  const email = answers?.['email']
  const correo = answers?.['correo']
  const emailString = typeof email === 'string' ? email.trim() : ''
  const correoString = typeof correo === 'string' ? correo.trim() : ''

  if (emailString) return emailString
  if (correoString) return correoString
  return null
}

/* --------------------------- Mapping from Supabase -------------------------- */

type DebugInfo = {
  phase: string
  message: string
  details?: Record<string, unknown>
}

export function mapSupabaseRowToApplicationRow(
  raw: unknown
): { applicationRow: ApplicationRow | null; debugInfo: DebugInfo | null } {
  if (!isRecord(raw)) {
    return {
      applicationRow: null,
      debugInfo: {
        phase: 'map.row',
        message: 'Fila inesperada: no es un objeto.',
        details: { rawType: typeof raw },
      },
    }
  }

  const id = getStringValue(raw['id'])
  const applicantProfileId = getStringValue(raw['applicant_profile_id'])
  const programId = getStringValue(raw['program_id'])
  const editionId = getStringValue(raw['edition_id'])
  const statusValue = raw['status']
  const appliedRole = getStringValue(raw['applied_role'])
  const cvUrl = getStringValue(raw['cv_url'])
  const createdAt = getStringValue(raw['created_at'])
  const updatedAt = getStringValue(raw['updated_at'])
  const formId = getStringValue(raw['form_id'])

  const answersRaw = raw['answers']
  const answers: ParsedAnswers = isRecord(answersRaw) ? answersRaw : {}

  if (!id || !applicantProfileId || !programId || !createdAt || !updatedAt) {
    return {
      applicationRow: null,
      debugInfo: {
        phase: 'map.required',
        message: 'Faltan campos requeridos en applications.',
        details: {
          id,
          applicantProfileId,
          programId,
          createdAt,
          updatedAt,
        },
      },
    }
  }

  const status: ApplicationStatus = isApplicationStatus(statusValue)
    ? statusValue
    : 'received'

  const programRaw = raw['program']
  const program = isRecord(programRaw)
    ? {
        id: getStringValue(programRaw['id']) ?? programId,
        title: getStringValue(programRaw['title']),
        slug: getStringValue(programRaw['slug']),
      }
    : null

  const editionRaw = raw['edition']
  const edition = isRecord(editionRaw)
    ? {
        id: getStringValue(editionRaw['id']) ?? (editionId ?? ''),
        edition_name: getStringValue(editionRaw['edition_name']),
      }
    : null

  const applicantProfileRaw = raw['applicant_profile']
  const applicantProfile = isRecord(applicantProfileRaw)
    ? {
        id: getStringValue(applicantProfileRaw['id']) ?? applicantProfileId,
        first_name: getStringValue(applicantProfileRaw['first_name']),
        last_name: getStringValue(applicantProfileRaw['last_name']),
        country_residence: getStringValue(applicantProfileRaw['country_residence']),
        whatsapp_e164: getStringValue(applicantProfileRaw['whatsapp_e164']),
        linkedin_url: getStringValue(applicantProfileRaw['linkedin_url']),
        portfolio_url: getStringValue(applicantProfileRaw['portfolio_url']),
        english_level: getStringValue(applicantProfileRaw['english_level']),
        email: getStringValue(applicantProfileRaw['email']),
        role: getStringValue(applicantProfileRaw['role']),
        document_number: getStringValue(applicantProfileRaw['document_number']),
        primary_role: getStringValue(applicantProfileRaw['primary_role']),
        profile_status: getStringValue(applicantProfileRaw['profile_status']),
        skills: getStringArrayValue(applicantProfileRaw['skills']),
      }
    : null

  const applicationRow: ApplicationRow = {
    id,
    applicant_profile_id: applicantProfileId,
    program_id: programId,
    edition_id: editionId,
    status,
    applied_role: appliedRole,
    cv_url: cvUrl,
    answers,
    created_at: createdAt,
    updated_at: updatedAt,
    form_id: formId,
    program,
    edition: editionId ? edition : null,
    applicant_profile: applicantProfile,
  }

  return { applicationRow, debugInfo: null }
}
