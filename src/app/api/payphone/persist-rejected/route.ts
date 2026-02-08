import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type Body = { clientTxId: string; id: number; message?: string }

type PaymentRow = {
  id: string
  user_id: string
  status: 'initiated' | 'pending' | 'paid' | 'failed' | 'canceled'
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: userRes } = await supabase.auth.getUser()
  const userId = userRes.user?.id
  if (!userId) return NextResponse.json({ ok: false, message: 'No autenticado' }, { status: 401 })

  let body: Body | null = null
  try {
    body = (await req.json()) as Body
  } catch {
    body = null
  }

  const clientTxId = (body?.clientTxId ?? '').trim()
  const transactionIdNum = Number(body?.id)
  const msg = (body?.message ?? '').trim()

  if (!clientTxId || !Number.isFinite(transactionIdNum)) {
    return NextResponse.json({ ok: false, message: 'Payload inválido' }, { status: 400 })
  }

  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .select('id,user_id,status')
    .eq('client_transaction_id', clientTxId)
    .maybeSingle()

  if (error || !payment) {
    return NextResponse.json({ ok: false, message: 'Pago no encontrado' }, { status: 404 })
  }

  const p = payment as PaymentRow
  if (p.user_id !== userId) {
    return NextResponse.json({ ok: false, message: 'Sin permisos' }, { status: 403 })
  }

  if (p.status === 'paid') {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  await supabaseAdmin
    .from('payments')
    .update({
      status: 'failed',
      error_message: msg || 'Pago rechazado',
      payphone_transaction_id: String(transactionIdNum),
    })
    .eq('id', p.id)

  return NextResponse.json({ ok: true }, { status: 200 })
}
