/* ----------------------------- Types (strict) ----------------------------- */

export type ApplicationStatus =
  | 'received'
  | 'in_review'
  | 'payment_pending'
  | 'enrolled'
  | 'rejected'

export type ProgramSummary = {
  id: string
  title: string | null
  slug: string | null
}

export type EditionSummary = {
  id: string
  edition_name: string | null
}

export type ApplicantProfileSummary = {
  id: string
  first_name: string | null
  last_name: string | null
  country_residence: string | null
  whatsapp_e164: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  english_level: string | null
  role: string | null
email: string | null
  // Extras que estás trayendo en el select
  document_number: string | null
  primary_role: string | null
  profile_status: string | null
  skills: string[] | null
}

export type ParsedAnswers = Record<string, unknown>

export type ApplicationBase = {
  id: string
  applicant_profile_id: string
  program_id: string
  edition_id: string | null
  status: ApplicationStatus
  applied_role: string | null
  cv_url: string | null
  answers: ParsedAnswers
  created_at: string
  updated_at: string
  form_id: string | null
}

export type ApplicationRow = ApplicationBase & {
  program?: ProgramSummary | null
  edition?: EditionSummary | null
  applicant_profile?: ApplicantProfileSummary | null
}

export type StatusStep = {
  index: number
  key: 'received' | 'admitted' | 'payment_pending' | 'enrolled'
  label: string
}

export const STATUS_STEPS: StatusStep[] = [
  { index: 1, key: 'received', label: 'Recibido' },
  { index: 2, key: 'admitted', label: 'Admitido' },
  { index: 3, key: 'payment_pending', label: 'Pago pendiente' },
  { index: 4, key: 'enrolled', label: 'Matriculado' },
]
