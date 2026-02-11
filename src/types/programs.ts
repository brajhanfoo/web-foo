export type ProgramPaymentMode = 'none' | 'pre' | 'post'

export type ProgramStatus = 'open' | 'closed' | 'soon'

export type ProgramRowBase = {
  id: string
  slug: string
  title: string
  description: string | null
}

export type ProgramRow = ProgramRowBase & {
  is_published: boolean
  payment_mode: ProgramPaymentMode | null
  requires_payment_pre: boolean
  price_usd: number | string | null
  created_at?: string
  updated_at?: string
}

export type EditionRowBase = {
  id: string
  program_id: string
  is_open: boolean
  created_at?: string
}

export type EditionRow = EditionRowBase & {
  edition_name: string
  starts_at: string | null
  ends_at: string | null
  updated_at?: string
}
