import crypto from 'node:crypto'

import { after, NextRequest, NextResponse } from 'next/server'

import {
  buildMercadoPagoSignatureManifest,
  calculateMercadoPagoSignatureHmac,
  createMercadoPagoPaymentClient,
  getMercadoPagoRuntimeDebugInfo,
  getMercadoPagoWebhookSecretsForValidation,
  mapMercadoPagoStatusToPaymentStatus,
  normalizeMercadoPagoCanonicalStatus,
  parseMercadoPagoSignatureHeader,
  resolveMercadoPagoDataId,
  resolveMercadoPagoWebhookTopic,
  type MercadoPagoNamedSecret,
} from '@/lib/payments/mercadopago'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { PaymentProvider, PaymentStatus } from '@/types/payments'
import type { ProgramPaymentMode, ProgramRow } from '@/types/programs'

export const runtime = 'nodejs'

const LOG_PREFIX = '[mp-webhook]'
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

type SignatureReason =
  | 'ok'
  | 'missing_secret'
  | 'missing_signature'
  | 'missing_manifest'
  | 'signature_mismatch'

type SignatureValidation = {
  signatureValid: boolean
  reason: SignatureReason
  ts: string | null
}

type Metadata = {
  webhookTopic: 'payment' | 'merchant_order' | 'unknown'
  isLegacyPaymentFeed: boolean
  eventType: string | null
  providerEventId: string | null
  providerResourceId: string | null
}

type Context = {
  requestMethod: string
  requestPath: string
  requestId: string | null
  queryParams: Record<string, string>
  headers: Record<string, string>
  payload: Record<string, unknown>
  payloadParseError: string | null
  rawBody: string
  metadata: Metadata
  signature: SignatureValidation | null
  shouldValidateSignature: boolean
  hasWebhookSecret: boolean
}

function logInfo(message: string, context?: Record<string, unknown>) {
  console.info(`${LOG_PREFIX} ${message}`, context ?? {})
}

function logWarn(message: string, context?: Record<string, unknown>) {
  console.warn(`${LOG_PREFIX} ${message}`, context ?? {})
}

function logError(message: string, context?: Record<string, unknown>) {
  console.error(`${LOG_PREFIX} ${message}`, context ?? {})
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function normalizeString(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t || null
}

function normalizeNumberToString(v: unknown): string | null {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return normalizeString(v)
}

function normalizeNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v.trim())
    if (Number.isFinite(n)) return n
  }
  return null
}

function normalizeBoolean(v: unknown): boolean | null {
  if (typeof v === 'boolean') return v
  return null
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message.trim() || fallback
  if (typeof error === 'string') return error.trim() || fallback
  if (isRecord(error)) {
    const msg = normalizeString(error['message'])
    if (msg) return msg
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
  if (!isRecord(error)) return false
  const msg = String(error['message'] ?? '')
    .trim()
    .toLowerCase()
  return msg.includes('duplicate key') || msg.includes('23505')
}

function snapshotHeaders(request: NextRequest): Record<string, string> {
  const relevant = [
    'content-type',
    'user-agent',
    'x-request-id',
    'x-signature',
    'x-forwarded-for',
    'x-forwarded-proto',
  ]
  const out: Record<string, string> = {}
  for (const key of relevant) {
    const value = request.headers.get(key)
    if (!value) continue
    out[key] = key === 'x-signature' ? '[redacted]' : value
  }
  return out
}

function snapshotQueryParams(requestUrl: URL): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of requestUrl.searchParams.entries()) out[key] = value
  return out
}

function parsePayload(rawBody: string): {
  payload: Record<string, unknown>
  parseError: string | null
} {
  const trimmed = rawBody.trim()
  if (!trimmed) return { payload: {}, parseError: null }

  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (isRecord(parsed)) return { payload: parsed, parseError: null }
    return {
      payload: { _raw_body: rawBody, _parse_note: 'payload_not_object' },
      parseError: 'payload_not_object',
    }
  } catch (error) {
    return {
      payload: {
        _raw_body: rawBody,
        _parse_note: extractErrorMessage(error, 'invalid_json'),
      },
      parseError: 'invalid_json',
    }
  }
}

function safeHexEquals(left: string, right: string): boolean {
  const a = left.trim().toLowerCase()
  const b = right.trim().toLowerCase()
  if (!a || !b || a.length % 2 !== 0 || b.length % 2 !== 0) return false
  if (!/^[0-9a-f]+$/.test(a) || !/^[0-9a-f]+$/.test(b)) return false
  const ab = Buffer.from(a, 'hex')
  const bb = Buffer.from(b, 'hex')
  if (ab.length === 0 || bb.length === 0 || ab.length !== bb.length) {
    return false
  }
  return crypto.timingSafeEqual(ab, bb)
}

function extractBodyDataId(payload: unknown): string | null {
  if (!isRecord(payload) || !isRecord(payload['data'])) return null
  return normalizeNumberToString(payload['data']['id'])
}

function buildSignatureValidation(params: {
  request: NextRequest
  requestUrl: URL
  payload: unknown
  providerResourceId: string | null
  webhookSecrets: MercadoPagoNamedSecret[]
}): SignatureValidation {
  const header = params.request.headers.get('x-signature')
  const requestId = params.request.headers.get('x-request-id')
  const parsed = parseMercadoPagoSignatureHeader(header)
  const ts = normalizeString(parsed.ts)
  const v1 = normalizeString(parsed.v1)?.toLowerCase() ?? null

  const dataId =
    normalizeString(params.requestUrl.searchParams.get('data.id')) ??
    extractBodyDataId(params.payload) ??
    params.providerResourceId ??
    normalizeString(params.requestUrl.searchParams.get('id')) ??
    null

  const manifest = buildMercadoPagoSignatureManifest({
    dataId,
    requestId,
    ts,
    includeRequestId: true,
    trailingSemicolon: true,
  })

  if (!v1) return { signatureValid: false, reason: 'missing_signature', ts }
  if (params.webhookSecrets.length === 0) {
    return { signatureValid: false, reason: 'missing_secret', ts }
  }
  if (!manifest) return { signatureValid: false, reason: 'missing_manifest', ts }

  for (const secret of params.webhookSecrets) {
    const hmac = calculateMercadoPagoSignatureHmac({
      secret: secret.value,
      manifest,
    })
    if (safeHexEquals(hmac, v1)) {
      return { signatureValid: true, reason: 'ok', ts }
    }
  }

  return { signatureValid: false, reason: 'signature_mismatch', ts }
}

function resolveMetadata(params: {
  payload: unknown
  requestUrl: URL
  requestId: string | null
}): Metadata {
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

  const legacyId = normalizeString(params.requestUrl.searchParams.get('id'))
  if (!providerResourceId && webhookTopic === 'merchant_order' && legacyId) {
    providerResourceId = legacyId
  }

  if (isRecord(params.payload)) {
    eventType =
      normalizeString(params.payload['action']) ??
      normalizeString(params.payload['type'])
    providerEventId = normalizeNumberToString(params.payload['id'])
  }

  const isLegacyPaymentFeed =
    webhookTopic === 'payment' &&
    (normalizeString(params.requestUrl.searchParams.get('topic')) ?? '')
      .toLowerCase()
      .trim() === 'payment' &&
    isRecord(params.payload) &&
    normalizeString(params.payload['resource']) !== null &&
    normalizeString(params.payload['action']) === null &&
    normalizeString(params.payload['type']) === null

  if (!eventType) {
    if (webhookTopic === 'payment') {
      eventType = isLegacyPaymentFeed
        ? 'payment.legacy_feed'
        : 'payment.webhook'
    } else if (webhookTopic === 'merchant_order') {
      eventType = 'merchant_order.webhook'
    }
  }

  if (!providerEventId) providerEventId = normalizeString(params.requestId)

  return {
    webhookTopic,
    isLegacyPaymentFeed,
    eventType,
    providerEventId,
    providerResourceId,
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

async function safeMarkWebhookEvent(params: {
  eventId: string | null
  processed: boolean
  processingError?: string | null
  paymentId?: string | null
}) {
  if (!params.eventId) return
  try {
    await markWebhookEvent({
      eventId: params.eventId,
      processed: params.processed,
      processingError: params.processingError,
      paymentId: params.paymentId,
    })
  } catch (error) {
    logError('failed to update payment_webhook_events', {
      eventId: params.eventId,
      error: extractErrorMessage(error, 'unknown_error'),
    })
  }
}

function extractPaymentFields(payment: unknown): {
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
  dateApproved: string | null
  transactionAmount: number | null
  payerEmail: string | null
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
      dateApproved: null,
      transactionAmount: null,
      payerEmail: null,
    }
  }

  const order = isRecord(payment['order'])
    ? (payment['order'] as Record<string, unknown>)
    : null
  const payer = isRecord(payment['payer'])
    ? (payment['payer'] as Record<string, unknown>)
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
    dateApproved: normalizeString(payment['date_approved']),
    transactionAmount: normalizeNumber(payment['transaction_amount']),
    payerEmail: normalizeString(payer?.['email']),
  }
}

async function findInternalPaymentId(params: {
  externalReference: string | null
  mercadoPagoPaymentId: string | null
  preferenceId: string | null
}): Promise<string | null> {
  if (params.externalReference) {
    const { data } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('id', params.externalReference)
      .eq('provider', MERCADO_PAGO_PROVIDER)
      .maybeSingle()
    if (data?.id) return String(data.id)
  }

  if (params.mercadoPagoPaymentId) {
    const { data } = await supabaseAdmin
      .from('mercadopago_payments')
      .select('payment_id')
      .eq('mercadopago_payment_id', params.mercadoPagoPaymentId)
      .maybeSingle()
    if (data?.payment_id) return String(data.payment_id)
  }

  if (params.preferenceId) {
    const { data } = await supabaseAdmin
      .from('mercadopago_payments')
      .select('payment_id')
      .eq('preference_id', params.preferenceId)
      .maybeSingle()
    if (data?.payment_id) return String(data.payment_id)
  }

  return null
}

async function persistEvent(context: Context): Promise<{
  eventId: string | null
  duplicateProcessed: boolean
}> {
  const { providerEventId, providerResourceId, eventType } = context.metadata

  if (providerEventId) {
    const { data } = await supabaseAdmin
      .from('payment_webhook_events')
      .select('id,processed')
      .eq('provider', MERCADO_PAGO_PROVIDER)
      .eq('provider_event_id', providerEventId)
      .eq('processed', true)
      .limit(1)
      .maybeSingle()
    if (data?.id) {
      return { eventId: String(data.id), duplicateProcessed: true }
    }
  }

  const payloadToStore: Record<string, unknown> = { ...context.payload }
  if (context.payloadParseError) {
    payloadToStore['_parse_error'] = context.payloadParseError
    payloadToStore['_raw_body'] = context.rawBody
  }

  const { data, error } = await supabaseAdmin
    .from('payment_webhook_events')
    .insert({
      provider: MERCADO_PAGO_PROVIDER,
      event_type: eventType,
      provider_event_id: providerEventId,
      provider_resource_id: providerResourceId,
      signature_valid: context.signature ? context.signature.signatureValid : null,
      processed: false,
      payload: payloadToStore,
      headers: context.headers,
      query_params: context.queryParams,
    })
    .select('id')
    .maybeSingle()

  if (error) {
    if (isDuplicateError(error)) {
      const { data: existing } = await supabaseAdmin
        .from('payment_webhook_events')
        .select('id,processed')
        .eq('provider', MERCADO_PAGO_PROVIDER)
        .eq('provider_event_id', providerEventId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return {
        eventId: normalizeNumberToString(existing?.id),
        duplicateProcessed: Boolean(existing?.processed),
      }
    }

    logError('failed to insert payment_webhook_events', {
      providerEventId,
      providerResourceId,
      error: extractErrorMessage(error, 'unknown_error'),
    })
    return { eventId: null, duplicateProcessed: false }
  }

  return {
    eventId: normalizeNumberToString(data?.id),
    duplicateProcessed: false,
  }
}

function signatureIssue(signature: SignatureValidation | null): string {
  if (!signature) return 'signature_not_checked'
  if (signature.reason === 'missing_secret') return 'missing_secret'
  if (signature.reason === 'missing_signature') return 'missing_x_signature'
  if (signature.reason === 'missing_manifest') return 'missing_manifest'
  if (signature.reason === 'signature_mismatch') return 'signature_mismatch'
  return 'ok'
}

async function processWebhook(context: Context) {
  const startMs = Date.now()
  const warnings: string[] = []
  const { metadata } = context

  let eventId: string | null = null
  try {
    const persisted = await persistEvent(context)
    eventId = persisted.eventId

    if (persisted.duplicateProcessed) {
      logInfo('duplicate webhook already processed', {
        eventId,
        providerEventId: metadata.providerEventId,
      })
      return
    }

    if (metadata.webhookTopic === 'merchant_order') {
      await safeMarkWebhookEvent({
        eventId,
        processed: true,
        processingError: 'merchant_order ignored',
      })
      logInfo('merchant_order ignored', {
        eventId,
        providerEventId: metadata.providerEventId,
      })
      return
    }

    if (metadata.isLegacyPaymentFeed || metadata.webhookTopic !== 'payment') {
      await safeMarkWebhookEvent({
        eventId,
        processed: true,
        processingError: 'unsupported_or_legacy_topic_ignored',
      })
      return
    }

    if (context.shouldValidateSignature) {
      const valid = context.signature?.signatureValid ?? false
      if (!valid && context.hasWebhookSecret) {
        await safeMarkWebhookEvent({
          eventId,
          processed: true,
          processingError: `invalid_signature:${signatureIssue(context.signature)}`,
        })
        logWarn('invalid signature, webhook ignored', {
          eventId,
          providerEventId: metadata.providerEventId,
          reason: signatureIssue(context.signature),
        })
        return
      }
      if (!valid && !context.hasWebhookSecret) {
        warnings.push('signature_validation_skipped_no_secret')
      }
    }

    if (!metadata.providerResourceId) {
      await safeMarkWebhookEvent({
        eventId,
        processed: true,
        processingError: 'missing_provider_resource_id',
      })
      return
    }

    const paymentClient = createMercadoPagoPaymentClient()
    const remotePayment = await paymentClient.get({ id: metadata.providerResourceId })
    const fields = extractPaymentFields(remotePayment)
    const canonicalMpStatus = normalizeMercadoPagoCanonicalStatus(fields.mpStatus)

    const paymentId = await findInternalPaymentId({
      externalReference: fields.externalReference,
      mercadoPagoPaymentId: fields.mercadoPagoPaymentId,
      preferenceId: fields.preferenceId,
    })

    if (!paymentId) {
      await safeMarkWebhookEvent({
        eventId,
        processed: true,
        processingError: 'internal_payment_not_found',
      })
      return
    }

    const { data: paymentData, error: paymentErr } = await supabaseAdmin
      .from('payments')
      .select('id,provider,status,purpose,application_id,program_id,paid_at')
      .eq('id', paymentId)
      .eq('provider', MERCADO_PAGO_PROVIDER)
      .maybeSingle()

    if (paymentErr || !paymentData) {
      await safeMarkWebhookEvent({
        eventId,
        processed: true,
        paymentId,
        processingError: 'canonical_payment_not_found',
      })
      return
    }

    const paymentRow = paymentData as PaymentRow
    const mappedStatus = mapMercadoPagoStatusToPaymentStatus(fields.mpStatus)
    const nextStatus: KnownPaymentStatus =
      paymentRow.status === 'paid' && mappedStatus === 'pending'
        ? 'paid'
        : mappedStatus
    const nowIso = new Date().toISOString()
    const approvedAt = fields.dateApproved ?? nowIso

    const { data: existingMp } = await supabaseAdmin
      .from('mercadopago_payments')
      .select(
        'preference_id,mercadopago_payment_id,merchant_order_id,external_reference,mp_status,status_detail,payment_type,payment_method,installments,live_mode,raw_preference_response'
      )
      .eq('payment_id', paymentRow.id)
      .maybeSingle()

    const existing = isRecord(existingMp) ? existingMp : null
    const rawPreference = isRecord(existing?.['raw_preference_response'])
      ? (existing['raw_preference_response'] as Record<string, unknown>)
      : null

    const { error: upsertErr } = await supabaseAdmin.from('mercadopago_payments').upsert(
      {
        payment_id: paymentRow.id,
        preference_id:
          fields.preferenceId ??
          normalizeString(existing?.['preference_id']) ??
          normalizeString(rawPreference?.['id']) ??
          normalizeNumberToString(rawPreference?.['id']) ??
          null,
        mercadopago_payment_id:
          fields.mercadoPagoPaymentId ??
          normalizeString(existing?.['mercadopago_payment_id']) ??
          null,
        merchant_order_id:
          fields.merchantOrderId ??
          normalizeString(existing?.['merchant_order_id']) ??
          null,
        external_reference:
          fields.externalReference ??
          normalizeString(existing?.['external_reference']) ??
          paymentRow.id,
        mp_status: fields.mpStatus ?? normalizeString(existing?.['mp_status']) ?? null,
        status_detail:
          fields.statusDetail ?? normalizeString(existing?.['status_detail']) ?? null,
        payment_type:
          fields.paymentType ?? normalizeString(existing?.['payment_type']) ?? null,
        payment_method:
          fields.paymentMethod ?? normalizeString(existing?.['payment_method']) ?? null,
        installments:
          fields.installments ?? normalizeNumber(existing?.['installments']) ?? null,
        live_mode: fields.liveMode ?? normalizeBoolean(existing?.['live_mode']) ?? null,
        last_webhook_at: nowIso,
        last_synced_at: nowIso,
        raw_payment_response: remotePayment,
      },
      { onConflict: 'payment_id' }
    )

    if (upsertErr) {
      warnings.push(`mercadopago_payments_upsert_error:${extractErrorMessage(upsertErr, 'unknown_error')}`)
    }

    const paymentUpdate: Record<string, unknown> = { status: nextStatus }
    if (nextStatus === 'paid' && !paymentRow.paid_at) paymentUpdate['paid_at'] = approvedAt
    if (nextStatus === 'paid') paymentUpdate['error_message'] = null
    if (nextStatus === 'failed' || nextStatus === 'canceled') {
      paymentUpdate['error_message'] = fields.statusDetail ?? fields.mpStatus
    }

    const { error: paymentUpdateErr } = await supabaseAdmin
      .from('payments')
      .update(paymentUpdate)
      .eq('id', paymentRow.id)
      .eq('provider', MERCADO_PAGO_PROVIDER)

    if (paymentUpdateErr) {
      await safeMarkWebhookEvent({
        eventId,
        processed: true,
        paymentId: paymentRow.id,
        processingError: `payments_update_error:${extractErrorMessage(paymentUpdateErr, 'unknown_error')}`,
      })
      return
    }

    if (paymentRow.application_id && paymentRow.purpose === 'tuition') {
      const appUpdate: Record<string, unknown> = { payment_status: nextStatus }
      if (nextStatus === 'paid') {
        appUpdate['paid_at'] = approvedAt
        const { data: programData } = await supabaseAdmin
          .from('programs')
          .select('id,payment_mode,requires_payment_pre')
          .eq('id', paymentRow.program_id)
          .maybeSingle()
        const program = (programData as ProgramRowSummary | null) ?? null
        if (resolvePaymentMode(program) === 'post') appUpdate['status'] = 'enrolled'
      }
      const { error: appErr } = await supabaseAdmin
        .from('applications')
        .update(appUpdate)
        .eq('id', paymentRow.application_id)
      if (appErr) {
        warnings.push(`applications_update_error:${extractErrorMessage(appErr, 'unknown_error')}`)
      }
    }

    await safeMarkWebhookEvent({
      eventId,
      processed: true,
      paymentId: paymentRow.id,
      processingError: warnings.length > 0 ? warnings.join(' | ') : null,
    })

    logInfo('payment webhook processed', {
      eventId,
      providerEventId: metadata.providerEventId,
      providerResourceId: metadata.providerResourceId,
      paymentId: paymentRow.id,
      externalReference: fields.externalReference,
      canonicalMpStatus,
      localStatus: nextStatus,
      statusDetail: fields.statusDetail,
      payerEmail: fields.payerEmail,
      transactionAmount: fields.transactionAmount,
      dateApproved: fields.dateApproved,
      durationMs: Date.now() - startMs,
      warningCount: warnings.length,
    })
  } catch (error) {
    await safeMarkWebhookEvent({
      eventId,
      processed: true,
      processingError: `unhandled_error:${extractErrorMessage(error, 'unknown_error')}`,
    })
    logError('unhandled error while processing webhook', {
      eventId,
      providerEventId: metadata.providerEventId,
      providerResourceId: metadata.providerResourceId,
      error: extractErrorMessage(error, 'unknown_error'),
    })
  }
}

function ack() {
  return NextResponse.json({ ok: true, accepted: true }, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const requestId = request.headers.get('x-request-id')
    const rawBody = await request.text()
    const parsed = parsePayload(rawBody)
    const metadata = resolveMetadata({
      payload: parsed.payload,
      requestUrl,
      requestId,
    })

    const runtimeDebug = getMercadoPagoRuntimeDebugInfo()
    const webhookSecrets = getMercadoPagoWebhookSecretsForValidation()
    const shouldValidateSignature =
      metadata.webhookTopic === 'payment' && !metadata.isLegacyPaymentFeed

    let signature: SignatureValidation | null = null
    if (shouldValidateSignature) {
      signature = buildSignatureValidation({
        request,
        requestUrl,
        payload: parsed.payload,
        providerResourceId: metadata.providerResourceId,
        webhookSecrets,
      })
    }

    const context: Context = {
      requestMethod: request.method,
      requestPath: requestUrl.pathname,
      requestId,
      queryParams: snapshotQueryParams(requestUrl),
      headers: snapshotHeaders(request),
      payload: parsed.payload,
      payloadParseError: parsed.parseError,
      rawBody,
      metadata,
      signature,
      shouldValidateSignature,
      hasWebhookSecret: runtimeDebug.hasWebhookSecret,
    }

    logInfo('incoming webhook accepted', {
      requestMethod: context.requestMethod,
      requestPath: context.requestPath,
      requestId: context.requestId,
      eventType: metadata.eventType,
      webhookTopic: metadata.webhookTopic,
      providerEventId: metadata.providerEventId,
      providerResourceId: metadata.providerResourceId,
      signatureValid: signature?.signatureValid ?? null,
      signatureReason: signature?.reason ?? null,
      payloadParseError: context.payloadParseError,
      hasWebhookSecret: context.hasWebhookSecret,
    })

    after(async () => {
      await processWebhook(context)
    })

    return ack()
  } catch (error) {
    logError('exception before ack, returning safe 200', {
      error: extractErrorMessage(error, 'unknown_error'),
    })
    return ack()
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  logInfo('webhook GET reached', {
    requestPath: requestUrl.pathname,
    queryParams: snapshotQueryParams(requestUrl),
  })
  return NextResponse.json({ ok: true, method: 'GET' }, { status: 200 })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { Allow: 'POST,GET,OPTIONS' },
  })
}
