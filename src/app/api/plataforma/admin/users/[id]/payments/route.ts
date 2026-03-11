import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  const supabaseServer = await createClient()
  const { data: userRes, error: userErr } = await supabaseServer.auth.getUser()

  if (userErr || !userRes.user) {
    return NextResponse.json(
      { ok: false, message: 'No autenticado' },
      { status: 401 }
    )
  }

  const { id } = await params
  const targetId = String(id ?? '').trim()
  if (!targetId) {
    return NextResponse.json(
      { ok: false, message: 'Falta id' },
      { status: 400 }
    )
  }

  const { data: profileRow, error: profileErr } = await supabaseServer
    .from('profiles')
    .select('id, role')
    .eq('id', userRes.user.id)
    .maybeSingle()

  if (profileErr || !profileRow) {
    return NextResponse.json(
      { ok: false, message: 'Perfil no disponible' },
      { status: 403 }
    )
  }

  const isAdmin =
    profileRow.role === 'admin' || profileRow.role === 'super_admin'

  if (!isAdmin) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos' },
      { status: 403 }
    )
  }

  const { data: payments, error: paymentsErr } = await supabaseAdmin
    .from('payments')
    .select(
      'id, provider, status, purpose, amount_cents, currency, program_id, edition_id, created_at, paid_at, programs(title)'
    )
    .or(`user_id.eq.${targetId},profile_id.eq.${targetId}`)
    .order('created_at', { ascending: false })

  if (paymentsErr) {
    return NextResponse.json(
      { ok: false, message: 'No se pudieron cargar pagos' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, payments: payments ?? [] })
}
