import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  ProgramPricingError,
  isProgramPaymentVariant,
  resolveCheckoutPricingOrThrow,
  resolveCountryCode,
  resolveCountryCodeFromHeaders,
} from '@/lib/pricing'
import type {
  ProgramPaymentMode,
  ProgramPaymentVariant,
  ProgramRow,
} from '@/types/programs'
import type { PaymentProvider, PaymentStatus } from '@/types/payments'

export const runtime = 'nodejs'

const PAYPHONE_PROVIDER: PaymentProvider = 'payphone'

type PaymentPurpose = 'pre_enrollment' | 'tuition'
type CreateCheckoutInput = {
  programId: string
  editionId: string | null
  purpose: PaymentPurpose
  applicationId: string | null
  paymentVariant: ProgramPaymentVariant
}

type CreateCheckoutResponse = {
  ok: boolean
  message?: string
  paymentId?: string
  status?: PaymentStatus
  alreadyPaid?: boolean
  clientTxId?: string
  token?: string
  storeId?: string
  amount?: number
  amountWithoutTax?: number
  amountWithTax?: number
  tax?: number
  currency?: string
  reference?: string
}

type ProgramRowSummary = ProgramRow

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
  client_transaction_id: string | null
  payphone_transaction_id: string | null
  provider: PaymentProvider
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function parseInput(body: unknown): CreateCheckoutInput | null {
  if (!isRecord(body)) return null

  const programId = asString(body['programId'])
  const editionIdRaw = asString(body['editionId'])
  const purposeRaw = asString(body['purpose'])
  const applicationIdRaw = asString(body['applicationId'])
  const paymentVariantRaw =
    asString(body['paymentVariant']) || asString(body['payment_variant'])

  if (!programId || !purposeRaw || !paymentVariantRaw) return null
  if (purposeRaw !== 'pre_enrollment' && purposeRaw !== 'tuition') return null
  if (!isProgramPaymentVariant(paymentVariantRaw)) return null

  return {
    programId,
    editionId: editionIdRaw || null,
    purpose: purposeRaw,
    applicationId: applicationIdRaw || null,
    paymentVariant: paymentVariantRaw,
  }
}

function resolvePaymentMode(program: ProgramRowSummary): ProgramPaymentMode {
  if (program.payment_mode) return program.payment_mode
  return program.requires_payment_pre ? 'pre' : 'none'
}

function buildReference(purpose: PaymentPurpose, programSlug: string): string {
  const base = purpose === 'pre_enrollment' ? 'Pre-inscripcion' : 'Matricula'
  return `${base} ${programSlug}`.slice(0, 70)
}

function buildClientTxId(paymentId: string): string {
  return paymentId
}

async function findExistingPaid(params: {
  userId: string
  programId: string
  editionId: string | null
  purpose: PaymentPurpose
}): Promise<PaymentRow | null> {
  let q = supabaseAdmin
    .from('payments')
    .select(
      'id,status,edition_id,client_transaction_id,payphone_transaction_id,provider'
    )
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

async function cancelOpenAttempts(params: {
  userId: string
  programId: string
  editionId: string | null
  purpose: PaymentPurpose
  applicationId: string | null
}): Promise<{
  canceledCount: number
  error: unknown
}> {
  let q = supabaseAdmin
    .from('payments')
    .update({ status: 'canceled' })
    .eq('user_id', params.userId)
    .eq('program_id', params.programId)
    .eq('purpose', params.purpose)
    .in('status', ['initiated', 'pending'])

  q = params.editionId
    ? q.eq('edition_id', params.editionId)
    : q.is('edition_id', null)

  q = params.applicationId
    ? q.eq('application_id', params.applicationId)
    : q.is('application_id', null)

  const { data, error } = await q.select('id')

  return {
    canceledCount: Array.isArray(data) ? data.length : 0,
    error,
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateCheckoutResponse>> {
  const supabaseServer = await createClient()
  const { data: userRes, error: userErr } = await supabaseServer.auth.getUser()

  if (userErr || !userRes.user) {
    return NextResponse.json(
      { ok: false, message: 'No autenticado' },
      { status: 401 }
    )
  }

  let payload: CreateCheckoutInput | null = null
  try {
    payload = parseInput((await request.json()) as unknown)
  } catch {
    payload = null
  }

  if (!payload) {
    return NextResponse.json(
      { ok: false, message: 'Payload invalido' },
      { status: 400 }
    )
  }

  const { programId, editionId, purpose, applicationId, paymentVariant } =
    payload
  const userId = userRes.user.id

  const { data: programRow, error: programErr } = await supabaseAdmin
    .from('programs')
    .select(
      `id, slug, payment_mode, requires_payment_pre, price_usd,
      price_usd_list,price_usd_discount_percent,price_usd_final_single,price_usd_has_installments,
      price_usd_final_installments,price_usd_installments_count,price_usd_installments_interest_free,price_usd_installment_amount,
      price_ars_list,price_ars_discount_percent,price_ars_final_single,price_ars_has_installments,
      price_ars_final_installments,price_ars_installments_count,price_ars_installments_interest_free,price_ars_installment_amount`
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

  let resolvedEditionId = editionId

  if (applicationId) {
    const { data: appRow, error: appErr } = await supabaseServer
      .from('applications')
      .select('id, applicant_profile_id, program_id, edition_id')
      .eq('id', applicationId)
      .maybeSingle()

    if (appErr || !appRow) {
      return NextResponse.json(
        { ok: false, message: 'Postulacion no encontrada' },
        { status: 404 }
      )
    }

    const application = appRow as ApplicationRow
    if (application.applicant_profile_id !== userId) {
      return NextResponse.json(
        { ok: false, message: 'Sin permisos para esta postulacion' },
        { status: 403 }
      )
    }
    if (application.program_id !== programId) {
      return NextResponse.json(
        { ok: false, message: 'Programa no coincide con la postulacion' },
        { status: 400 }
      )
    }

    resolvedEditionId = resolvedEditionId ?? application.edition_id ?? null
  }

  const { data: profileRow } = await supabaseAdmin
    .from('profiles')
    .select('country_residence')
    .eq('id', userId)
    .maybeSingle()

  const headerCountryCode = resolveCountryCodeFromHeaders(request.headers)
  const profileCountryCode = resolveCountryCode(
    typeof profileRow?.country_residence === 'string'
      ? profileRow.country_residence
      : null
  )
  const checkoutCountryCode = headerCountryCode ?? profileCountryCode

  let checkoutPricing: ReturnType<typeof resolveCheckoutPricingOrThrow>
  try {
    checkoutPricing = resolveCheckoutPricingOrThrow({
      program,
      countryCodeOrLabel: checkoutCountryCode,
      paymentVariant,
    })
  } catch (error) {
    if (error instanceof ProgramPricingError) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { ok: false, message: 'No se pudo resolver el pricing del programa.' },
      { status: 500 }
    )
  }

  if (checkoutPricing.currency !== 'USD') {
    return NextResponse.json(
      {
        ok: false,
        message: 'PayPhone solo esta disponible para cobros en USD.',
      },
      { status: 400 }
    )
  }

  if (paymentVariant === 'installments') {
    return NextResponse.json(
      {
        ok: false,
        message:
          'PayPhone no admite cuotas en USD. Elige pago único o usa Mercado Pago para cuotas.',
      },
      { status: 400 }
    )
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

  const token =
    process.env.PAYPHONE_TOKEN ?? process.env.NEXT_PUBLIC_PAYPHONE_TOKEN
  const storeId = process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID
  if (!token || !storeId) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Configura PAYPHONE_TOKEN y NEXT_PUBLIC_PAYPHONE_STORE_ID',
      },
      { status: 500 }
    )
  }

  const cancelOpen = await cancelOpenAttempts({
    userId,
    programId,
    editionId: resolvedEditionId,
    purpose,
    applicationId,
  })

  if (cancelOpen.error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'No se pudo preparar un nuevo intento de pago.',
      },
      { status: 500 }
    )
  }

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('payments')
    .insert({
      user_id: userId,
      provider: PAYPHONE_PROVIDER,
      program_id: programId,
      edition_id: resolvedEditionId,
      application_id: applicationId,
      purpose,
      status: 'initiated',
      amount_cents: checkoutPricing.amountCents,
      currency: checkoutPricing.currency,
      client_transaction_id: null,
      payphone_transaction_id: null,
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
  const clientTxId = buildClientTxId(paymentId)
  const reference = buildReference(purpose, program.slug)

  const { error: updateErr } = await supabaseAdmin
    .from('payments')
    .update({ status: 'pending', client_transaction_id: clientTxId })
    .eq('id', paymentId)
    .eq('provider', PAYPHONE_PROVIDER)

  if (updateErr) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo actualizar el pago' },
      { status: 500 }
    )
  }

  await supabaseAdmin.from('payphone_payments').upsert(
    {
      payment_id: paymentId,
      transaction_id: null,
      reference,
      raw_payload: {
        created_from: 'payphone_create_checkout',
      },
    },
    { onConflict: 'payment_id' }
  )

  return NextResponse.json(
    {
      ok: true,
      paymentId,
      status: 'pending',
      clientTxId,
      token,
      storeId,
      amount: checkoutPricing.amountCents,
      amountWithoutTax: checkoutPricing.amountCents,
      amountWithTax: 0,
      tax: 0,
      currency: checkoutPricing.currency,
      reference,
    },
    { status: 200 }
  )
}
