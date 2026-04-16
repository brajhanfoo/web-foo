import 'server-only'

import crypto from 'node:crypto'

import { getSiteUrl } from '@/lib/site-url'
import type { PaymentStatus } from '@/types/payments'

export type MercadoPagoWebhookTopic = 'payment' | 'merchant_order' | 'unknown'
export type MercadoPagoCanonicalStatus =
  | 'approved'
  | 'pending'
  | 'in_process'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back'
  | 'unknown'
export type MercadoPagoNamedSecret = {
  source: string
  value: string
}
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
const MERCADO_PAGO_HTTP_TIMEOUT_MS = 12_000

export type MercadoPagoSignatureParts = {
  ts: string | null
  v1: string | null
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

function firstNonEmpty(values: Array<string | undefined>): string {
  for (const value of values) {
    const normalized = normalizeEnv(value)
    if (normalized) return normalized
  }
  return ''
}

function normalizeSecretValue(value: string | undefined): string {
  return normalizeEnv(value)
}

function firstNonEmptySecretWithSource(
  values: Array<{ name: string; value: string | undefined }>
): {
  value: string
  source: string | null
} {
  for (const entry of values) {
    const normalized = normalizeSecretValue(entry.value)
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

function nonEmptyNamedSecrets(
  values: Array<{ name: string; value: string | undefined }>
): MercadoPagoNamedSecret[] {
  const seen = new Set<string>()
  const out: MercadoPagoNamedSecret[] = []

  for (const entry of values) {
    const normalized = normalizeSecretValue(entry.value)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    out.push({
      source: entry.name,
      value: normalized,
    })
  }

  return out
}

export function getMercadoPagoAccessToken(): string {
  return firstNonEmpty([
    process.env.MERCADOPAGO_ACCESS_TOKEN,
    process.env.MERCADOPAGO_ACCESS_TOKEN_PROD,
  ])
}

export function getMercadoPagoPublicKey(): string {
  return firstNonEmpty([
    process.env.MERCADOPAGO_PUBLIC_KEY,
    process.env.MERCADOPAGO_PUBLIC_KEY_PROD,
  ])
}

export function getMercadoPagoWebhookSecret(): string {
  return firstNonEmptySecretWithSource([
    {
      name: 'MERCADOPAGO_WEBHOOK_SECRET',
      value: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    },
    {
      name: 'MERCADOPAGO_WEBHOOK_SECRET_PROD',
      value: process.env.MERCADOPAGO_WEBHOOK_SECRET_PROD,
    },
  ]).value
}

export function getMercadoPagoWebhookSecretSource(): string | null {
  return firstNonEmptySecretWithSource([
    {
      name: 'MERCADOPAGO_WEBHOOK_SECRET',
      value: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    },
    {
      name: 'MERCADOPAGO_WEBHOOK_SECRET_PROD',
      value: process.env.MERCADOPAGO_WEBHOOK_SECRET_PROD,
    },
  ]).source
}

export function getMercadoPagoWebhookSecretsForValidation(): MercadoPagoNamedSecret[] {
  return nonEmptyNamedSecrets([
    {
      name: 'MERCADOPAGO_WEBHOOK_SECRET',
      value: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    },
    {
      name: 'MERCADOPAGO_WEBHOOK_SECRET_PROD',
      value: process.env.MERCADOPAGO_WEBHOOK_SECRET_PROD,
    },
  ])
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

export function getMercadoPagoBaseUrl(): string {
  const explicitBaseUrl = firstNonEmpty([
    process.env.MERCADOPAGO_BASE_URL,
    process.env.MERCADOPAGO_BASE_URL_PROD,
  ])

  if (explicitBaseUrl) return normalizeBaseUrl(explicitBaseUrl)

  const siteUrl = normalizeEnv(getSiteUrl())
  return siteUrl ? normalizeBaseUrl(siteUrl) : ''
}

export function getMercadoPagoRuntimeDebugInfo(): {
  hasAccessToken: boolean
  hasPublicKey: boolean
  hasWebhookSecret: boolean
  webhookSecretSource: string | null
  webhookSecretLength: number
  baseUrl: string
} {
  const accessToken = getMercadoPagoAccessToken()
  const publicKey = getMercadoPagoPublicKey()
  const webhookSecret = getMercadoPagoWebhookSecret()
  const webhookSecretSource = getMercadoPagoWebhookSecretSource()
  const baseUrl = getMercadoPagoBaseUrl()

  return {
    hasAccessToken: Boolean(accessToken),
    hasPublicKey: Boolean(publicKey),
    hasWebhookSecret: Boolean(webhookSecret),
    webhookSecretSource,
    webhookSecretLength: webhookSecret.length,
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

  const abortController = new AbortController()
  const timeout = setTimeout(
    () => abortController.abort(),
    MERCADO_PAGO_HTTP_TIMEOUT_MS
  )

  let response: Response
  try {
    response = await fetch(url, {
      ...requestInit,
      signal: abortController.signal,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === 'AbortError' ||
        error.name === 'TimeoutError' ||
        /aborted|timeout/i.test(error.message))
    ) {
      throw new Error(
        `Mercado Pago API timeout (${MERCADO_PAGO_HTTP_TIMEOUT_MS}ms).`
      )
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }

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

export function normalizeMercadoPagoCanonicalStatus(
  mercadoPagoStatus: string | null | undefined
): MercadoPagoCanonicalStatus {
  const normalized = normalizeEnv(mercadoPagoStatus).toLowerCase()

  if (normalized === 'approved') return 'approved'
  if (normalized === 'pending') return 'pending'
  if (normalized === 'in_process') return 'in_process'
  if (normalized === 'rejected') return 'rejected'
  if (normalized === 'refunded' || normalized === 'partially_refunded') {
    return 'refunded'
  }
  if (normalized === 'charged_back') return 'charged_back'
  if (
    normalized === 'cancelled' ||
    normalized === 'canceled' ||
    normalized === 'expired'
  ) {
    return 'cancelled'
  }

  return 'unknown'
}

export function mapMercadoPagoStatusToPaymentStatus(
  mercadoPagoStatus: string | null | undefined
): PaymentStatus {
  const canonicalStatus = normalizeMercadoPagoCanonicalStatus(mercadoPagoStatus)

  if (canonicalStatus === 'approved') return 'paid'
  if (canonicalStatus === 'pending' || canonicalStatus === 'in_process') {
    return 'pending'
  }
  if (canonicalStatus === 'rejected') return 'failed'
  if (
    canonicalStatus === 'cancelled' ||
    canonicalStatus === 'refunded' ||
    canonicalStatus === 'charged_back'
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

export function parseMercadoPagoSignatureHeader(
  value: string | null
): MercadoPagoSignatureParts {
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

export function buildMercadoPagoSignatureManifest(params: {
  dataId: string | null
  requestId: string | null
  ts: string | null
  includeRequestId?: boolean
  trailingSemicolon?: boolean
}): string {
  const dataId = normalizeIdForSignature(params.dataId)
  const requestId = normalizeEnv(params.requestId)
  const ts = normalizeEnv(params.ts)
  const includeRequestId = params.includeRequestId ?? true
  const trailingSemicolon = params.trailingSemicolon ?? true

  if (!dataId || !ts) return ''

  const parts: string[] = [`id:${dataId}`]
  if (includeRequestId && requestId) {
    parts.push(`request-id:${requestId}`)
  }
  parts.push(`ts:${ts}`)

  const manifest = parts.join(';')
  return trailingSemicolon ? `${manifest};` : manifest
}

export function calculateMercadoPagoSignatureHmac(params: {
  secret: string
  manifest: string
}): string {
  if (!params.secret || !params.manifest) return ''
  return crypto
    .createHmac('sha256', params.secret)
    .update(params.manifest)
    .digest('hex')
}

function normalizeIdForSignature(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return /[A-Z]/.test(trimmed) ? trimmed.toLowerCase() : trimmed
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
