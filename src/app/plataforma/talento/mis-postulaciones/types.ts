// src/app/plataforma/talento/mis-postulaciones/types.ts

import type {
  EditionRow,
  ProgramPaymentMode,
  ProgramRow,
} from '@/types/programs'
import type { PaymentStatus } from '@/types/payments'

export type ApplicationStatus =
  | 'received'
  | 'in_review'
  | 'approved'
  | 'admitted'
  | 'payment_pending'
  | 'enrolled'
  | 'rejected'

export type { PaymentStatus }

export type { EditionRow, ProgramPaymentMode, ProgramRow }

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
