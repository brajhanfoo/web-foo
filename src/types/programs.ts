export type ProgramPaymentMode = 'none' | 'pre' | 'post'
export type ProgramPaymentVariant = 'single_payment' | 'installments'

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
  price_usd_list: number | string | null
  price_usd_discount_percent: number | string | null
  price_usd_final_single: number | string | null
  price_usd_has_installments: boolean | null
  price_usd_final_installments: number | string | null
  price_usd_installments_count: number | string | null
  price_usd_installments_interest_free: boolean | null
  price_usd_installment_amount: number | string | null
  price_ars_list: number | string | null
  price_ars_discount_percent: number | string | null
  price_ars_final_single: number | string | null
  price_ars_has_installments: boolean | null
  price_ars_final_installments: number | string | null
  price_ars_installments_count: number | string | null
  price_ars_installments_interest_free: boolean | null
  price_ars_installment_amount: number | string | null
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
