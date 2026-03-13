import 'server-only'

import crypto from 'node:crypto'

import { getSiteUrl } from '@/lib/site-url'
import type { PaymentStatus } from '@/types/payments'

export type MercadoPagoWebhookTopic = 'payment' | 'merchant_order' | 'unknown'
export type MercadoPagoEnv = 'test' | 'production'
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

export type MercadoPagoSignatureParts = {
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
  checkedDataIds: string[]
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

function normalizeSecretValue(value: string | undefined): string {
  return (value ?? '').trim()
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
    return firstNonEmptySecretWithSource([
      {
        name: 'MERCADOPAGO_WEBHOOK_SECRET_PROD',
        value: process.env.MERCADOPAGO_WEBHOOK_SECRET_PROD,
      },
      {
        name: 'MERCADOPAGO_WEBHOOK_SECRET',
        value: process.env.MERCADOPAGO_WEBHOOK_SECRET,
      },
    ]).value
  }

  return normalizeSecretValue(process.env.MERCADOPAGO_WEBHOOK_SECRET_TEST)
}

export function getMercadoPagoWebhookSecretSource(): string | null {
  if (isProductionMercadoPagoEnv()) {
    return firstNonEmptySecretWithSource([
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

  return normalizeSecretValue(process.env.MERCADOPAGO_WEBHOOK_SECRET_TEST)
    ? 'MERCADOPAGO_WEBHOOK_SECRET_TEST'
    : null
}

export function getMercadoPagoWebhookSecretsForValidation(): MercadoPagoNamedSecret[] {
  if (isProductionMercadoPagoEnv()) {
    return nonEmptyNamedSecrets([
      {
        name: 'MERCADOPAGO_WEBHOOK_SECRET_PROD',
        value: process.env.MERCADOPAGO_WEBHOOK_SECRET_PROD,
      },
      {
        name: 'MERCADOPAGO_WEBHOOK_SECRET_TEST',
        value: process.env.MERCADOPAGO_WEBHOOK_SECRET_TEST,
      },
      {
        name: 'MERCADOPAGO_WEBHOOK_SECRET',
        value: process.env.MERCADOPAGO_WEBHOOK_SECRET,
      },
    ])
  }

  const testSecret = normalizeSecretValue(
    process.env.MERCADOPAGO_WEBHOOK_SECRET_TEST
  )
  if (!testSecret) return []

  return [
    {
      source: 'MERCADOPAGO_WEBHOOK_SECRET_TEST',
      value: testSecret,
    },
  ]
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
  webhookSecretLength: number
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

function buildManifestFromOrder(params: {
  id: string
  requestId: string | null
  ts: string | null
  order: Array<'id' | 'request-id' | 'ts'>
  trailingSemicolon: boolean
}): string {
  const id = normalizeEnv(params.id)
  const requestId = normalizeEnv(params.requestId)
  const ts = normalizeEnv(params.ts)
  if (!id) return ''

  const valueByKey: Record<'id' | 'request-id' | 'ts', string | null> = {
    id,
    'request-id': requestId || null,
    ts: ts || null,
  }

  const pairs: string[] = []
  for (const key of params.order) {
    const value = valueByKey[key]
    if (!value) continue
    pairs.push(`${key}:${value}`)
  }

  if (pairs.length === 0) return ''
  const joined = pairs.join(';')
  return params.trailingSemicolon ? `${joined};` : joined
}

function permutations2(
  a: 'id' | 'request-id' | 'ts',
  b: 'id' | 'request-id' | 'ts'
): Array<Array<'id' | 'request-id' | 'ts'>> {
  return [
    [a, b],
    [b, a],
  ]
}

function permutations3(
  a: 'id' | 'request-id' | 'ts',
  b: 'id' | 'request-id' | 'ts',
  c: 'id' | 'request-id' | 'ts'
): Array<Array<'id' | 'request-id' | 'ts'>> {
  return [
    [a, b, c],
    [a, c, b],
    [b, a, c],
    [b, c, a],
    [c, a, b],
    [c, b, a],
  ]
}

function buildManifestCandidates(params: {
  dataIds: string[]
  requestId: string | null
  ts: string | null
}): {
  checkedDataIds: string[]
  checkedManifests: string[]
} {
  const requestId = normalizeEnv(params.requestId)
  const ts = normalizeEnv(params.ts)
  const checkedDataIds: string[] = []
  const candidates = new Set<string>()

  const normalizedDataIds = new Set<string>()
  for (const dataId of params.dataIds) {
    const raw = normalizeEnv(dataId)
    const normalized = normalizeIdForSignature(dataId)
    if (raw) normalizedDataIds.add(raw)
    if (normalized) normalizedDataIds.add(normalized)
  }

  for (const dataId of normalizedDataIds) {
    checkedDataIds.push(dataId)
    const fullOrders =
      requestId && ts
        ? permutations3('id', 'request-id', 'ts')
        : requestId
          ? permutations2('id', 'request-id')
          : ts
            ? permutations2('id', 'ts')
            : ([['id']] as Array<Array<'id' | 'request-id' | 'ts'>>)

    for (const order of fullOrders) {
      const withTrailing = buildManifestFromOrder({
        id: dataId,
        requestId: requestId || null,
        ts: ts || null,
        order,
        trailingSemicolon: true,
      })
      if (withTrailing) candidates.add(withTrailing)

      const withoutTrailing = buildManifestFromOrder({
        id: dataId,
        requestId: requestId || null,
        ts: ts || null,
        order,
        trailingSemicolon: false,
      })
      if (withoutTrailing) candidates.add(withoutTrailing)
    }

    if (ts) {
      for (const order of permutations2('id', 'ts')) {
        const manifest = buildManifestFromOrder({
          id: dataId,
          requestId: null,
          ts,
          order,
          trailingSemicolon: true,
        })
        if (manifest) candidates.add(manifest)
      }
    }

    if (requestId) {
      for (const order of permutations2('id', 'request-id')) {
        const manifest = buildManifestFromOrder({
          id: dataId,
          requestId,
          ts: null,
          order,
          trailingSemicolon: true,
        })
        if (manifest) candidates.add(manifest)
      }
    }

    const idOnly = buildManifestFromOrder({
      id: dataId,
      requestId: null,
      ts: null,
      order: ['id'],
      trailingSemicolon: true,
    })
    if (idOnly) candidates.add(idOnly)
  }

  return {
    checkedDataIds,
    checkedManifests: [...candidates],
  }
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
  alternativeDataIds?: Array<string | null | undefined>
  secret: string
}): SignatureValidation {
  const signature = parseMercadoPagoSignatureHeader(params.signatureHeader)
  const requestId = normalizeEnv(params.requestIdHeader)
  const allIds = [params.dataId, ...(params.alternativeDataIds ?? [])].filter(
    (id): id is string => Boolean(normalizeEnv(id))
  )
  const manifestData = buildManifestCandidates({
    dataIds: allIds,
    requestId: requestId || null,
    ts: signature.ts,
  })
  const checkedManifests = manifestData.checkedManifests
  const checkedDataIds = manifestData.checkedDataIds
  const manifest = checkedManifests[0] ?? ''

  if (!params.secret) {
    return {
      signatureValid: false,
      ts: signature.ts,
      v1: signature.v1,
      manifest,
      matchedManifest: null,
      checkedManifests,
      checkedDataIds,
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
      checkedDataIds,
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
      checkedDataIds,
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
        checkedDataIds,
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
    checkedDataIds,
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
