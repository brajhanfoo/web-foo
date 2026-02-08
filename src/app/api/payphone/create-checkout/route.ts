import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const DEFAULT_CURRENCY = 'USD'

type PaymentPurpose = 'pre_enrollment' | 'tuition'
type PaymentStatus = 'initiated' | 'pending' | 'paid' | 'failed' | 'canceled'
type ProgramPaymentMode = 'none' | 'pre' | 'post'

type CreateCheckoutInput = {
  programId: string
  editionId: string | null
  purpose: PaymentPurpose
  applicationId: string | null
  amountCents: number
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

type ProgramRow = {
  id: string
  slug: string
  payment_mode: ProgramPaymentMode | null
  requires_payment_pre: boolean
  price_usd: string | null
  created_at?: string
}

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
}

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

function parseInput(body: unknown): CreateCheckoutInput | null {
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

function resolvePaymentMode(program: ProgramRow): ProgramPaymentMode {
  if (program.payment_mode) return program.payment_mode
  return program.requires_payment_pre ? 'pre' : 'none'
}

function parsePriceToCents(priceUsd: string | null): number | null {
  if (!priceUsd) return null
  const parsed = Number(priceUsd)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed * 100)
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
    .select('id,status,edition_id,client_transaction_id,payphone_transaction_id')
    .eq('user_id', params.userId)
    .eq('program_id', params.programId)
    .eq('purpose', params.purpose)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(1)

  q = params.editionId ? q.eq('edition_id', params.editionId) : q.is('edition_id', null)

  const { data, error } = await q.maybeSingle()
  if (error || !data) return null
  return data as PaymentRow
}

async function findReusableOpen(params: {
  userId: string
  programId: string
  editionId: string | null
  purpose: PaymentPurpose
}): Promise<PaymentRow | null> {
  let q = supabaseAdmin
    .from('payments')
    .select('id,status,edition_id,client_transaction_id,payphone_transaction_id')
    .eq('user_id', params.userId)
    .eq('program_id', params.programId)
    .eq('purpose', params.purpose)
    .in('status', ['initiated', 'pending'])
    .order('created_at', { ascending: false })
    .limit(1)

  q = params.editionId ? q.eq('edition_id', params.editionId) : q.is('edition_id', null)

  const { data, error } = await q.maybeSingle()
  if (error || !data) return null
  return data as PaymentRow
}

export async function POST(request: NextRequest): Promise<NextResponse<CreateCheckoutResponse>> {
  const supabaseServer = await createClient()
  const { data: userRes, error: userErr } = await supabaseServer.auth.getUser()

  if (userErr || !userRes.user) {
    return NextResponse.json({ ok: false, message: 'No autenticado' }, { status: 401 })
  }

  let payload: CreateCheckoutInput | null = null
  try {
    payload = parseInput((await request.json()) as unknown)
  } catch {
    payload = null
  }

  if (!payload) {
    return NextResponse.json({ ok: false, message: 'Payload inválido' }, { status: 400 })
  }

  const { programId, editionId, purpose, applicationId, amountCents } = payload
  const userId = userRes.user.id

  const { data: programRow, error: programErr } = await supabaseAdmin
    .from('programs')
    .select('id, slug, payment_mode, requires_payment_pre, price_usd')
    .eq('id', programId)
    .maybeSingle()

  if (programErr || !programRow) {
    return NextResponse.json({ ok: false, message: 'Programa no encontrado' }, { status: 404 })
  }

  const program = programRow as ProgramRow
  const paymentMode = resolvePaymentMode(program)

  if (purpose === 'pre_enrollment' && paymentMode !== 'pre') {
    return NextResponse.json({ ok: false, message: 'El programa no requiere pago previo' }, { status: 400 })
  }

  if (purpose === 'tuition') {
    if (!applicationId) {
      return NextResponse.json({ ok: false, message: 'Falta applicationId' }, { status: 400 })
    }
    if (paymentMode !== 'post') {
      return NextResponse.json({ ok: false, message: 'El programa no usa pago posterior' }, { status: 400 })
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
      return NextResponse.json({ ok: false, message: 'Postulación no encontrada' }, { status: 404 })
    }

    const application = appRow as ApplicationRow
    if (application.applicant_profile_id !== userId) {
      return NextResponse.json({ ok: false, message: 'Sin permisos para esta postulación' }, { status: 403 })
    }
    if (application.program_id !== programId) {
      return NextResponse.json({ ok: false, message: 'Programa no coincide con la postulación' }, { status: 400 })
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
      { ok: true, paymentId: existingPaid.id, status: 'paid', alreadyPaid: true },
      { status: 200 }
    )
  }

  // Token + StoreId públicos (para la cajita)
  const token = process.env.NEXT_PUBLIC_PAYPHONE_TOKEN
  const storeId = process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID
  if (!token || !storeId) {
    return NextResponse.json(
      { ok: false, message: 'Configura NEXT_PUBLIC_PAYPHONE_TOKEN y NEXT_PUBLIC_PAYPHONE_STORE_ID' },
      { status: 500 }
    )
  }

  // Reusar pago abierto
 // Buscar pago abierto previo (si existe)
const openRow = await findReusableOpen({
  userId,
  programId,
  editionId: resolvedEditionId,
  purpose,
})

if (openRow) {
  // Importante: NO reusar clientTxId (PayPhone lo rechaza si ya existe)
  await supabaseAdmin
    .from('payments')
    .update({ status: 'canceled' })
    .eq('id', openRow.id)
}
  // Crear nuevo
  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('payments')
    .insert({
      user_id: userId,
      program_id: programId,
      edition_id: resolvedEditionId,
      application_id: applicationId,
      purpose,
      status: 'initiated',
      amount_cents: amountCents,
      currency: DEFAULT_CURRENCY,
      client_transaction_id: null,
      payphone_transaction_id: null,
    })
    .select('id')
    .maybeSingle()

  if (insertErr || !inserted?.id) {
    return NextResponse.json({ ok: false, message: 'No se pudo iniciar el pago' }, { status: 500 })
  }

  const paymentId = inserted.id as string
  const clientTxId = buildClientTxId(paymentId)

  const { error: updateErr } = await supabaseAdmin
    .from('payments')
    .update({ status: 'pending', client_transaction_id: clientTxId })
    .eq('id', paymentId)

  if (updateErr) {
    return NextResponse.json({ ok: false, message: 'No se pudo actualizar el pago' }, { status: 500 })
  }

  return NextResponse.json(
    {
      ok: true,
      paymentId,
      status: 'pending',
      clientTxId,
      token,
      storeId,
      amount: amountCents,
      amountWithoutTax: amountCents,
      amountWithTax: 0,
      tax: 0,
      currency: DEFAULT_CURRENCY,
      reference: buildReference(purpose, program.slug),
    },
    { status: 200 }
  )
}
