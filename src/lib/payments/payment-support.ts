const DEFAULT_PAYMENT_SUPPORT_WHATSAPP = '+51901831491'

type PaymentPurpose = 'pre_enrollment' | 'tuition'

function normalizeProgramTitle(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed || null
}

function normalizeWhatsAppNumber(value: string): string {
  return value.replace(/[^\d]/g, '')
}

function resolvePurposeLabel(purpose: PaymentPurpose | null | undefined): string {
  if (purpose === 'pre_enrollment') return 'pre-inscripcion'
  if (purpose === 'tuition') return 'matricula'
  return 'pago'
}

export function getPaymentSupportWhatsAppNumber(): string {
  const configured = process.env.NEXT_PUBLIC_PAYMENT_SUPPORT_WHATSAPP?.trim()
  return configured || DEFAULT_PAYMENT_SUPPORT_WHATSAPP
}

export function buildPaymentSupportWhatsAppUrl(params: {
  purpose?: PaymentPurpose | null
  programTitle?: string | null
}): string {
  const number = normalizeWhatsAppNumber(getPaymentSupportWhatsAppNumber())
  const purposeLabel = resolvePurposeLabel(params.purpose ?? null)
  const programTitle = normalizeProgramTitle(params.programTitle ?? null)
  const programSegment = programTitle ? ` del programa ${programTitle}` : ''
  const message = `Hola, quisiera consultar otras formas de pago para la ${purposeLabel}${programSegment}.`
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

