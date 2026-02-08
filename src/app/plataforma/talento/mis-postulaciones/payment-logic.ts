// helpers.ts
import type { ApplicationRow } from './types'

export type PaymentWindow = {
  canPay: boolean
  expiresAtIso: string | null
  msRemaining: number | null
}

function parseIsoToMs(iso: string): number | null {
  const d = new Date(iso)
  const t = d.getTime()
  if (Number.isNaN(t)) return null
  return t
}

export function getPaymentWindow(app: ApplicationRow): PaymentWindow {
  // Regla: se puede pagar si status está en approved o payment_pending
  if (app.status !== 'approved' && app.status !== 'admitted' && app.status !== 'payment_pending') {
    return { canPay: false, expiresAtIso: null, msRemaining: null }
  }

  // Base time: ideal -> approved_at (si existe)
  // Fallback temporal: updated_at (cuando pasó a approved)
  const baseMs = parseIsoToMs(app.updated_at)
  if (baseMs === null)
    return { canPay: false, expiresAtIso: null, msRemaining: null }

  const expiresMs = baseMs + 48 * 60 * 60 * 1000
  const nowMs = Date.now()
  const remaining = expiresMs - nowMs

  if (remaining <= 0) {
    return {
      canPay: false,
      expiresAtIso: new Date(expiresMs).toISOString(),
      msRemaining: 0,
    }
  }

  return {
    canPay: true,
    expiresAtIso: new Date(expiresMs).toISOString(),
    msRemaining: remaining,
  }
}

