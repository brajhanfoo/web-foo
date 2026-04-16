export type PaymentStatus =
  | 'initiated'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'canceled'

export type PaymentPurpose = 'pre_enrollment' | 'tuition'

export type PaymentProvider = 'payphone' | 'mercado_pago'
