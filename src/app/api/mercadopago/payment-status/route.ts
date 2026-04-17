import { NextRequest, NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { PaymentProvider, PaymentStatus } from '@/types/payments'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const MERCADO_PAGO_PROVIDER: PaymentProvider = 'mercado_pago'

type PaymentPurpose = 'pre_enrollment' | 'tuition'

type PaymentRow = {
  id: string
  user_id: string
  status: PaymentStatus
  provider: PaymentProvider
  purpose: PaymentPurpose
  program_id: string
  edition_id: string | null
  application_id: string | null
  paid_at: string | null
}

type ProgramSlugRow = {
  slug: string
}

type ApplicationOwnerRow = {
  applicant_profile_id: string
}

function clean(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed || null
}

async function resolvePaymentId(params: {
  userId: string | null
  externalReference: string | null
  preferenceId: string | null
  mercadoPagoPaymentId: string | null
}): Promise<string | null> {
  if (params.externalReference) {
    let q = supabaseAdmin
      .from('payments')
      .select('id')
      .eq('id', params.externalReference)
      .eq('provider', MERCADO_PAGO_PROVIDER)

    if (params.userId) {
      q = q.eq('user_id', params.userId)
    }

    const { data } = await q.maybeSingle()

    if (data?.id) return String(data.id)
  }

  // For unauthenticated lookup, only external_reference is allowed.
  if (!params.userId) return null

  if (params.preferenceId) {
    const { data } = await supabaseAdmin
      .from('mercadopago_payments')
      .select('payment_id')
      .eq('preference_id', params.preferenceId)
      .maybeSingle()
    if (data?.payment_id) return String(data.payment_id)
  }

  if (params.mercadoPagoPaymentId) {
    const { data } = await supabaseAdmin
      .from('mercadopago_payments')
      .select('payment_id')
      .eq('mercadopago_payment_id', params.mercadoPagoPaymentId)
      .maybeSingle()
    if (data?.payment_id) return String(data.payment_id)
  }

  return null
}

export async function GET(request: NextRequest) {
  const supabaseServer = await createClient()
  const { data: userRes } = await supabaseServer.auth.getUser()
  const requesterUserId = userRes.user?.id ?? null

  const externalReference = clean(
    request.nextUrl.searchParams.get('external_reference')
  )
  const preferenceId = clean(request.nextUrl.searchParams.get('preference_id'))
  const mercadoPagoPaymentId = clean(
    request.nextUrl.searchParams.get('payment_id')
  )

  if (!requesterUserId && !externalReference) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Falta external_reference para consultar el estado sin sesion activa.',
      },
      { status: 400 }
    )
  }

  const paymentId = await resolvePaymentId({
    userId: requesterUserId,
    externalReference,
    preferenceId,
    mercadoPagoPaymentId,
  })

  if (!paymentId) {
    return NextResponse.json(
      { ok: false, message: 'No se encontró el pago.' },
      { status: 404 }
    )
  }

  const { data: paymentData, error: paymentErr } = await supabaseAdmin
    .from('payments')
    .select(
      'id,user_id,status,provider,purpose,program_id,edition_id,application_id,paid_at'
    )
    .eq('id', paymentId)
    .eq('provider', MERCADO_PAGO_PROVIDER)
    .maybeSingle()

  if (paymentErr || !paymentData) {
    return NextResponse.json(
      { ok: false, message: 'Pago no encontrado.' },
      { status: 404 }
    )
  }

  const payment = paymentData as PaymentRow
  if (requesterUserId && payment.user_id !== requesterUserId) {
    return NextResponse.json(
      { ok: false, message: 'Pago no encontrado.' },
      { status: 404 }
    )
  }

  if (requesterUserId && payment.application_id) {
    const { data: applicationData, error: applicationErr } = await supabaseAdmin
      .from('applications')
      .select('applicant_profile_id')
      .eq('id', payment.application_id)
      .maybeSingle()

    if (applicationErr || !applicationData) {
      return NextResponse.json(
        { ok: false, message: 'Pago no encontrado.' },
        { status: 404 }
      )
    }

    const application = applicationData as ApplicationOwnerRow
    if (application.applicant_profile_id !== requesterUserId) {
      return NextResponse.json(
        { ok: false, message: 'Pago no encontrado.' },
        { status: 404 }
      )
    }
  }

  let nextUrl: string | null = null
  if (payment.status === 'paid') {
    if (payment.purpose === 'pre_enrollment') {
      const { data: programRow } = await supabaseAdmin
        .from('programs')
        .select('slug')
        .eq('id', payment.program_id)
        .maybeSingle()

      const program = (programRow as ProgramSlugRow | null) ?? null
      if (program?.slug) {
        nextUrl = `/plataforma/talento/explorar/${program.slug}/postular`
      }
    }

    if (!nextUrl) {
      nextUrl = '/plataforma/talento/mis-postulaciones'
    }
  }

  const { data: mpDetail } = await supabaseAdmin
    .from('mercadopago_payments')
    .select(
      'preference_id,mercadopago_payment_id,merchant_order_id,external_reference,mp_status,status_detail,payment_type,payment_method,installments,live_mode,last_webhook_at,last_synced_at'
    )
    .eq('payment_id', payment.id)
    .maybeSingle()

  return NextResponse.json(
    {
      ok: true,
      payment: {
        id: payment.id,
        status: payment.status,
        provider: payment.provider,
        purpose: payment.purpose,
        program_id: payment.program_id,
        edition_id: payment.edition_id,
        application_id: payment.application_id,
        paid_at: payment.paid_at,
      },
      mercadopago: mpDetail ?? null,
      nextUrl,
    },
    { status: 200 }
  )
}
