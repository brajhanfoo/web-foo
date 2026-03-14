import crypto from 'node:crypto'

import { NextRequest, NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  buildMercadoPagoSignatureManifest,
  calculateMercadoPagoSignatureHmac,
  createMercadoPagoPaymentClient,
  getMercadoPagoWebhookSecretsForValidation,
  getMercadoPagoRuntimeDebugInfo,
  parseMercadoPagoSignatureHeader,
  resolveMercadoPagoWebhookTopic,
  mapMercadoPagoStatusToPaymentStatus,
  resolveMercadoPagoDataId,
  type MercadoPagoNamedSecret,
} from '@/lib/payments/mercadopago'
import type { PaymentProvider, PaymentStatus } from '@/types/payments'
import type { ProgramPaymentMode, ProgramRow } from '@/types/programs'

export const runtime = 'nodejs'

const MERCADO_PAGO_PROVIDER: PaymentProvider = 'mercado_pago'

type PaymentPurpose = 'pre_enrollment' | 'tuition'
type KnownPaymentStatus = PaymentStatus

type PaymentRow = {
  id: string
  provider: PaymentProvider
  status: KnownPaymentStatus
  purpose: PaymentPurpose
  application_id: string | null
  program_id: string
  paid_at: string | null
}

type ProgramRowSummary = Pick<
  ProgramRow,
  'id' | 'payment_mode' | 'requires_payment_pre'
>

type PaymentWebhookSignatureValidationReason =
  | 'ok'
  | 'missing_secret'
  | 'missing_signature'
  | 'missing_manifest'
  | 'signature_mismatch'

type PaymentWebhookSignatureVariantCheck = {
  manifestVariantName: string
  manifestVariantValue: string
  calculatedHmacVariant: string
  variantMatch: boolean
}

type PaymentWebhookSignatureValidation = {
  signatureValid: boolean
  reason: PaymentWebhookSignatureValidationReason
  ts: string | null
  v1: string | null
  manifest: string
  matchedManifest: string | null
  checkedManifests: string[]
  checkedDataIds: string[]
  testedSecretSources: string[]
  matchedSecretSource: string | null
  dataIdDetected: string | null
  requestIdDetected: string | null
  requestIdSource: 'x-request-id' | 'missing'
  usedRequestIdFallback: boolean
  officialManifestDataId: string | null
  alternativeIdsTested: string[]
  officialMatch: boolean
  calculatedHmacOfficial: string
  variantChecks: PaymentWebhookSignatureVariantCheck[]
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function normalizeString(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const trimmed = v.trim()
  return trimmed || null
}

function normalizeNumberToString(v: unknown): string | null {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return normalizeString(v)
}

function normalizeNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const parsed = Number(v.trim())
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function normalizeBoolean(v: unknown): boolean | null {
  if (typeof v === 'boolean') return v
  return null
}

function isEnabledEnvFlag(value: string | undefined): boolean {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = error.message.trim()
    return message || fallback
  }

  if (typeof error === 'string') {
    const message = error.trim()
    return message || fallback
  }

  if (isRecord(error)) {
    const direct = normalizeString(error['message'])
    if (direct) return direct
  }

  return fallback
}

function resolvePaymentMode(
  program: ProgramRowSummary | null
): ProgramPaymentMode {
  if (!program) return 'none'
  if (program.payment_mode) return program.payment_mode
  return program.requires_payment_pre ? 'pre' : 'none'
}

function isDuplicateError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const message = String((error as { message?: unknown }).message ?? '')
    .trim()
    .toLowerCase()
  return message.includes('duplicate key') || message.includes('23505')
}

function snapshotHeaders(request: NextRequest): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of request.headers.entries()) out[key] = value
  return out
}

function snapshotQueryParams(requestUrl: URL): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of requestUrl.searchParams.entries()) out[key] = value
  return out
}

function ackWebhook(params: {
  webhookTopic: 'payment' | 'merchant_order' | 'unknown'
  status: number
  reason: string
  payload: Record<string, unknown>
  providerEventId: string | null
  providerResourceId: string | null
}) {
  if (params.webhookTopic === 'payment') {
    console.info('[MercadoPago][webhook][payment] ack', {
      status: params.status,
      reason: params.reason,
      providerEventId: params.providerEventId,
      providerResourceId: params.providerResourceId,
    })
  }

  return NextResponse.json(params.payload, { status: params.status })
}

function safeHexEquals(left: string, right: string): boolean {
  const normalizedLeft = left.trim().toLowerCase()
  const normalizedRight = right.trim().toLowerCase()
  if (!normalizedLeft || !normalizedRight) return false

  const leftIsHex = /^[0-9a-f]+$/.test(normalizedLeft)
  const rightIsHex = /^[0-9a-f]+$/.test(normalizedRight)
  if (!leftIsHex || !rightIsHex) return false
  if (normalizedLeft.length % 2 !== 0 || normalizedRight.length % 2 !== 0) {
    return false
  }

  const leftBuffer = Buffer.from(normalizedLeft, 'hex')
  const rightBuffer = Buffer.from(normalizedRight, 'hex')
  if (leftBuffer.length === 0 || rightBuffer.length === 0) return false
  if (leftBuffer.length !== rightBuffer.length) return false
  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

function uniqueNonEmptyStrings(
  values: Array<string | null | undefined>
): string[] {
  const out: string[] = []
  const seen = new Set<string>()

  for (const value of values) {
    const normalized = normalizeString(value)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    out.push(normalized)
  }

  return out
}

function extractBodyDataId(payload: unknown): string | null {
  if (!isRecord(payload)) return null
  if (!isRecord(payload['data'])) return null
  return normalizeNumberToString(payload['data']['id'])
}

function buildPaymentWebhookSignatureValidation(params: {
  request: NextRequest
  requestUrl: URL
  payload: unknown
  providerEventId: string | null
  providerResourceId: string | null
  webhookSecrets: MercadoPagoNamedSecret[]
}): PaymentWebhookSignatureValidation {
  const signatureHeader = params.request.headers.get('x-signature')
  const requestIdHeader = params.request.headers.get('x-request-id')
  const parsedSignature = parseMercadoPagoSignatureHeader(signatureHeader)
  const ts = normalizeString(parsedSignature.ts)
  const v1 = normalizeString(parsedSignature.v1)?.toLowerCase() ?? null

  const bodyDataId = extractBodyDataId(params.payload)
  const queryDataId = normalizeString(
    params.requestUrl.searchParams.get('data.id')
  )
  const legacyQueryId = normalizeString(
    params.requestUrl.searchParams.get('id')
  )

  const officialManifestDataId =
    queryDataId ??
    bodyDataId ??
    params.providerResourceId ??
    legacyQueryId ??
    null

  const alternativeIdsTested = uniqueNonEmptyStrings([
    bodyDataId,
    queryDataId,
    legacyQueryId,
    params.providerResourceId,
    params.providerEventId,
  ]).filter((id) => id !== officialManifestDataId)

  const requestIdSource: 'x-request-id' | 'missing' = requestIdHeader
    ? 'x-request-id'
    : 'missing'

  const officialManifest = buildMercadoPagoSignatureManifest({
    dataId: officialManifestDataId,
    requestId: requestIdHeader,
    ts,
    includeRequestId: true,
    trailingSemicolon: true,
  })

  const variantEntries: Array<{ name: string; manifest: string }> = []
  if (officialManifestDataId && ts) {
    variantEntries.push({
      name: 'no_trailing_semicolon',
      manifest: buildMercadoPagoSignatureManifest({
        dataId: officialManifestDataId,
        requestId: requestIdHeader,
        ts,
        includeRequestId: true,
        trailingSemicolon: false,
      }),
    })
    variantEntries.push({
      name: 'without_request_id',
      manifest: buildMercadoPagoSignatureManifest({
        dataId: officialManifestDataId,
        requestId: requestIdHeader,
        ts,
        includeRequestId: false,
        trailingSemicolon: true,
      }),
    })
  }

  const trimmedVariants = variantEntries.filter((entry) =>
    Boolean(entry.manifest)
  )
  const checkedManifests = uniqueNonEmptyStrings([
    officialManifest,
    ...trimmedVariants.map((entry) => entry.manifest),
  ])

  const testedSecretSources = params.webhookSecrets.map((entry) => entry.source)

  if (!v1) {
    return {
      signatureValid: false,
      reason: 'missing_signature',
      ts,
      v1: null,
      manifest: officialManifest,
      matchedManifest: null,
      checkedManifests,
      checkedDataIds: uniqueNonEmptyStrings([
        officialManifestDataId,
        ...alternativeIdsTested,
      ]),
      testedSecretSources,
      matchedSecretSource: null,
      dataIdDetected: officialManifestDataId,
      requestIdDetected: requestIdHeader,
      requestIdSource,
      usedRequestIdFallback: false,
      officialManifestDataId,
      alternativeIdsTested,
      officialMatch: false,
      calculatedHmacOfficial: '',
      variantChecks: [],
    }
  }

  if (params.webhookSecrets.length === 0) {
    return {
      signatureValid: false,
      reason: 'missing_secret',
      ts,
      v1,
      manifest: officialManifest,
      matchedManifest: null,
      checkedManifests,
      checkedDataIds: uniqueNonEmptyStrings([
        officialManifestDataId,
        ...alternativeIdsTested,
      ]),
      testedSecretSources,
      matchedSecretSource: null,
      dataIdDetected: officialManifestDataId,
      requestIdDetected: requestIdHeader,
      requestIdSource,
      usedRequestIdFallback: false,
      officialManifestDataId,
      alternativeIdsTested,
      officialMatch: false,
      calculatedHmacOfficial: '',
      variantChecks: [],
    }
  }

  if (!officialManifest) {
    return {
      signatureValid: false,
      reason: 'missing_manifest',
      ts,
      v1,
      manifest: '',
      matchedManifest: null,
      checkedManifests,
      checkedDataIds: uniqueNonEmptyStrings([
        officialManifestDataId,
        ...alternativeIdsTested,
      ]),
      testedSecretSources,
      matchedSecretSource: null,
      dataIdDetected: officialManifestDataId,
      requestIdDetected: requestIdHeader,
      requestIdSource,
      usedRequestIdFallback: false,
      officialManifestDataId,
      alternativeIdsTested,
      officialMatch: false,
      calculatedHmacOfficial: '',
      variantChecks: [],
    }
  }

  let calculatedHmacOfficial = ''
  let officialMatch = false
  let variantChecks: PaymentWebhookSignatureVariantCheck[] = []
  let matchedManifest: string | null = null
  let matchedSecretSource: string | null = null

  const firstSecret = params.webhookSecrets[0]
  if (firstSecret) {
    calculatedHmacOfficial = calculateMercadoPagoSignatureHmac({
      secret: firstSecret.value,
      manifest: officialManifest,
    })
    officialMatch = safeHexEquals(calculatedHmacOfficial, v1)
    variantChecks = trimmedVariants.map((entry) => {
      const calculatedHmacVariant = calculateMercadoPagoSignatureHmac({
        secret: firstSecret.value,
        manifest: entry.manifest,
      })
      return {
        manifestVariantName: entry.name,
        manifestVariantValue: entry.manifest,
        calculatedHmacVariant,
        variantMatch: safeHexEquals(calculatedHmacVariant, v1),
      }
    })
    if (officialMatch) {
      matchedManifest = officialManifest
      matchedSecretSource = firstSecret.source
    }
  }

  if (!matchedManifest && params.webhookSecrets.length > 1) {
    for (const secretCandidate of params.webhookSecrets.slice(1)) {
      const candidateOfficial = calculateMercadoPagoSignatureHmac({
        secret: secretCandidate.value,
        manifest: officialManifest,
      })
      if (safeHexEquals(candidateOfficial, v1)) {
        officialMatch = true
        calculatedHmacOfficial = candidateOfficial
        matchedManifest = officialManifest
        matchedSecretSource = secretCandidate.source
        break
      }
    }
  }

  return {
    signatureValid: Boolean(matchedManifest),
    reason: matchedManifest ? 'ok' : 'signature_mismatch',
    ts,
    v1,
    manifest: officialManifest,
    matchedManifest,
    checkedManifests,
    checkedDataIds: uniqueNonEmptyStrings([
      officialManifestDataId,
      ...alternativeIdsTested,
    ]),
    testedSecretSources,
    matchedSecretSource,
    dataIdDetected: officialManifestDataId,
    requestIdDetected: requestIdHeader,
    requestIdSource,
    usedRequestIdFallback: false,
    officialManifestDataId,
    alternativeIdsTested,
    officialMatch,
    calculatedHmacOfficial,
    variantChecks,
  }
}

async function markWebhookEvent(params: {
  eventId: string
  processed: boolean
  processingError?: string | null
  paymentId?: string | null
}) {
  await supabaseAdmin
    .from('payment_webhook_events')
    .update({
      processed: params.processed,
      processed_at: new Date().toISOString(),
      processing_error: params.processingError ?? null,
      payment_id: params.paymentId ?? null,
    })
    .eq('id', params.eventId)
}

function resolveWebhookEventMetadata(params: {
  payload: unknown
  requestUrl: URL
  requestIdHeader: string | null
}): {
  webhookTopic: 'payment' | 'merchant_order' | 'unknown'
  isLegacyPaymentFeed: boolean
  eventType: string | null
  providerEventId: string | null
  providerResourceId: string | null
} {
  const webhookTopic = resolveMercadoPagoWebhookTopic(
    params.requestUrl,
    params.payload
  )

  let eventType: string | null = null
  let providerEventId: string | null = null
  let providerResourceId = resolveMercadoPagoDataId(
    params.requestUrl,
    params.payload
  )

  const queryLegacyId = normalizeString(
    params.requestUrl.searchParams.get('id')
  )
  if (
    !providerResourceId &&
    webhookTopic === 'merchant_order' &&
    queryLegacyId
  ) {
    providerResourceId = queryLegacyId
  }

  if (isRecord(params.payload)) {
    const action = normalizeString(params.payload['action'])
    const type = normalizeString(params.payload['type'])
    eventType = action ?? type
    providerEventId = normalizeNumberToString(params.payload['id'])
  }

  const hasLegacyPaymentTopic =
    (normalizeString(params.requestUrl.searchParams.get('topic')) ?? '')
      .toLowerCase()
      .trim() === 'payment'
  const hasResourcePayload =
    isRecord(params.payload) &&
    normalizeString(params.payload['resource']) !== null
  const hasActionPayload =
    isRecord(params.payload) &&
    normalizeString(params.payload['action']) !== null
  const hasTypePayload =
    isRecord(params.payload) && normalizeString(params.payload['type']) !== null

  const isLegacyPaymentFeed =
    webhookTopic === 'payment' &&
    hasLegacyPaymentTopic &&
    hasResourcePayload &&
    !hasActionPayload &&
    !hasTypePayload

  if (!eventType) {
    if (webhookTopic === 'payment') {
      eventType = isLegacyPaymentFeed
        ? 'payment.legacy_feed'
        : 'payment.webhook'
    }
    if (webhookTopic === 'merchant_order') eventType = 'merchant_order.webhook'
  }

  if (!providerEventId) {
    providerEventId = normalizeString(params.requestIdHeader)
  }

  return {
    webhookTopic,
    isLegacyPaymentFeed,
    eventType,
    providerEventId,
    providerResourceId,
  }
}

function extractMercadoPagoFields(payment: unknown): {
  mercadoPagoPaymentId: string | null
  merchantOrderId: string | null
  externalReference: string | null
  preferenceId: string | null
  mpStatus: string | null
  statusDetail: string | null
  paymentType: string | null
  paymentMethod: string | null
  installments: number | null
  liveMode: boolean | null
} {
  if (!isRecord(payment)) {
    return {
      mercadoPagoPaymentId: null,
      merchantOrderId: null,
      externalReference: null,
      preferenceId: null,
      mpStatus: null,
      statusDetail: null,
      paymentType: null,
      paymentMethod: null,
      installments: null,
      liveMode: null,
    }
  }

  const order = isRecord(payment['order'])
    ? (payment['order'] as Record<string, unknown>)
    : null

  return {
    mercadoPagoPaymentId: normalizeNumberToString(payment['id']),
    merchantOrderId:
      normalizeNumberToString(order?.['id']) ??
      normalizeNumberToString(payment['order_id']),
    externalReference: normalizeString(payment['external_reference']),
    preferenceId: normalizeString(payment['preference_id']),
    mpStatus: normalizeString(payment['status']),
    statusDetail: normalizeString(payment['status_detail']),
    paymentType:
      normalizeString(payment['payment_type_id']) ??
      normalizeString(payment['payment_type']),
    paymentMethod:
      normalizeString(payment['payment_method_id']) ??
      normalizeString(payment['payment_method']),
    installments: normalizeNumber(payment['installments']),
    liveMode: normalizeBoolean(payment['live_mode']),
  }
}

async function findInternalPaymentId(params: {
  externalReference: string | null
  mercadoPagoPaymentId: string | null
  preferenceId: string | null
}): Promise<string | null> {
  if (params.externalReference) {
    const { data: paymentByExternalReference } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('id', params.externalReference)
      .eq('provider', MERCADO_PAGO_PROVIDER)
      .maybeSingle()

    if (paymentByExternalReference?.id)
      return String(paymentByExternalReference.id)
  }

  if (params.mercadoPagoPaymentId) {
    const { data: byMpPaymentId } = await supabaseAdmin
      .from('mercadopago_payments')
      .select('payment_id')
      .eq('mercadopago_payment_id', params.mercadoPagoPaymentId)
      .maybeSingle()
    if (byMpPaymentId?.payment_id) return String(byMpPaymentId.payment_id)
  }

  if (params.preferenceId) {
    const { data: byPreferenceId } = await supabaseAdmin
      .from('mercadopago_payments')
      .select('payment_id')
      .eq('preference_id', params.preferenceId)
      .maybeSingle()
    if (byPreferenceId?.payment_id) return String(byPreferenceId.payment_id)
  }

  return null
}

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const requestIdHeader = request.headers.get('x-request-id')
  const bodyText = await request.text()

  let payload: unknown = {}
  try {
    payload = bodyText ? (JSON.parse(bodyText) as unknown) : {}
  } catch {
    payload = {}
  }

  const webhookMetadata = resolveWebhookEventMetadata({
    payload,
    requestUrl,
    requestIdHeader: request.headers.get('x-request-id'),
  })
  const {
    webhookTopic,
    isLegacyPaymentFeed,
    eventType,
    providerEventId,
    providerResourceId,
  } = webhookMetadata

  let webhookSecrets: MercadoPagoNamedSecret[] = []
  let resolvedMercadoPagoEnv: 'test' | 'production' = 'test'
  let allowTestWebhookWithoutSignature = false
  let envConfigError: string | null = null
  try {
    const runtimeDebug = getMercadoPagoRuntimeDebugInfo()
    resolvedMercadoPagoEnv = runtimeDebug.env
    allowTestWebhookWithoutSignature =
      runtimeDebug.env === 'test' &&
      isEnabledEnvFlag(
        process.env.MERCADOPAGO_ALLOW_TEST_WEBHOOK_WITHOUT_SIGNATURE
      )
    webhookSecrets = getMercadoPagoWebhookSecretsForValidation()
    if (webhookTopic === 'payment') {
      console.info('[MercadoPago][webhook][payment] runtime', {
        env: runtimeDebug.env,
        hasAccessToken: runtimeDebug.hasAccessToken,
        hasWebhookSecret: runtimeDebug.hasWebhookSecret,
        webhookSecretSource: runtimeDebug.webhookSecretSource,
        webhookSecretLength: runtimeDebug.webhookSecretLength,
        webhookSecretCandidates: webhookSecrets.map((entry) => entry.source),
        baseUrl: runtimeDebug.baseUrl,
        xRequestId: requestIdHeader,
        webhookTopic,
        isLegacyPaymentFeed,
        providerEventId,
        providerResourceId,
        allowTestWebhookWithoutSignature,
      })
    }
  } catch (error) {
    envConfigError = extractErrorMessage(
      error,
      "MERCADOPAGO_ENV debe ser 'test' o 'production'."
    )
    console.error('[MercadoPago][webhook] invalid environment config', {
      message: envConfigError,
    })
  }

  const shouldValidateSignature =
    webhookTopic === 'payment' && !isLegacyPaymentFeed
  const parsedSignatureHeader = parseMercadoPagoSignatureHeader(
    request.headers.get('x-signature')
  )
  const bodyDataId = extractBodyDataId(payload)
  const queryDataId = normalizeString(requestUrl.searchParams.get('data.id'))
  const queryLegacyId = normalizeString(requestUrl.searchParams.get('id'))
  const requestHeadersForDebug = {
    'x-signature': request.headers.get('x-signature'),
    'x-request-id': requestIdHeader,
    'x-nf-request-id': request.headers.get('x-nf-request-id'),
    'content-type': request.headers.get('content-type'),
    'user-agent': request.headers.get('user-agent'),
  }
  const requestQueryForDebug = snapshotQueryParams(requestUrl)

  if (webhookTopic === 'payment') {
    const bodyType = isRecord(payload) ? normalizeString(payload['type']) : null
    const bodyAction = isRecord(payload)
      ? normalizeString(payload['action'])
      : null
    const bodyEventId = isRecord(payload)
      ? normalizeNumberToString(payload['id'])
      : null
    const bodyUserId = isRecord(payload)
      ? normalizeNumberToString(payload['user_id'])
      : null

    console.info('[MercadoPago][webhook][payment] request', {
      env: resolvedMercadoPagoEnv,
      envConfigError,
      webhookUrl: request.url,
      queryParams: requestQueryForDebug,
      headers: requestHeadersForDebug,
      rawBody: bodyText,
    })

    console.info('[MercadoPago][webhook][payment] parsed', {
      webhookTopic,
      eventType,
      providerEventId,
      providerResourceId,
      dataIdDetected: providerResourceId,
      bodyDataId,
      bodyType,
      bodyAction,
      bodyEventId,
      bodyUserId,
      requestIdDetected: requestIdHeader,
      tsDetected: parsedSignatureHeader.ts,
      v1Detected: parsedSignatureHeader.v1,
    })
  }

  let signature: PaymentWebhookSignatureValidation | null = null
  let bypassedSignatureInTestDebug = false

  if (shouldValidateSignature) {
    signature = buildPaymentWebhookSignatureValidation({
      request,
      requestUrl,
      payload,
      providerEventId,
      providerResourceId,
      webhookSecrets,
    })

    console.info('[MercadoPago][webhook][payment] hypothesis-id', {
      bodyDataId,
      queryDataId,
      legacyQueryId: queryLegacyId,
      providerEventId,
      providerResourceId,
      officialManifestDataId: signature.officialManifestDataId,
      alternativeIdsTested: signature.alternativeIdsTested,
    })

    console.info('[MercadoPago][webhook][payment] hypothesis-request-id', {
      xRequestId: requestIdHeader,
      xNfRequestId: request.headers.get('x-nf-request-id'),
      requestIdDetected: signature.requestIdDetected,
      requestIdSource: signature.requestIdSource,
      usedRequestIdFallback: signature.usedRequestIdFallback,
    })

    console.info('[MercadoPago][webhook][payment] hypothesis-manifest', {
      officialManifest: signature.manifest,
      calculatedHmacOfficial: signature.calculatedHmacOfficial,
      receivedV1: signature.v1,
      officialMatch: signature.officialMatch,
      testedSecretSources: signature.testedSecretSources,
      matchedSecretSource: signature.matchedSecretSource,
      variantChecks: signature.variantChecks,
      signatureValid: signature.signatureValid,
      matchedManifest: signature.matchedManifest,
      reason: signature.reason,
    })
  }

  if (signature) {
    console.info('[MercadoPago][webhook][payment] signature-check', {
      signatureValid: signature.signatureValid,
      reason: signature.reason,
      ts: signature.ts,
      xRequestId: requestIdHeader,
      providerResourceId,
      hasSignatureHeader: Boolean(request.headers.get('x-signature')),
      testedSecretSources: signature.testedSecretSources,
      matchedSecretSource: signature.matchedSecretSource,
      checkedDataIds: signature.checkedDataIds,
      manifestUsedForHmac: signature.matchedManifest ?? signature.manifest,
      manifestTried: signature.checkedManifests,
      matchedManifest: signature.matchedManifest,
    })
  } else {
    console.info('[MercadoPago][webhook] signature-check skipped', {
      webhookTopic,
      isLegacyPaymentFeed,
    })
  }

  if (providerEventId) {
    const { data: existingProcessed } = await supabaseAdmin
      .from('payment_webhook_events')
      .select('id, processed')
      .eq('provider', MERCADO_PAGO_PROVIDER)
      .eq('provider_event_id', providerEventId)
      .eq('processed', true)
      .limit(1)
      .maybeSingle()

    if (existingProcessed?.id) {
      return ackWebhook({
        webhookTopic,
        status: 200,
        reason: 'duplicate_already_processed',
        payload: { ok: true, duplicate: true },
        providerEventId,
        providerResourceId,
      })
    }
  }

  const { data: insertedEvent, error: insertEventErr } = await supabaseAdmin
    .from('payment_webhook_events')
    .insert({
      provider: MERCADO_PAGO_PROVIDER,
      event_type: eventType,
      provider_event_id: providerEventId,
      provider_resource_id: providerResourceId,
      signature_valid: signature ? signature.signatureValid : null,
      processed: false,
      payload: payload,
      headers: snapshotHeaders(request),
      query_params: snapshotQueryParams(requestUrl),
    })
    .select('id')
    .maybeSingle()

  if (insertEventErr) {
    if (isDuplicateError(insertEventErr)) {
      return ackWebhook({
        webhookTopic,
        status: 200,
        reason: 'duplicate_on_insert',
        payload: { ok: true, duplicate: true },
        providerEventId,
        providerResourceId,
      })
    }
    return ackWebhook({
      webhookTopic,
      status: 200,
      reason: 'event_insert_error_acknowledged',
      payload: { ok: true },
      providerEventId,
      providerResourceId,
    })
  }

  const eventId = String(insertedEvent?.id ?? '')
  if (!eventId) {
    return ackWebhook({
      webhookTopic,
      status: 200,
      reason: 'missing_event_id_after_insert',
      payload: { ok: true },
      providerEventId,
      providerResourceId,
    })
  }

  if (webhookTopic === 'merchant_order') {
    await markWebhookEvent({
      eventId,
      processed: true,
      processingError:
        'Evento merchant_order ignorado para cierre de pagos canonicos.',
    })
    return ackWebhook({
      webhookTopic,
      status: 200,
      reason: 'merchant_order_ignored',
      payload: { ok: true, ignored: true },
      providerEventId,
      providerResourceId,
    })
  }

  if (isLegacyPaymentFeed) {
    await markWebhookEvent({
      eventId,
      processed: true,
      processingError:
        'Evento payment legacy (topic=payment) auditado e ignorado para cierre canonico. Se espera payment.created/payment.updated.',
    })
    return ackWebhook({
      webhookTopic,
      status: 200,
      reason: 'legacy_payment_feed_ignored',
      payload: { ok: true, ignored: true },
      providerEventId,
      providerResourceId,
    })
  }

  if (webhookTopic !== 'payment') {
    await markWebhookEvent({
      eventId,
      processed: true,
      processingError: 'Evento webhook no soportado para procesamiento.',
    })
    return ackWebhook({
      webhookTopic,
      status: 200,
      reason: 'unsupported_topic_ignored',
      payload: { ok: true, ignored: true },
      providerEventId,
      providerResourceId,
    })
  }

  if (!signature || !signature.signatureValid) {
    const canBypassInvalidSignatureInTest =
      allowTestWebhookWithoutSignature &&
      resolvedMercadoPagoEnv === 'test' &&
      webhookTopic === 'payment' &&
      Boolean(providerResourceId)

    if (canBypassInvalidSignatureInTest) {
      bypassedSignatureInTestDebug = true
      console.warn('[MercadoPago][webhook][DEBUG_ONLY] bypassing signature', {
        env: resolvedMercadoPagoEnv,
        signatureReason: signature?.reason ?? 'not_checked',
        providerResourceId,
        xRequestId: requestIdHeader,
      })
    }

    if (!canBypassInvalidSignatureInTest) {
      const signatureIssue = !signature
        ? 'Webhook rechazado: validacion de firma no ejecutada.'
        : signature.reason === 'missing_secret'
          ? 'Webhook rechazado: falta configurar MERCADOPAGO_WEBHOOK_SECRET para este entorno.'
          : signature.reason === 'missing_signature'
            ? 'Webhook rechazado: falta x-signature (v1) en el request.'
            : signature.reason === 'missing_manifest'
              ? 'Webhook rechazado: no se pudo construir manifest para validar firma.'
              : 'Webhook rechazado: la firma no coincide con el secret configurado.'

      await markWebhookEvent({
        eventId,
        processed: true,
        processingError: `${signatureIssue} reason=${signature?.reason ?? 'not_checked'}; tested_secret_sources=${signature?.testedSecretSources.join(',') || 'none'}; provider_resource_id=${providerResourceId ?? 'null'}; manifest=${signature?.manifest || 'n/a'}${envConfigError ? `; env_config_error=${envConfigError}` : ''}`,
      })
      return ackWebhook({
        webhookTopic,
        status: 200,
        reason: 'invalid_signature_acknowledged',
        payload: { ok: true },
        providerEventId,
        providerResourceId,
      })
    }
  }

  if (!providerResourceId) {
    await markWebhookEvent({
      eventId,
      processed: true,
      processingError: 'Webhook de payment recibido sin id de recurso.',
    })
    return ackWebhook({
      webhookTopic,
      status: 200,
      reason: 'missing_provider_resource_id',
      payload: { ok: true },
      providerEventId,
      providerResourceId,
    })
  }

  const paymentClient = createMercadoPagoPaymentClient()
  let remotePayment: unknown = null
  try {
    remotePayment = await paymentClient.get({ id: providerResourceId })
  } catch (error) {
    await markWebhookEvent({
      eventId,
      processed: true,
      processingError: extractErrorMessage(
        error,
        'No se pudo consultar pago en Mercado Pago.'
      ),
    })
    return ackWebhook({
      webhookTopic,
      status: 200,
      reason: 'remote_payment_lookup_failed',
      payload: { ok: true },
      providerEventId,
      providerResourceId,
    })
  }

  const fields = extractMercadoPagoFields(remotePayment)
  const paymentId = await findInternalPaymentId({
    externalReference: fields.externalReference,
    mercadoPagoPaymentId: fields.mercadoPagoPaymentId,
    preferenceId: fields.preferenceId,
  })

  if (!paymentId) {
    await markWebhookEvent({
      eventId,
      processed: true,
      processingError:
        'No se encontro el pago interno para external_reference/preference_id/mercadopago_payment_id.',
    })
    return ackWebhook({
      webhookTopic,
      status: 200,
      reason: 'internal_payment_not_found',
      payload: { ok: true },
      providerEventId,
      providerResourceId,
    })
  }

  const { data: paymentRowData, error: paymentRowErr } = await supabaseAdmin
    .from('payments')
    .select('id,provider,status,purpose,application_id,program_id,paid_at')
    .eq('id', paymentId)
    .eq('provider', MERCADO_PAGO_PROVIDER)
    .maybeSingle()

  if (paymentRowErr || !paymentRowData) {
    await markWebhookEvent({
      eventId,
      processed: true,
      paymentId,
      processingError: 'No se encontro pago canonico provider=mercado_pago.',
    })
    return ackWebhook({
      webhookTopic,
      status: 200,
      reason: 'canonical_payment_missing_or_provider_mismatch',
      payload: { ok: true },
      providerEventId,
      providerResourceId,
    })
  }

  const paymentRow = paymentRowData as PaymentRow
  const mappedStatus = mapMercadoPagoStatusToPaymentStatus(fields.mpStatus)
  const nextStatus: KnownPaymentStatus =
    paymentRow.status === 'paid' && mappedStatus !== 'paid'
      ? 'paid'
      : mappedStatus

  const nowIso = new Date().toISOString()

  await supabaseAdmin.from('mercadopago_payments').upsert(
    {
      payment_id: paymentRow.id,
      preference_id: fields.preferenceId,
      mercadopago_payment_id: fields.mercadoPagoPaymentId,
      merchant_order_id: fields.merchantOrderId,
      external_reference: fields.externalReference,
      mp_status: fields.mpStatus,
      status_detail: fields.statusDetail,
      payment_type: fields.paymentType,
      payment_method: fields.paymentMethod,
      installments: fields.installments,
      live_mode: fields.liveMode,
      last_webhook_at: nowIso,
      last_synced_at: nowIso,
      raw_payment_response: remotePayment,
    },
    { onConflict: 'payment_id' }
  )

  const paymentUpdate: Record<string, unknown> = {
    status: nextStatus,
  }

  if (nextStatus === 'paid' && !paymentRow.paid_at) {
    paymentUpdate['paid_at'] = nowIso
  }

  if (nextStatus === 'failed' || nextStatus === 'canceled') {
    paymentUpdate['error_message'] = fields.statusDetail ?? fields.mpStatus
  }

  await supabaseAdmin
    .from('payments')
    .update(paymentUpdate)
    .eq('id', paymentRow.id)
    .eq('provider', MERCADO_PAGO_PROVIDER)

  if (paymentRow.application_id && paymentRow.purpose === 'tuition') {
    const applicationUpdate: Record<string, unknown> = {
      payment_status: nextStatus,
    }

    if (nextStatus === 'paid') {
      applicationUpdate['paid_at'] = paymentRow.paid_at ?? nowIso

      const { data: programRow } = await supabaseAdmin
        .from('programs')
        .select('id,payment_mode,requires_payment_pre')
        .eq('id', paymentRow.program_id)
        .maybeSingle()

      const program = (programRow as ProgramRowSummary | null) ?? null
      if (resolvePaymentMode(program) === 'post') {
        applicationUpdate['status'] = 'enrolled'
      }
    }

    await supabaseAdmin
      .from('applications')
      .update(applicationUpdate)
      .eq('id', paymentRow.application_id)
  }

  await markWebhookEvent({
    eventId,
    processed: true,
    paymentId: paymentRow.id,
    processingError: bypassedSignatureInTestDebug
      ? 'DEBUG_ONLY: pago procesado en test con flag MERCADOPAGO_ALLOW_TEST_WEBHOOK_WITHOUT_SIGNATURE=true y firma invalida.'
      : null,
  })

  return ackWebhook({
    webhookTopic,
    status: 200,
    reason: 'processed_successfully',
    payload: { ok: true },
    providerEventId,
    providerResourceId,
  })
}
