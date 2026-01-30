// src/app/plataforma/talento/mis-postulaciones/types.ts

export type ApplicationStatus =
  | 'received'
  | 'in_review'
  | 'approved'
  | 'payment_pending'
  | 'enrolled'
  | 'rejected'

export type ProgramRow = {
  id: string
  slug: string
  title: string
  description: string | null
  is_published: boolean
  created_at: string
  updated_at: string
  requires_payment_pre: boolean
  price_usd: string | null
}

export type EditionRow = {
  id: string
  program_id: string
  edition_name: string
  starts_at: string | null // DATE => "YYYY-MM-DD"
  ends_at: string | null // DATE => "YYYY-MM-DD"
  is_open: boolean
  created_at: string
  updated_at: string
}

export type ApplicationRow = {
  id: string
  applicant_profile_id: string
  program_id: string
  edition_id: string | null
  status: ApplicationStatus
  applied_role: string | null
  created_at: string
  updated_at: string
  program: ProgramRow | null
  edition: EditionRow | null
}

export type ViewState =
  | { kind: 'loading' }
  | { kind: 'signed_out' }
  | { kind: 'empty' }
  | { kind: 'ready'; current: ApplicationRow; past: ApplicationRow[] }

export type PastCompletedItem = {
  id: string
  programTitle: string
  editionLabel: string
  finishedLabel: string
}
