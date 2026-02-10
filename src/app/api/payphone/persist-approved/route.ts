import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type PaymentPurpose = 'pre_enrollment' | 'tuition'
type ProgramPaymentMode = 'none' | 'pre' | 'post'

type ProgramRow = {
  id: string
  slug: string
  payment_mode: ProgramPaymentMode | null
  requires_payment_pre: boolean
}

type PaymentRow = {
  id: string
  user_id: string
  status: 'initiated' | 'pending' | 'paid' | 'failed' | 'canceled'
  program_id: string
  application_id: string | null
  purpose: PaymentPurpose
}

type Body = { clientTxId: string; id: number }

function resolvePaymentMode(program: ProgramRow): ProgramPaymentMode {
  if (program.payment_mode) return program.payment_mode
  return program.requires_payment_pre ? 'pre' : 'none'
}

async function buildRedirect(params: {
  purpose: PaymentPurpose
  programId: string
}): Promise<string | null> {
  if (params.purpose === 'tuition') {
    return '/plataforma/talento/mis-postulaciones'
  }

  const { data: program } = await supabaseAdmin
    .from('programs')
    .select('slug')
    .eq('id', params.programId)
    .maybeSingle()

  if (program?.slug) {
    return `/plataforma/talento/programas/${program.slug}/postular`
  }

  return '/plataforma/talento/programas'
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
    .select('id,user_id,status,program_id,application_id,purpose')
    .eq('client_transaction_id', clientTxId)
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
    const redirectTo = await buildRedirect({
      purpose: p.purpose,
      programId: p.program_id,
    })
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

  if (p.application_id) {
    const { data: programRow } = await supabaseAdmin
      .from('programs')
      .select('id,payment_mode,requires_payment_pre')
      .eq('id', p.program_id)
      .maybeSingle()

    const program = (programRow as ProgramRow | null) ?? null
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

  const redirectTo = await buildRedirect({
    purpose: p.purpose,
    programId: p.program_id,
  })

  return NextResponse.json({ ok: true, redirectTo }, { status: 200 })
}
