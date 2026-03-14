import { NextRequest, NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  buildMercadoPagoUrls,
  createMercadoPagoPreferenceClient,
  getMercadoPagoPublicKey,
} from '@/lib/payments/mercadopago'
import { createClient } from '@/lib/supabase/server'
import type { PaymentProvider, PaymentStatus } from '@/types/payments'
import type { ProgramPaymentMode, ProgramRow } from '@/types/programs'

export const runtime = 'nodejs'

const DEFAULT_CURRENCY = 'USD'
const MERCADO_PAGO_PROVIDER: PaymentProvider = 'mercado_pago'

type PaymentPurpose = 'pre_enrollment' | 'tuition'
type CreatePreferenceInput = {
  programId: string
  editionId: string | null
  purpose: PaymentPurpose
  applicationId: string | null
  amountCents: number
}

type CreatePreferenceResponse = {
  ok: boolean
  message?: string
  paymentId?: string
  status?: PaymentStatus
  alreadyPaid?: boolean
  preferenceId?: string
  initPoint?: string
  sandboxInitPoint?: string
  publicKey?: string
}

type ProgramRowSummary = Pick<
  ProgramRow,
  | 'id'
  | 'title'
  | 'slug'
  | 'description'
  | 'payment_mode'
  | 'requires_payment_pre'
  | 'price_usd'
>

type ApplicationRow = {
  id: string
  applicant_profile_id: string
  program_id: string
  edition_id: string | null
}

type PaymentRow = {
  id: string
  status: PaymentStatus
  edition_id: string | null
  provider: PaymentProvider
}

type ProfileRowSummary = {
  first_name: string | null
  last_name: string | null
  email: string | null
  whatsapp_e164: string | null
  document_number: string | null
  country_residence: string | null
}

type MercadoPagoPayer = {
  first_name?: string
  last_name?: string
  email?: string
  identification?: {
    type: string
    number: string
  }
  phone?: {
    area_code: string
    number: string
  }
}

type MercadoPagoUrls = {
  success: string
  failure: string
  pending: string
  notification: string
}

const MERCADO_PAGO_CATEGORY_ID = 'services'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const t = v.trim()
    if (!t) return null
    const n = Number(t)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function parseInput(body: unknown): CreatePreferenceInput | null {
  if (!isRecord(body)) return null

  const programId = asString(body['programId'])
  const editionIdRaw = asString(body['editionId'])
  const purposeRaw = asString(body['purpose'])
  const applicationIdRaw = asString(body['applicationId'])
  const amountCentsValue = asNumber(body['amountCents'])

  if (!programId || !purposeRaw || amountCentsValue === null) return null
  if (purposeRaw !== 'pre_enrollment' && purposeRaw !== 'tuition') return null

  const amountCents = Math.round(amountCentsValue)
  if (!Number.isFinite(amountCents) || amountCents <= 0) return null

  return {
    programId,
    editionId: editionIdRaw || null,
    purpose: purposeRaw,
    applicationId: applicationIdRaw || null,
    amountCents,
  }
}

function parseAbsoluteUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

function isLocalHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase()
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized.endsWith('.local')
  )
}

function validateMercadoPagoUrls(urls: MercadoPagoUrls): string | null {
  const entries: Array<[keyof MercadoPagoUrls, string]> = [
    ['success', urls.success],
    ['failure', urls.failure],
    ['pending', urls.pending],
    ['notification', urls.notification],
  ]

  for (const [name, value] of entries) {
    const parsed = parseAbsoluteUrl(value)
    if (!parsed) {
      return `La URL ${name} de Mercado Pago no es valida.`
    }

    if (parsed.protocol !== 'https:') {
      return `La URL ${name} de Mercado Pago debe usar https.`
    }

    if (isLocalHost(parsed.hostname)) {
      return `La URL ${name} de Mercado Pago no puede apuntar a localhost.`
    }
  }

  return null
}

function extractErrorMessage(error: unknown): string | null {
  if (typeof error === 'string') {
    const normalized = error.trim()
    return normalized || null
  }

  if (error instanceof Error) {
    const normalized = error.message.trim()
    return normalized || null
  }

  if (!isRecord(error)) return null

  const direct = asString(error['message'])
  if (direct) return direct

  const cause = error['cause']
  if (isRecord(cause)) {
    const causeMessage = asString(cause['message'])
    if (causeMessage) return causeMessage
  }

  return null
}

function resolvePaymentMode(program: ProgramRowSummary): ProgramPaymentMode {
  if (program.payment_mode) return program.payment_mode
  return program.requires_payment_pre ? 'pre' : 'none'
}

function parsePriceToCents(priceUsd: string | number | null): number | null {
  if (!priceUsd) return null
  const parsed = Number(priceUsd)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed * 100)
}

function buildPreferenceTitle(params: {
  purpose: PaymentPurpose
  programTitle: string
  programSlug: string
}): string {
  const kind =
    params.purpose === 'pre_enrollment' ? 'Pre-inscripción' : 'Matrícula'
  const title = params.programTitle.trim() || params.programSlug.trim()
  return `${kind} ${title}`.trim().slice(0, 120)
}

function normalizeWhitespace(value: string | null | undefined): string | null {
  if (!value) return null
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized || null
}

function normalizeEmail(value: string | null | undefined): string | null {
  const normalized = normalizeWhitespace(value)
  if (!normalized) return null
  if (!normalized.includes('@')) return null
  return normalized
}

function normalizeCountryKey(value: string | null | undefined): string | null {
  const normalized = normalizeWhitespace(value)
  if (!normalized) return null

  return normalized
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function resolveCountryCallingCode(
  countryResidence: string | null | undefined
): string | null {
  const key = normalizeCountryKey(countryResidence)
  if (!key) return null

  const mapping: Record<string, string> = {
    argentina: '54',
    bolivia: '591',
    brasil: '55',
    brazil: '55',
    chile: '56',
    colombia: '57',
    ecuador: '593',
    espana: '34',
    mexico: '52',
    peru: '51',
    uruguay: '598',
    'estados unidos': '1',
    usa: '1',
    'united states': '1',
  }

  return mapping[key] ?? null
}

function resolvePayerPhone(params: {
  whatsappE164: string | null | undefined
  countryResidence: string | null | undefined
}): MercadoPagoPayer['phone'] | null {
  const rawPhone = normalizeWhitespace(params.whatsappE164)
  if (!rawPhone) return null
  if (!rawPhone.startsWith('+')) return null

  const digits = rawPhone.replace(/[^\d]/g, '')
  if (!digits || digits.length < 8 || digits.length > 15) return null

  const callingCode = resolveCountryCallingCode(params.countryResidence)
  if (!callingCode || !digits.startsWith(callingCode)) return null

  const number = digits.slice(callingCode.length)
  if (!number || number.length < 6) return null

  return {
    area_code: callingCode,
    number,
  }
}

function normalizeDocumentNumber(value: string | null | undefined): string | null {
  const normalized = normalizeWhitespace(value)
  if (!normalized) return null

  const compact = normalized.replace(/[^\dA-Za-z]/g, '')
  return compact || null
}

function resolvePayerIdentification(params: {
  documentNumber: string | null | undefined
  countryResidence: string | null | undefined
}): MercadoPagoPayer['identification'] | null {
  const number = normalizeDocumentNumber(params.documentNumber)
  if (!number) return null

  const countryKey = normalizeCountryKey(params.countryResidence)
  if (!countryKey) return null

  if (countryKey !== 'argentina' && countryKey !== 'peru') {
    return null
  }

  return {
    type: 'DNI',
    number,
  }
}

function buildMercadoPagoPayer(params: {
  profile: ProfileRowSummary | null
  authEmail: string | null
}): MercadoPagoPayer | undefined {
  const firstName = normalizeWhitespace(params.profile?.first_name)
  const lastName = normalizeWhitespace(params.profile?.last_name)
  const email =
    normalizeEmail(params.profile?.email) ?? normalizeEmail(params.authEmail)
  const phone = resolvePayerPhone({
    whatsappE164: params.profile?.whatsapp_e164,
    countryResidence: params.profile?.country_residence,
  })
  const identification = resolvePayerIdentification({
    documentNumber: params.profile?.document_number,
    countryResidence: params.profile?.country_residence,
  })

  const payer: MercadoPagoPayer = {}
  if (firstName) payer.first_name = firstName
  if (lastName) payer.last_name = lastName
  if (email) payer.email = email
  if (identification) payer.identification = identification
  if (phone) payer.phone = phone

  return Object.keys(payer).length > 0 ? payer : undefined
}

function buildPreferenceItemId(params: {
  purpose: PaymentPurpose
  programId: string
  applicationId: string | null
}): string {
  if (params.purpose === 'pre_enrollment') {
    return `pre_enrollment:${params.programId}`
  }

  return `tuition:${params.programId}:${params.applicationId ?? 'no_application'}`
}

function buildPreferenceDescription(params: {
  purpose: PaymentPurpose
  programTitle: string
  programDescription: string | null
}): string {
  const cleanProgramTitle = params.programTitle.trim() || 'programa'
  const base =
    params.purpose === 'pre_enrollment'
      ? `Pre-inscripcion al programa ${cleanProgramTitle}.`
      : `Matricula del programa ${cleanProgramTitle}.`

  const cleanProgramDescription = normalizeWhitespace(params.programDescription)
  if (!cleanProgramDescription) return base

  const enriched = `${base} ${cleanProgramDescription}`
  return enriched.slice(0, 240)
}

function pickString(raw: unknown, key: string): string | null {
  if (!isRecord(raw)) return null
  const value = raw[key]
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function pickStringOrNumber(raw: unknown, key: string): string | null {
  if (!isRecord(raw)) return null
  const value = raw[key]
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return null
}

function buildPreferenceBody(params: {
  purpose: PaymentPurpose
  amountCents: number
  paymentId: string
  programId: string
  applicationId: string | null
  programTitle: string
  programDescription: string | null
  programSlug: string
  payer?: MercadoPagoPayer
  urls: {
    success: string
    failure: string
    pending: string
    notification: string
  }
}): Record<string, unknown> {
  return {
    items: [
      {
        id: buildPreferenceItemId({
          purpose: params.purpose,
          programId: params.programId,
          applicationId: params.applicationId,
        }),
        title: buildPreferenceTitle({
          purpose: params.purpose,
          programTitle: params.programTitle,
          programSlug: params.programSlug,
        }),
        description: buildPreferenceDescription({
          purpose: params.purpose,
          programTitle: params.programTitle,
          programDescription: params.programDescription,
        }),
        category_id: MERCADO_PAGO_CATEGORY_ID,
        quantity: 1,
        currency_id: DEFAULT_CURRENCY,
        unit_price: params.amountCents / 100,
      },
    ],
    external_reference: params.paymentId,
    back_urls: {
      success: params.urls.success,
      failure: params.urls.failure,
      pending: params.urls.pending,
    },
    auto_return: 'approved',
    notification_url: params.urls.notification,
    ...(params.payer ? { payer: params.payer } : {}),
  }
}

async function findExistingPaid(params: {
  userId: string
  programId: string
  editionId: string | null
  purpose: PaymentPurpose
}): Promise<PaymentRow | null> {
  let q = supabaseAdmin
    .from('payments')
    .select('id,status,edition_id,provider')
    .eq('user_id', params.userId)
    .eq('program_id', params.programId)
    .eq('purpose', params.purpose)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(1)

  q = params.editionId
    ? q.eq('edition_id', params.editionId)
    : q.is('edition_id', null)

  const { data, error } = await q.maybeSingle()
  if (error || !data) return null
  return data as PaymentRow
}

async function findReusableOpen(params: {
  userId: string
  programId: string
  editionId: string | null
  purpose: PaymentPurpose
  provider: PaymentProvider
}): Promise<PaymentRow | null> {
  let q = supabaseAdmin
    .from('payments')
    .select('id,status,edition_id,provider')
    .eq('user_id', params.userId)
    .eq('program_id', params.programId)
    .eq('purpose', params.purpose)
    .eq('provider', params.provider)
    .in('status', ['initiated', 'pending'])
    .order('created_at', { ascending: false })
    .limit(1)

  q = params.editionId
    ? q.eq('edition_id', params.editionId)
    : q.is('edition_id', null)

  const { data, error } = await q.maybeSingle()
  if (error || !data) return null
  return data as PaymentRow
}

async function findOpenOtherProvider(params: {
  userId: string
  programId: string
  editionId: string | null
  purpose: PaymentPurpose
  provider: PaymentProvider
}): Promise<PaymentRow | null> {
  let q = supabaseAdmin
    .from('payments')
    .select('id,status,edition_id,provider')
    .eq('user_id', params.userId)
    .eq('program_id', params.programId)
    .eq('purpose', params.purpose)
    .neq('provider', params.provider)
    .in('status', ['initiated', 'pending'])
    .order('created_at', { ascending: false })
    .limit(1)

  q = params.editionId
    ? q.eq('edition_id', params.editionId)
    : q.is('edition_id', null)

  const { data, error } = await q.maybeSingle()
  if (error || !data) return null
  return data as PaymentRow
}

function isMissingCheckoutUrlColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const message = String((error as { message?: unknown }).message ?? '')
    .trim()
    .toLowerCase()
  return message.includes('checkout_url')
}

async function updatePaymentPendingWithOptionalCheckout(params: {
  paymentId: string
  checkoutUrl: string
}) {
  const firstTry = await supabaseAdmin
    .from('payments')
    .update({
      status: 'pending',
      checkout_url: params.checkoutUrl,
    })
    .eq('id', params.paymentId)
    .eq('provider', MERCADO_PAGO_PROVIDER)

  if (!firstTry.error) return { error: null as unknown }
  if (!isMissingCheckoutUrlColumn(firstTry.error)) return firstTry

  const fallback = await supabaseAdmin
    .from('payments')
    .update({ status: 'pending' })
    .eq('id', params.paymentId)
    .eq('provider', MERCADO_PAGO_PROVIDER)

  return fallback
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreatePreferenceResponse>> {
  const supabaseServer = await createClient()
  const { data: userRes, error: userErr } = await supabaseServer.auth.getUser()

  if (userErr || !userRes.user) {
    return NextResponse.json(
      { ok: false, message: 'No autenticado' },
      { status: 401 }
    )
  }

  let payload: CreatePreferenceInput | null = null
  try {
    payload = parseInput((await request.json()) as unknown)
  } catch {
    payload = null
  }

  if (!payload) {
    return NextResponse.json(
      { ok: false, message: 'Payload inválido' },
      { status: 400 }
    )
  }

  const { programId, editionId, purpose, applicationId, amountCents } = payload
  const userId = userRes.user.id

  const { data: programRow, error: programErr } = await supabaseAdmin
    .from('programs')
    .select(
      'id, title, slug, description, payment_mode, requires_payment_pre, price_usd'
    )
    .eq('id', programId)
    .maybeSingle()

  if (programErr || !programRow) {
    return NextResponse.json(
      { ok: false, message: 'Programa no encontrado' },
      { status: 404 }
    )
  }

  const program = programRow as ProgramRowSummary
  const paymentMode = resolvePaymentMode(program)

  const { data: profileRow } = await supabaseAdmin
    .from('profiles')
    .select(
      'first_name,last_name,email,whatsapp_e164,document_number,country_residence'
    )
    .eq('id', userId)
    .maybeSingle()

  const profile = (profileRow as ProfileRowSummary | null) ?? null

  if (purpose === 'pre_enrollment' && paymentMode !== 'pre') {
    return NextResponse.json(
      { ok: false, message: 'El programa no requiere pago previo' },
      { status: 400 }
    )
  }

  if (purpose === 'tuition') {
    if (!applicationId) {
      return NextResponse.json(
        { ok: false, message: 'Falta applicationId' },
        { status: 400 }
      )
    }
    if (paymentMode !== 'post') {
      return NextResponse.json(
        { ok: false, message: 'El programa no usa pago posterior' },
        { status: 400 }
      )
    }
  }

  const expectedCents = parsePriceToCents(program.price_usd)
  if (expectedCents !== null && expectedCents !== amountCents) {
    return NextResponse.json(
      { ok: false, message: 'El monto no coincide con el precio del programa' },
      { status: 400 }
    )
  }

  let resolvedEditionId = editionId

  if (applicationId) {
    const { data: appRow, error: appErr } = await supabaseServer
      .from('applications')
      .select('id, applicant_profile_id, program_id, edition_id')
      .eq('id', applicationId)
      .maybeSingle()

    if (appErr || !appRow) {
      return NextResponse.json(
        { ok: false, message: 'Postulación no encontrada' },
        { status: 404 }
      )
    }

    const application = appRow as ApplicationRow
    if (application.applicant_profile_id !== userId) {
      return NextResponse.json(
        { ok: false, message: 'Sin permisos para esta postulación' },
        { status: 403 }
      )
    }
    if (application.program_id !== programId) {
      return NextResponse.json(
        { ok: false, message: 'Programa no coincide con la postulación' },
        { status: 400 }
      )
    }

    resolvedEditionId = resolvedEditionId ?? application.edition_id ?? null
  }

  const existingPaid = await findExistingPaid({
    userId,
    programId,
    editionId: resolvedEditionId,
    purpose,
  })

  if (existingPaid) {
    return NextResponse.json(
      {
        ok: true,
        paymentId: existingPaid.id,
        status: 'paid',
        alreadyPaid: true,
      },
      { status: 200 }
    )
  }

  const urls = buildMercadoPagoUrls()
  if (!urls) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Configura NEXT_PUBLIC_SITE_URL para poder construir back_urls y notification_url.',
      },
      { status: 500 }
    )
  }

  const urlsValidationError = validateMercadoPagoUrls(urls)
  if (urlsValidationError) {
    return NextResponse.json(
      {
        ok: false,
        message: `${urlsValidationError} Configura NEXT_PUBLIC_SITE_URL con un dominio publico HTTPS (ej: tunel ngrok o URL de Vercel).`,
      },
      { status: 500 }
    )
  }

  const openOtherProvider = await findOpenOtherProvider({
    userId,
    programId,
    editionId: resolvedEditionId,
    purpose,
    provider: MERCADO_PAGO_PROVIDER,
  })

  if (openOtherProvider) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Ya existe un pago pendiente con otro proveedor para este concepto.',
      },
      { status: 409 }
    )
  }

  const openRow = await findReusableOpen({
    userId,
    programId,
    editionId: resolvedEditionId,
    purpose,
    provider: MERCADO_PAGO_PROVIDER,
  })

  if (openRow) {
    await supabaseAdmin
      .from('payments')
      .update({ status: 'canceled' })
      .eq('id', openRow.id)
      .eq('provider', MERCADO_PAGO_PROVIDER)
  }

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('payments')
    .insert({
      user_id: userId,
      provider: MERCADO_PAGO_PROVIDER,
      program_id: programId,
      edition_id: resolvedEditionId,
      application_id: applicationId,
      purpose,
      status: 'initiated',
      amount_cents: amountCents,
      currency: DEFAULT_CURRENCY,
      client_transaction_id: null,
    })
    .select('id')
    .maybeSingle()

  if (insertErr || !inserted?.id) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo iniciar el pago' },
      { status: 500 }
    )
  }

  const paymentId = inserted.id as string

  try {
    const preferenceClient = createMercadoPagoPreferenceClient()
    const payer = buildMercadoPagoPayer({
      profile,
      authEmail: userRes.user.email ?? null,
    })

    const preferenceBody = buildPreferenceBody({
      purpose,
      amountCents,
      paymentId,
      programId: program.id,
      applicationId,
      programTitle: program.title,
      programDescription: program.description ?? null,
      programSlug: program.slug,
      payer,
      urls,
    })

    const preferenceResponse = await preferenceClient.create({
      body: preferenceBody as never,
    })

    const preferenceId = pickStringOrNumber(preferenceResponse, 'id')
    const initPoint =
      pickString(preferenceResponse, 'init_point') ??
      pickString(preferenceResponse, 'initPoint')
    const sandboxInitPoint =
      pickString(preferenceResponse, 'sandbox_init_point') ??
      pickString(preferenceResponse, 'sandboxInitPoint')
    const checkoutUrl = initPoint ?? sandboxInitPoint

    if (!preferenceId || !checkoutUrl) {
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'failed',
          error_message: 'Mercado Pago no devolvió preference_id o init_point.',
        })
        .eq('id', paymentId)
        .eq('provider', MERCADO_PAGO_PROVIDER)

      return NextResponse.json(
        {
          ok: false,
          message:
            'Mercado Pago no devolvió datos válidos de checkout para este intento.',
        },
        { status: 502 }
      )
    }

    const updatePending = await updatePaymentPendingWithOptionalCheckout({
      paymentId,
      checkoutUrl,
    })

    if (updatePending.error) {
      return NextResponse.json(
        { ok: false, message: 'No se pudo actualizar el pago' },
        { status: 500 }
      )
    }

    await supabaseAdmin.from('mercadopago_payments').upsert(
      {
        payment_id: paymentId,
        preference_id: preferenceId,
        external_reference: paymentId,
        mp_status: 'pending',
        last_synced_at: new Date().toISOString(),
        raw_preference_response: preferenceResponse,
      },
      { onConflict: 'payment_id' }
    )

    return NextResponse.json(
      {
        ok: true,
        paymentId,
        status: 'pending',
        preferenceId,
        initPoint: initPoint ?? undefined,
        sandboxInitPoint: sandboxInitPoint ?? undefined,
        publicKey: getMercadoPagoPublicKey(),
      },
      { status: 200 }
    )
  } catch (error) {
    const normalizedErrorMessage =
      extractErrorMessage(error) ??
      'No se pudo crear la preferencia de Mercado Pago.'

    await supabaseAdmin
      .from('payments')
      .update({
        status: 'failed',
        error_message: normalizedErrorMessage,
      })
      .eq('id', paymentId)
      .eq('provider', MERCADO_PAGO_PROVIDER)

    return NextResponse.json(
      {
        ok: false,
        message: normalizedErrorMessage,
      },
      { status: 502 }
    )
  }
}
