import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { ProgramPaymentMode, ProgramRow } from '@/types/programs'
import type { PaymentProvider } from '@/types/payments'

export const runtime = 'nodejs'

const PAYPHONE_PROVIDER: PaymentProvider = 'payphone'

type PaymentPurpose = 'pre_enrollment' | 'tuition'
type ProgramRowSummary = Pick<
  ProgramRow,
  'id' | 'slug' | 'payment_mode' | 'requires_payment_pre'
>

type PaymentRow = {
  id: string
  user_id: string
  edition_id: string | null
  provider: PaymentProvider
  status: 'initiated' | 'pending' | 'paid' | 'failed' | 'canceled'
  program_id: string
  application_id: string | null
  purpose: PaymentPurpose
}

type Body = { clientTxId: string; id: number }

function resolvePaymentMode(program: ProgramRowSummary): ProgramPaymentMode {
  if (program.payment_mode) return program.payment_mode
  return program.requires_payment_pre ? 'pre' : 'none'
}

async function buildRedirect(): Promise<string> {
  return '/plataforma/talento/mis-postulaciones'
}

async function cancelOtherOpenAttemptsForSameConcept(params: {
  payment: PaymentRow
}): Promise<void> {
  let q = supabaseAdmin
    .from('payments')
    .update({ status: 'canceled' })
    .eq('user_id', params.payment.user_id)
    .eq('program_id', params.payment.program_id)
    .eq('purpose', params.payment.purpose)
    .in('status', ['initiated', 'pending'])
    .neq('id', params.payment.id)

  q = params.payment.edition_id
    ? q.eq('edition_id', params.payment.edition_id)
    : q.is('edition_id', null)

  q = params.payment.application_id
    ? q.eq('application_id', params.payment.application_id)
    : q.is('application_id', null)

  await q
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: userRes } = await supabase.auth.getUser()
  const userId = userRes.user?.id
  if (!userId) {
    return NextResponse.json(
      { ok: false, message: 'No autenticado' },
      { status: 401 }
    )
  }

  let body: Body | null = null
  try {
    body = (await req.json()) as Body
  } catch {
    body = null
  }

  const clientTxId = (body?.clientTxId ?? '').trim()
  const transactionIdNum = Number(body?.id)

  if (!clientTxId || !Number.isFinite(transactionIdNum)) {
    return NextResponse.json(
      { ok: false, message: 'Payload inválido' },
      { status: 400 }
    )
  }

  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .select(
      'id,user_id,edition_id,provider,status,program_id,application_id,purpose'
    )
    .eq('client_transaction_id', clientTxId)
    .eq('provider', PAYPHONE_PROVIDER)
    .maybeSingle()

  if (error || !payment) {
    return NextResponse.json(
      { ok: false, message: 'Pago no encontrado' },
      { status: 404 }
    )
  }

  const p = payment as PaymentRow

  if (p.user_id !== userId) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos' },
      { status: 403 }
    )
  }

  if (p.status === 'paid') {
    const redirectTo = await buildRedirect()
    return NextResponse.json({ ok: true, redirectTo }, { status: 200 })
  }

  const paidAt = new Date().toISOString()

  await supabaseAdmin
    .from('payments')
    .update({
      status: 'paid',
      paid_at: paidAt,
      payphone_transaction_id: String(transactionIdNum),
    })
    .eq('id', p.id)
    .eq('provider', PAYPHONE_PROVIDER)

  await cancelOtherOpenAttemptsForSameConcept({ payment: p })

  await supabaseAdmin.from('payphone_payments').upsert(
    {
      payment_id: p.id,
      transaction_id: String(transactionIdNum),
      raw_payload: {
        persisted_from: 'payphone_persist_approved',
        transaction_id: transactionIdNum,
        client_transaction_id: clientTxId,
      },
    },
    { onConflict: 'payment_id' }
  )

  if (p.application_id) {
    const { data: programRow } = await supabaseAdmin
      .from('programs')
      .select('id,payment_mode,requires_payment_pre')
      .eq('id', p.program_id)
      .maybeSingle()

    const program = (programRow as ProgramRowSummary | null) ?? null
    const mode = program ? resolvePaymentMode(program) : 'none'

    const updatePayload: Record<string, unknown> = {
      payment_status: 'paid',
      paid_at: paidAt,
    }

    if (mode === 'post') updatePayload['status'] = 'enrolled'

    await supabaseAdmin
      .from('applications')
      .update(updatePayload)
      .eq('id', p.application_id)
  }

  const redirectTo = await buildRedirect()

  return NextResponse.json({ ok: true, redirectTo }, { status: 200 })
}
