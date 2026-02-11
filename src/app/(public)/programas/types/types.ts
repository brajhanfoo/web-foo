//src/app/(public)/programas/types/page.ts

import type {
  EditionRow,
  ProgramPaymentMode,
  ProgramRow,
  ProgramStatus,
} from '@/types/programs'

export type { ApplicationFormRow } from '@/types/program-editions'
export type { EditionRow, ProgramPaymentMode, ProgramRow, ProgramStatus }


export type ProgramAccent = 'academy' | 'projects' | 'default'

export type ProgramFeature = {
  id: string
  text: string
  enabled: boolean
}

export type ProgramCardContent = {
  pillLabel: string
  modalityLabel: string
  ctaLabel: string
  features: ProgramFeature[]
  accent: ProgramAccent
  badgeIcon: 'award' | 'folder'
}

export type ProgramCardVM = {
  program: ProgramRow
  edition: EditionRow | null
  status: ProgramStatus
  content: ProgramCardContent
}
