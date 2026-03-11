import 'server-only'

import crypto from 'node:crypto'
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'

import { getSiteUrl } from '@/lib/site-url'
import type { PaymentStatus } from '@/types/payments'

type SignatureParts = {
  ts: string | null
  v1: string | null
}

type SignatureValidation = {
  signatureValid: boolean
  ts: string | null
  v1: string | null
  manifest: string
}

function normalizeEnv(value: string | null | undefined): string {
  return (value ?? '').trim()
}

function isProductionMercadoPagoEnv(): boolean {
  const explicit = normalizeEnv(process.env.MERCADOPAGO_ENV).toLowerCase()
  if (explicit === 'production' || explicit === 'prod') return true
  if (explicit === 'test' || explicit === 'sandbox') return false
  return process.env.NODE_ENV === 'production'
}

function firstNonEmpty(values: Array<string | undefined>): string {
  for (const value of values) {
    const normalized = normalizeEnv(value)
    if (normalized) return normalized
  }
  return ''
}

export function getMercadoPagoAccessToken(): string {
  if (isProductionMercadoPagoEnv()) {
    return firstNonEmpty([
      process.env.MERCADOPAGO_ACCESS_TOKEN_PROD,
      process.env.MERCADOPAGO_ACCESS_TOKEN,
    ])
  }

  return firstNonEmpty([
    process.env.MERCADOPAGO_ACCESS_TOKEN_TEST,
    process.env.MERCADOPAGO_ACCESS_TOKEN,
  ])
}

export function getMercadoPagoPublicKey(): string {
  if (isProductionMercadoPagoEnv()) {
    return firstNonEmpty([
      process.env.MERCADOPAGO_PUBLIC_KEY_PROD,
      process.env.MERCADOPAGO_PUBLIC_KEY,
    ])
  }

  return firstNonEmpty([
    process.env.MERCADOPAGO_PUBLIC_KEY_TEST,
    process.env.MERCADOPAGO_PUBLIC_KEY,
  ])
}

export function getMercadoPagoWebhookSecret(): string {
  if (isProductionMercadoPagoEnv()) {
    return firstNonEmpty([
      process.env.MERCADOPAGO_WEBHOOK_SECRET_PROD,
      process.env.MERCADOPAGO_WEBHOOK_SECRET,
    ])
  }

  return firstNonEmpty([
    process.env.MERCADOPAGO_WEBHOOK_SECRET_TEST,
    process.env.MERCADOPAGO_WEBHOOK_SECRET,
  ])
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

export function getMercadoPagoBaseUrl(): string {
  const explicitBaseUrl = isProductionMercadoPagoEnv()
    ? firstNonEmpty([
        process.env.MERCADOPAGO_BASE_URL_PROD,
        process.env.MERCADOPAGO_BASE_URL,
      ])
    : firstNonEmpty([
        process.env.MERCADOPAGO_BASE_URL_TEST,
        process.env.MERCADOPAGO_BASE_URL,
      ])

  if (explicitBaseUrl) return normalizeBaseUrl(explicitBaseUrl)

  const siteUrl = normalizeEnv(getSiteUrl())
  return siteUrl ? normalizeBaseUrl(siteUrl) : ''
}

export function createMercadoPagoConfig(): MercadoPagoConfig {
  const accessToken = getMercadoPagoAccessToken()
  if (!accessToken) {
    throw new Error('Falta configurar el access token de Mercado Pago.')
  }

  return new MercadoPagoConfig({ accessToken })
}

export function createMercadoPagoPreferenceClient(): Preference {
  return new Preference(createMercadoPagoConfig())
}

export function createMercadoPagoPaymentClient(): Payment {
  return new Payment(createMercadoPagoConfig())
}

export function mapMercadoPagoStatusToPaymentStatus(
  mercadoPagoStatus: string | null | undefined
): PaymentStatus {
  const normalized = normalizeEnv(mercadoPagoStatus).toLowerCase()

  if (normalized === 'approved') return 'paid'
  if (normalized === 'pending' || normalized === 'in_process') return 'pending'
  if (normalized === 'rejected') return 'failed'
  if (
    normalized === 'cancelled' ||
    normalized === 'canceled' ||
    normalized === 'expired'
  ) {
    return 'canceled'
  }

  return 'pending'
}

export function buildMercadoPagoUrls(): {
  success: string
  failure: string
  pending: string
  notification: string
} | null {
  const baseUrl = normalizeEnv(getMercadoPagoBaseUrl())
  if (!baseUrl) return null

  return {
    success: `${baseUrl}/mercadopago/success`,
    failure: `${baseUrl}/mercadopago/failure`,
    pending: `${baseUrl}/mercadopago/pending`,
    notification: `${baseUrl}/api/mercadopago/webhook`,
  }
}

function parseMercadoPagoSignatureHeader(value: string | null): SignatureParts {
  if (!value) return { ts: null, v1: null }

  const entries = value.split(',')
  let ts: string | null = null
  let v1: string | null = null

  for (const rawEntry of entries) {
    const [rawKey, rawVal] = rawEntry.split('=')
    const key = normalizeEnv(rawKey).toLowerCase()
    const parsedValue = normalizeEnv(rawVal)
    if (!key || !parsedValue) continue

    if (key === 'ts') ts = parsedValue
    if (key === 'v1') v1 = parsedValue
  }

  return { ts, v1 }
}

function buildManifest(params: {
  dataId: string | null
  requestId: string | null
  ts: string | null
}): string {
  const segments: string[] = []

  if (params.dataId) segments.push(`id:${params.dataId};`)
  if (params.requestId) segments.push(`request-id:${params.requestId};`)
  if (params.ts) segments.push(`ts:${params.ts};`)

  return segments.join('')
}

function safeHexEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'hex')
  const rightBuffer = Buffer.from(right, 'hex')
  if (leftBuffer.length === 0 || rightBuffer.length === 0) return false
  if (leftBuffer.length !== rightBuffer.length) return false
  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

export function validateMercadoPagoSignature(params: {
  signatureHeader: string | null
  requestIdHeader: string | null
  dataId: string | null
  secret: string
}): SignatureValidation {
  const signature = parseMercadoPagoSignatureHeader(params.signatureHeader)
  const requestId = normalizeEnv(params.requestIdHeader)
  const manifest = buildManifest({
    dataId: params.dataId,
    requestId: requestId || null,
    ts: signature.ts,
  })

  if (!params.secret || !signature.v1 || !manifest) {
    return {
      signatureValid: false,
      ts: signature.ts,
      v1: signature.v1,
      manifest,
    }
  }

  const hmac = crypto
    .createHmac('sha256', params.secret)
    .update(manifest)
    .digest('hex')

  return {
    signatureValid: safeHexEquals(hmac, signature.v1),
    ts: signature.ts,
    v1: signature.v1,
    manifest,
  }
}

export function resolveMercadoPagoDataId(
  requestUrl: URL,
  payload: unknown
): string | null {
  const fromQuery = normalizeEnv(requestUrl.searchParams.get('data.id') ?? '')
  if (fromQuery) return fromQuery

  if (!payload || typeof payload !== 'object') return null
  const candidate = payload as Record<string, unknown>
  const dataCandidate = candidate['data']
  if (!dataCandidate || typeof dataCandidate !== 'object') return null

  const id = (dataCandidate as Record<string, unknown>)['id']
  if (typeof id === 'number' && Number.isFinite(id)) return String(id)
  if (typeof id === 'string') {
    const normalized = id.trim()
    return normalized || null
  }

  return null
}
