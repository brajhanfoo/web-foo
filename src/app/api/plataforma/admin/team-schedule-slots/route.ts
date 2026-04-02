import { NextResponse } from 'next/server'

import { isAdminRole, requirePlatformProfile } from '@/lib/platform/security'
import { supabaseAdmin } from '@/lib/supabase/admin'

type ScheduleBody = {
  team_id?: string
  day_of_week?: number
  start_time?: string
  end_time?: string
  timezone?: string
}

function sanitizeText(value: unknown, max = 80): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max)
}

export async function GET(request: Request) {
  const auth = await requirePlatformProfile()
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status }
    )
  }
  if (!isAdminRole(auth.profile.role)) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos.' },
      { status: 403 }
    )
  }

  const teamId = new URL(request.url).searchParams.get('team_id')?.trim() ?? ''
  if (!teamId) {
    return NextResponse.json(
      { ok: false, message: 'team_id es obligatorio.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('team_schedule_slots')
    .select('id, team_id, day_of_week, start_time, end_time, timezone, is_active')
    .eq('team_id', teamId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo cargar horarios.' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true, slots: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requirePlatformProfile()
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status }
    )
  }
  if (!isAdminRole(auth.profile.role)) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos.' },
      { status: 403 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as ScheduleBody
  const teamId = sanitizeText(body.team_id)
  const day = Number(body.day_of_week)
  const startTime = sanitizeText(body.start_time)
  const endTime = sanitizeText(body.end_time)
  const timezone = sanitizeText(body.timezone, 60) || 'America/Guayaquil'

  if (!teamId || !Number.isFinite(day) || day < 0 || day > 6) {
    return NextResponse.json(
      { ok: false, message: 'Datos de horario inválidos.' },
      { status: 400 }
    )
  }

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(startTime) || !/^\d{2}:\d{2}(:\d{2})?$/.test(endTime)) {
    return NextResponse.json(
      { ok: false, message: 'Formato de hora inválido.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('team_schedule_slots')
    .insert({
      team_id: teamId,
      day_of_week: day,
      start_time: startTime,
      end_time: endTime,
      timezone,
      is_active: true,
    })
    .select('id, team_id, day_of_week, start_time, end_time, timezone, is_active')
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json(
      { ok: false, message: error?.message ?? 'No se pudo crear slot.' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true, slot: data })
}

export async function DELETE(request: Request) {
  const auth = await requirePlatformProfile()
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status }
    )
  }
  if (!isAdminRole(auth.profile.role)) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos.' },
      { status: 403 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as { slot_id?: string }
  const slotId = sanitizeText(body.slot_id)
  if (!slotId) {
    return NextResponse.json(
      { ok: false, message: 'slot_id es obligatorio.' },
      { status: 400 }
    )
  }

  const { error } = await supabaseAdmin
    .from('team_schedule_slots')
    .delete()
    .eq('id', slotId)

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo eliminar slot.' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true })
}

