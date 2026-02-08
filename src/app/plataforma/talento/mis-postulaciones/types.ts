// src/app/plataforma/talento/mis-postulaciones/types.ts

export type ApplicationStatus =
  | 'received'
  | 'in_review'
  | 'approved'
  | 'admitted'
  | 'payment_pending'
  | 'enrolled'
  | 'rejected'

export type PaymentStatus =
  | 'initiated'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'canceled'

export type ProgramPaymentMode = 'none' | 'pre' | 'post'

export type ProgramRow = {
  id: string
  slug: string
  title: string
  description: string | null
  is_published: boolean
  created_at: string
  updated_at: string
  payment_mode: ProgramPaymentMode | null
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
  payment_status: PaymentStatus
  paid_at: string | null
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
  | { kind: 'ready'; active: ApplicationRow[]; past: ApplicationRow[] }

export type PastCompletedItem = {
  id: string
  programTitle: string
  editionLabel: string
  finishedLabel: string
}

