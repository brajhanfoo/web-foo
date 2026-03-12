import { NextRequest, NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  createMercadoPagoPaymentClient,
  getMercadoPagoRuntimeDebugInfo,
  getMercadoPagoWebhookSecret,
  resolveMercadoPagoWebhookTopic,
  mapMercadoPagoStatusToPaymentStatus,
  resolveMercadoPagoDataId,
  validateMercadoPagoSignature,
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
  const out: Record<string, string> = {}
  for (const [key, value] of request.headers.entries()) out[key] = value
  return out
}

function snapshotQueryParams(requestUrl: URL): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of requestUrl.searchParams.entries()) out[key] = value
  return out
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

  const queryLegacyId = normalizeString(params.requestUrl.searchParams.get('id'))
  if (!providerResourceId && webhookTopic === 'merchant_order' && queryLegacyId) {
    providerResourceId = queryLegacyId
  }

  if (isRecord(params.payload)) {
    const action = normalizeString(params.payload['action'])
    const type = normalizeString(params.payload['type'])
    eventType = action ?? type
    providerEventId = normalizeNumberToString(params.payload['id'])
  }

  if (!eventType) {
    if (webhookTopic === 'payment') eventType = 'payment.webhook'
    if (webhookTopic === 'merchant_order') eventType = 'merchant_order.webhook'
  }

  if (!providerEventId) {
    providerEventId = normalizeString(params.requestIdHeader)
  }

  return { webhookTopic, eventType, providerEventId, providerResourceId }
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
  const { webhookTopic, eventType, providerEventId, providerResourceId } =
    webhookMetadata

  let webhookSecret = ''
  try {
    const runtimeDebug = getMercadoPagoRuntimeDebugInfo()
    webhookSecret = getMercadoPagoWebhookSecret()
    console.info('[MercadoPago][webhook] runtime', {
      env: runtimeDebug.env,
      hasAccessToken: runtimeDebug.hasAccessToken,
      hasWebhookSecret: runtimeDebug.hasWebhookSecret,
      baseUrl: runtimeDebug.baseUrl,
      webhookTopic,
      providerEventId,
      providerResourceId,
    })
  } catch (error) {
    const message = extractErrorMessage(
      error,
      "MERCADOPAGO_ENV debe ser 'test' o 'production'."
    )
    console.error('[MercadoPago][webhook] invalid environment config', {
      message,
    })
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }

  const signature = validateMercadoPagoSignature({
    signatureHeader: request.headers.get('x-signature'),
    requestIdHeader: request.headers.get('x-request-id'),
    dataId: providerResourceId,
    secret: webhookSecret,
  })

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
      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 })
    }
  }

  const { data: insertedEvent, error: insertEventErr } = await supabaseAdmin
    .from('payment_webhook_events')
    .insert({
      provider: MERCADO_PAGO_PROVIDER,
      event_type: eventType,
      provider_event_id: providerEventId,
      provider_resource_id: providerResourceId,
      signature_valid: signature.signatureValid,
      processed: false,
      payload: payload,
      headers: snapshotHeaders(request),
      query_params: snapshotQueryParams(requestUrl),
    })
    .select('id')
    .maybeSingle()

  if (insertEventErr) {
    if (isDuplicateError(insertEventErr)) {
      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 })
    }
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const eventId = String(insertedEvent?.id ?? '')
  if (!eventId) return NextResponse.json({ ok: true }, { status: 200 })

  if (webhookTopic === 'merchant_order') {
    await markWebhookEvent({
      eventId,
      processed: true,
      processingError:
        'Evento merchant_order ignorado para cierre de pagos canonicos.',
    })
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 })
  }

  if (webhookTopic !== 'payment') {
    await markWebhookEvent({
      eventId,
      processed: true,
      processingError: 'Evento webhook no soportado para procesamiento.',
    })
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 })
  }

  if (!signature.signatureValid) {
    await markWebhookEvent({
      eventId,
      processed: true,
      processingError:
        'Firma invalida en webhook de Mercado Pago. Revisa MERCADOPAGO_WEBHOOK_SECRET y MERCADOPAGO_ENV.',
    })
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  if (!providerResourceId) {
    await markWebhookEvent({
      eventId,
      processed: true,
      processingError: 'Webhook de payment recibido sin id de recurso.',
    })
    return NextResponse.json({ ok: true }, { status: 200 })
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
    return NextResponse.json({ ok: true }, { status: 200 })
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
    return NextResponse.json({ ok: true }, { status: 200 })
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
    return NextResponse.json({ ok: true }, { status: 200 })
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
    processingError: null,
  })

  return NextResponse.json({ ok: true }, { status: 200 })
}
