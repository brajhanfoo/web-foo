import 'server-only'

import crypto from 'node:crypto'

import { getSiteUrl } from '@/lib/site-url'
import type { PaymentStatus } from '@/types/payments'

export type MercadoPagoWebhookTopic = 'payment' | 'merchant_order' | 'unknown'
export type MercadoPagoEnv = 'test' | 'production'
export type MercadoPagoConfig = {
  accessToken: string
}
export type MercadoPagoPreferenceClient = {
  create(input: { body: unknown }): Promise<Record<string, unknown>>
}
export type MercadoPagoPaymentClient = {
  get(input: { id: string }): Promise<Record<string, unknown>>
}

const MERCADO_PAGO_API_BASE_URL = 'https://api.mercadopago.com'

type SignatureParts = {
  ts: string | null
  v1: string | null
}

type SignatureValidation = {
  signatureValid: boolean
  ts: string | null
  v1: string | null
  manifest: string
  matchedManifest: string | null
  checkedManifests: string[]
  reason:
    | 'ok'
    | 'missing_secret'
    | 'missing_signature'
    | 'missing_manifest'
    | 'signature_mismatch'
}

function normalizeEnv(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function resolveMercadoPagoEnv(): MercadoPagoEnv {
  const explicit = normalizeEnv(process.env.MERCADOPAGO_ENV).toLowerCase()
  if (explicit === 'test' || explicit === 'sandbox') return 'test'
  if (explicit === 'production' || explicit === 'prod') return 'production'

  throw new Error("MERCADOPAGO_ENV debe ser 'test' o 'production'.")
}

function isProductionMercadoPagoEnv(): boolean {
  return resolveMercadoPagoEnv() === 'production'
}

function firstNonEmpty(values: Array<string | undefined>): string {
  for (const value of values) {
    const normalized = normalizeEnv(value)
    if (normalized) return normalized
  }
  return ''
}

function firstNonEmptyWithSource(
  values: Array<{ name: string; value: string | undefined }>
): {
  value: string
  source: string | null
} {
  for (const entry of values) {
    const normalized = normalizeEnv(entry.value)
    if (normalized) {
      return {
        value: normalized,
        source: entry.name,
      }
    }
  }

  return {
    value: '',
    source: null,
  }
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

export function getMercadoPagoWebhookSecretSource(): string | null {
  if (isProductionMercadoPagoEnv()) {
    return firstNonEmptyWithSource([
      {
        name: 'MERCADOPAGO_WEBHOOK_SECRET_PROD',
        value: process.env.MERCADOPAGO_WEBHOOK_SECRET_PROD,
      },
      {
        name: 'MERCADOPAGO_WEBHOOK_SECRET',
        value: process.env.MERCADOPAGO_WEBHOOK_SECRET,
      },
    ]).source
  }

  return firstNonEmptyWithSource([
    {
      name: 'MERCADOPAGO_WEBHOOK_SECRET_TEST',
      value: process.env.MERCADOPAGO_WEBHOOK_SECRET_TEST,
    },
    {
      name: 'MERCADOPAGO_WEBHOOK_SECRET',
      value: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    },
  ]).source
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

export function getMercadoPagoRuntimeDebugInfo(): {
  env: MercadoPagoEnv
  hasAccessToken: boolean
  hasPublicKey: boolean
  hasWebhookSecret: boolean
  webhookSecretSource: string | null
  baseUrl: string
} {
  const env = resolveMercadoPagoEnv()
  const accessToken = getMercadoPagoAccessToken()
  const publicKey = getMercadoPagoPublicKey()
  const webhookSecret = getMercadoPagoWebhookSecret()
  const webhookSecretSource = getMercadoPagoWebhookSecretSource()
  const baseUrl = getMercadoPagoBaseUrl()

  return {
    env,
    hasAccessToken: Boolean(accessToken),
    hasPublicKey: Boolean(publicKey),
    hasWebhookSecret: Boolean(webhookSecret),
    webhookSecretSource,
    baseUrl,
  }
}

export function createMercadoPagoConfig(): MercadoPagoConfig {
  const accessToken = getMercadoPagoAccessToken()
  if (!accessToken) {
    throw new Error('Falta configurar el access token de Mercado Pago.')
  }

  return { accessToken }
}

function resolveMercadoPagoApiErrorMessage(params: {
  status: number
  statusText: string
  payload: unknown
}): string {
  if (isRecord(params.payload)) {
    const apiMessage =
      normalizeEnv(String(params.payload['message'] ?? '')) ||
      normalizeEnv(String(params.payload['error_message'] ?? '')) ||
      normalizeEnv(String(params.payload['error'] ?? ''))
    if (apiMessage) return apiMessage

    const cause = params.payload['cause']
    if (Array.isArray(cause) && cause.length > 0) {
      const first = cause[0]
      if (isRecord(first)) {
        const description = normalizeEnv(String(first['description'] ?? ''))
        if (description) return description
      }
    }
  }

  return `Mercado Pago API error (${params.status} ${params.statusText || 'unknown'}).`
}

async function mercadoPagoApiRequest(params: {
  path: string
  method: 'GET' | 'POST'
  body?: unknown
}): Promise<Record<string, unknown>> {
  const { accessToken } = createMercadoPagoConfig()
  const url = `${MERCADO_PAGO_API_BASE_URL}${params.path}`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  }

  const requestInit: RequestInit = {
    method: params.method,
    headers,
    cache: 'no-store',
  }

  if (params.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    requestInit.body = JSON.stringify(params.body)
  }

  const response = await fetch(url, requestInit)
  const rawText = await response.text()

  let payload: unknown = {}
  if (rawText) {
    try {
      payload = JSON.parse(rawText) as unknown
    } catch {
      payload = { raw: rawText }
    }
  }

  if (!response.ok) {
    throw new Error(
      resolveMercadoPagoApiErrorMessage({
        status: response.status,
        statusText: response.statusText,
        payload,
      })
    )
  }

  return isRecord(payload) ? payload : {}
}

export function createMercadoPagoPreferenceClient(): MercadoPagoPreferenceClient {
  return {
    create: async (input: { body: unknown }) =>
      mercadoPagoApiRequest({
        path: '/checkout/preferences',
        method: 'POST',
        body: input.body,
      }),
  }
}

export function createMercadoPagoPaymentClient(): MercadoPagoPaymentClient {
  return {
    get: async (input: { id: string }) => {
      const paymentId = normalizeEnv(input.id)
      if (!paymentId) {
        throw new Error('Falta id de pago de Mercado Pago.')
      }

      return mercadoPagoApiRequest({
        path: `/v1/payments/${encodeURIComponent(paymentId)}`,
        method: 'GET',
      })
    },
  }
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
    notification: `${baseUrl}/api/mercadopago/webhook?source_news=webhooks`,
  }
}

function parseMercadoPagoSignatureHeader(value: string | null): SignatureParts {
  if (!value) return { ts: null, v1: null }

  const entries = value.split(',')
  let ts: string | null = null
  let v1: string | null = null

  for (const rawEntry of entries) {
    const [rawKey, rawVal] = rawEntry.split('=', 2)
    const key = normalizeEnv(rawKey).toLowerCase()
    const parsedValue = normalizeEnv(rawVal)
    if (!key || !parsedValue) continue

    if (key === 'ts') ts = parsedValue
    if (key === 'v1') v1 = parsedValue
  }

  return { ts, v1 }
}

function normalizeIdForSignature(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return /[A-Z]/.test(trimmed) ? trimmed.toLowerCase() : trimmed
}

function buildManifest(params: {
  dataId: string | null
  requestId: string | null
  ts: string | null
}): string {
  const segments: string[] = []
  const normalizedDataId = normalizeIdForSignature(params.dataId)
  const normalizedRequestId = normalizeEnv(params.requestId)
  const normalizedTs = normalizeEnv(params.ts)

  if (normalizedDataId) segments.push(`id:${normalizedDataId};`)
  if (normalizedRequestId) segments.push(`request-id:${normalizedRequestId};`)
  if (normalizedTs) segments.push(`ts:${normalizedTs};`)

  return segments.join('')
}

function buildManifestCandidates(params: {
  dataId: string | null
  requestId: string | null
  ts: string | null
}): string[] {
  const rawDataId = normalizeEnv(params.dataId)
  const normalizedDataId = normalizeIdForSignature(params.dataId)
  const requestId = normalizeEnv(params.requestId)
  const ts = normalizeEnv(params.ts)

  const byId = [normalizedDataId, rawDataId].filter((id): id is string =>
    Boolean(id)
  )

  const candidates = new Set<string>()
  for (const id of byId) {
    const full = buildManifest({
      dataId: id,
      requestId: requestId || null,
      ts: ts || null,
    })
    if (full) candidates.add(full)

    const withoutRequestId = buildManifest({
      dataId: id,
      requestId: null,
      ts: ts || null,
    })
    if (withoutRequestId) candidates.add(withoutRequestId)

    const withoutTs = buildManifest({
      dataId: id,
      requestId: requestId || null,
      ts: null,
    })
    if (withoutTs) candidates.add(withoutTs)
  }

  return [...candidates]
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
  const checkedManifests = buildManifestCandidates({
    dataId: params.dataId,
    requestId: requestId || null,
    ts: signature.ts,
  })

  if (!params.secret) {
    return {
      signatureValid: false,
      ts: signature.ts,
      v1: signature.v1,
      manifest,
      matchedManifest: null,
      checkedManifests,
      reason: 'missing_secret',
    }
  }

  if (!signature.v1) {
    return {
      signatureValid: false,
      ts: signature.ts,
      v1: signature.v1,
      manifest,
      matchedManifest: null,
      checkedManifests,
      reason: 'missing_signature',
    }
  }

  if (checkedManifests.length === 0) {
    return {
      signatureValid: false,
      ts: signature.ts,
      v1: signature.v1,
      manifest,
      matchedManifest: null,
      checkedManifests,
      reason: 'missing_manifest',
    }
  }

  for (const candidateManifest of checkedManifests) {
    const hmac = crypto
      .createHmac('sha256', params.secret)
      .update(candidateManifest)
      .digest('hex')

    if (safeHexEquals(hmac, signature.v1)) {
      return {
        signatureValid: true,
        ts: signature.ts,
        v1: signature.v1,
        manifest: candidateManifest,
        matchedManifest: candidateManifest,
        checkedManifests,
        reason: 'ok',
      }
    }
  }

  return {
    signatureValid: false,
    ts: signature.ts,
    v1: signature.v1,
    manifest,
    matchedManifest: null,
    checkedManifests,
    reason: 'signature_mismatch',
  }
}

function extractResourceId(resource: string): string | null {
  const trimmed = resource.trim()
  if (!trimmed) return null
  if (/^\d+$/.test(trimmed)) return trimmed

  try {
    const parsed = new URL(trimmed)
    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parts.length === 0) return null
    const last = parts[parts.length - 1] ?? ''
    if (/^\d+$/.test(last)) return last
  } catch {
    return null
  }

  return null
}

function resolveBodyTopic(payload: Record<string, unknown>): string {
  const explicitType = normalizeEnv(
    typeof payload['type'] === 'string' ? payload['type'] : ''
  )
    .toLowerCase()
    .trim()
  if (explicitType) return explicitType

  return normalizeEnv(
    typeof payload['topic'] === 'string' ? payload['topic'] : ''
  )
    .toLowerCase()
    .trim()
}

export function resolveMercadoPagoDataId(
  requestUrl: URL,
  payload: unknown
): string | null {
  const fromDataIdQuery = normalizeEnv(requestUrl.searchParams.get('data.id'))
  if (fromDataIdQuery) return fromDataIdQuery

  const queryTopic = normalizeEnv(requestUrl.searchParams.get('topic'))
    .toLowerCase()
    .trim()
  const queryType = normalizeEnv(requestUrl.searchParams.get('type'))
    .toLowerCase()
    .trim()
  const fromLegacyIdQuery = normalizeEnv(requestUrl.searchParams.get('id'))
  if (
    fromLegacyIdQuery &&
    (queryTopic === 'payment' || queryType === 'payment')
  ) {
    return fromLegacyIdQuery
  }

  if (!payload || typeof payload !== 'object') return null
  const candidate = payload as Record<string, unknown>

  const bodyType = resolveBodyTopic(candidate)
  if (bodyType === 'payment' && fromLegacyIdQuery) return fromLegacyIdQuery

  const dataCandidate = candidate['data']
  if (dataCandidate && typeof dataCandidate === 'object') {
    const id = (dataCandidate as Record<string, unknown>)['id']
    if (typeof id === 'number' && Number.isFinite(id)) return String(id)
    if (typeof id === 'string') {
      const normalized = id.trim()
      if (normalized) return normalized
    }
  }

  const resource = candidate['resource']
  if (typeof resource === 'string' && bodyType === 'payment') {
    return extractResourceId(resource)
  }

  return null
}

export function resolveMercadoPagoWebhookTopic(
  requestUrl: URL,
  payload: unknown
): MercadoPagoWebhookTopic {
  const queryTopic = normalizeEnv(requestUrl.searchParams.get('topic'))
    .toLowerCase()
    .trim()
  if (queryTopic === 'payment') return 'payment'
  if (queryTopic === 'merchant_order') return 'merchant_order'

  const queryType = normalizeEnv(requestUrl.searchParams.get('type'))
    .toLowerCase()
    .trim()
  if (queryType === 'payment') return 'payment'
  if (queryType === 'merchant_order') return 'merchant_order'

  if (payload && typeof payload === 'object') {
    const candidate = payload as Record<string, unknown>
    const bodyType = resolveBodyTopic(candidate)
    if (bodyType === 'payment') return 'payment'
    if (bodyType === 'merchant_order') return 'merchant_order'

    const action = normalizeEnv(
      typeof candidate['action'] === 'string' ? candidate['action'] : ''
    )
      .toLowerCase()
      .trim()
    if (action.startsWith('payment.')) return 'payment'
    if (action.startsWith('merchant_order.')) return 'merchant_order'
  }

  return 'unknown'
}
