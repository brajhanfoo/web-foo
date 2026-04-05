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

type PaymentWebhookSignatureValidation = {
  signatureValid: boolean
  reason: PaymentWebhookSignatureValidationReason
  ts: string | null
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
  const sensitiveHeaders = new Set([
    'x-signature',
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
  ])
  const out: Record<string, string> = {}
  for (const [key, value] of request.headers.entries()) {
    const normalizedKey = key.trim().toLowerCase()
    out[key] = sensitiveHeaders.has(normalizedKey) ? '[redacted]' : value
  }
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

function extractBodyDataId(payload: unknown): string | null {
  if (!isRecord(payload)) return null
  if (!isRecord(payload['data'])) return null
  return normalizeNumberToString(payload['data']['id'])
}

function buildPaymentWebhookSignatureValidation(params: {
  request: NextRequest
  requestUrl: URL
  payload: unknown
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

  const officialManifest = buildMercadoPagoSignatureManifest({
    dataId: officialManifestDataId,
    requestId: requestIdHeader,
    ts,
    includeRequestId: true,
    trailingSemicolon: true,
  })

  if (!v1) {
    return {
      signatureValid: false,
      reason: 'missing_signature',
      ts,
    }
  }

  if (params.webhookSecrets.length === 0) {
    return {
      signatureValid: false,
      reason: 'missing_secret',
      ts,
    }
  }

  if (!officialManifest) {
    return {
      signatureValid: false,
      reason: 'missing_manifest',
      ts,
    }
  }

  for (const secretCandidate of params.webhookSecrets) {
    const calculatedHmac = calculateMercadoPagoSignatureHmac({
      secret: secretCandidate.value,
      manifest: officialManifest,
    })
    if (safeHexEquals(calculatedHmac, v1)) {
      return {
        signatureValid: true,
        reason: 'ok',
        ts,
      }
    }
  }

  return {
    signatureValid: false,
    reason: 'signature_mismatch',
    ts,
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

  const runtimeDebug = getMercadoPagoRuntimeDebugInfo()
  const webhookSecrets = getMercadoPagoWebhookSecretsForValidation()
  const shouldValidateSignature =
    webhookTopic === 'payment' && !isLegacyPaymentFeed

  let signature: PaymentWebhookSignatureValidation | null = null
  if (shouldValidateSignature) {
    signature = buildPaymentWebhookSignatureValidation({
      request,
      requestUrl,
      payload,
      providerResourceId,
      webhookSecrets,
    })
  }

  if (webhookTopic === 'payment') {
    console.info('[MercadoPago][webhook] received', {
      eventType,
      providerEventId,
      providerResourceId,
      hasWebhookSecret: runtimeDebug.hasWebhookSecret,
      signatureValid: signature?.signatureValid ?? null,
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
    const signatureIssue = !signature
      ? 'Webhook rechazado: validacion de firma no ejecutada.'
      : signature.reason === 'missing_secret'
        ? 'Webhook rechazado: falta configurar MERCADOPAGO_WEBHOOK_SECRET.'
        : signature.reason === 'missing_signature'
          ? 'Webhook rechazado: falta x-signature (v1).'
          : signature.reason === 'missing_manifest'
            ? 'Webhook rechazado: no se pudo construir manifest.'
            : 'Webhook rechazado: firma invalida.'

    await markWebhookEvent({
      eventId,
      processed: true,
      processingError: `${signatureIssue} reason=${signature?.reason ?? 'not_checked'}; provider_resource_id=${providerResourceId ?? 'null'}`,
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
  const { data: existingMpData } = await supabaseAdmin
    .from('mercadopago_payments')
    .select(
      'preference_id,mercadopago_payment_id,merchant_order_id,external_reference,mp_status,status_detail,payment_type,payment_method,installments,live_mode,raw_preference_response'
    )
    .eq('payment_id', paymentRow.id)
    .maybeSingle()

  const existingMp = isRecord(existingMpData) ? existingMpData : null
  const rawPreferenceResponse = isRecord(
    existingMp?.['raw_preference_response']
  )
    ? (existingMp['raw_preference_response'] as Record<string, unknown>)
    : null
  const rawPreferenceId =
    normalizeString(rawPreferenceResponse?.['id']) ??
    normalizeNumberToString(rawPreferenceResponse?.['id']) ??
    null
  const mergedPreferenceId =
    fields.preferenceId ??
    normalizeString(existingMp?.['preference_id']) ??
    rawPreferenceId ??
    null
  const mergedMercadoPagoPaymentId =
    fields.mercadoPagoPaymentId ??
    normalizeString(existingMp?.['mercadopago_payment_id']) ??
    null
  const mergedMerchantOrderId =
    fields.merchantOrderId ??
    normalizeString(existingMp?.['merchant_order_id']) ??
    null
  const mergedExternalReference =
    fields.externalReference ??
    normalizeString(existingMp?.['external_reference']) ??
    paymentRow.id
  const mergedMpStatus =
    fields.mpStatus ?? normalizeString(existingMp?.['mp_status']) ?? null
  const mergedStatusDetail =
    fields.statusDetail ??
    normalizeString(existingMp?.['status_detail']) ??
    null
  const mergedPaymentType =
    fields.paymentType ?? normalizeString(existingMp?.['payment_type']) ?? null
  const mergedPaymentMethod =
    fields.paymentMethod ??
    normalizeString(existingMp?.['payment_method']) ??
    null
  const mergedInstallments =
    fields.installments ?? normalizeNumber(existingMp?.['installments']) ?? null
  const mergedLiveMode =
    fields.liveMode ?? normalizeBoolean(existingMp?.['live_mode']) ?? null

  await supabaseAdmin.from('mercadopago_payments').upsert(
    {
      payment_id: paymentRow.id,
      preference_id: mergedPreferenceId,
      mercadopago_payment_id: mergedMercadoPagoPaymentId,
      merchant_order_id: mergedMerchantOrderId,
      external_reference: mergedExternalReference,
      mp_status: mergedMpStatus,
      status_detail: mergedStatusDetail,
      payment_type: mergedPaymentType,
      payment_method: mergedPaymentMethod,
      installments: mergedInstallments,
      live_mode: mergedLiveMode,
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

  if (nextStatus === 'paid') {
    paymentUpdate['error_message'] = null
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

  console.info('[MercadoPago][webhook] payment-updated', {
    eventType,
    providerResourceId,
    paymentId: paymentRow.id,
    status: nextStatus,
  })

  await markWebhookEvent({
    eventId,
    processed: true,
    paymentId: paymentRow.id,
    processingError: null,
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
