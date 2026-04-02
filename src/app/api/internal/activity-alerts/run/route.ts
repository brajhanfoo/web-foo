import { NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const secret = process.env.ACTIVITY_ALERTS_CRON_SECRET ?? ''
  const headerSecret = request.headers.get('x-cron-secret') ?? ''

  if (!secret || headerSecret !== secret) {
    return NextResponse.json(
      { ok: false, message: 'Unauthorized' },
      { status: 401 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as {
    low_days?: number
    inactive_days?: number
    critical_days?: number
    actor_id?: string | null
  }

  const { data, error } = await supabaseAdmin.rpc('process_inactivity_alerts', {
    p_low_days:
      typeof body.low_days === 'number' && body.low_days > 0
        ? Math.floor(body.low_days)
        : 3,
    p_inactive_days:
      typeof body.inactive_days === 'number' && body.inactive_days > 0
        ? Math.floor(body.inactive_days)
        : 7,
    p_critical_days:
      typeof body.critical_days === 'number' && body.critical_days > 0
        ? Math.floor(body.critical_days)
        : 14,
    p_actor_id: body.actor_id ?? null,
  })

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo procesar alertas.' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    ok: true,
    processed: data ?? [],
  })
}

