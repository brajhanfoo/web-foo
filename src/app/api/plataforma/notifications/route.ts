import { NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { requirePlatformProfile } from '@/lib/platform/security'

type NotificationsPatchBody = {
  ids?: string[]
  mark_all?: boolean
}

export async function GET(request: Request) {
  const auth = await requirePlatformProfile()
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status }
    )
  }

  const url = new URL(request.url)
  const limitParam = Number(url.searchParams.get('limit') ?? '20')
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 100)
    : 20

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select(
      'id, type, title, body, payload, source, target_type, team_id, read_at, created_at'
    )
    .eq('user_id', auth.profile.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudieron cargar notificaciones.' },
      { status: 400 }
    )
  }

  const unreadCount =
    data?.reduce((count, row) => (row.read_at ? count : count + 1), 0) ?? 0

  return NextResponse.json({
    ok: true,
    viewer_user_id: auth.profile.id,
    notifications: data ?? [],
    unread_count: unreadCount,
  })
}

export async function PATCH(request: Request) {
  const auth = await requirePlatformProfile()
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status }
    )
  }

  const body = (await request
    .json()
    .catch(() => ({}))) as NotificationsPatchBody
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((value) => typeof value === 'string' && value.trim())
    : []

  if (!body.mark_all && !ids.length) {
    return NextResponse.json(
      { ok: false, message: 'No se enviaron notificaciones para marcar.' },
      { status: 400 }
    )
  }

  let query = supabaseAdmin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', auth.profile.id)
    .is('read_at', null)

  if (!body.mark_all && ids.length) {
    query = query.in('id', ids)
  }

  const { error } = await query

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo marcar como leída.' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true })
}
