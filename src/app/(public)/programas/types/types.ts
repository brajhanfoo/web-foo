//src/app/(public)/programas/types/page.ts

export type ProgramRow = {
  id: string
  slug: string
  title: string
  description: string | null
  is_published: boolean
  payment_mode: ProgramPaymentMode | null
  requires_payment_pre: boolean
  price_usd: number | null
  created_at: string
  updated_at: string
}

export type ProgramPaymentMode = 'none' | 'pre' | 'post'

export type EditionRow = {
  id: string
  program_id: string
  edition_name: string
  starts_at: string | null // date (YYYY-MM-DD) en Supabase suele venir string
  ends_at: string | null
  is_open: boolean
  created_at: string
  updated_at: string
}

export type ProgramStatus = 'open' | 'closed' | 'soon'

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
