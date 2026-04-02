import { NextResponse } from 'next/server'

import { isAdminRole, requirePlatformProfile } from '@/lib/platform/security'
import { supabaseAdmin } from '@/lib/supabase/admin'

function toDaysSince(dateIso: string | null): number | null {
  if (!dateIso) return null
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) return null
  return Math.floor((Date.now() - date.getTime()) / 86400000)
}

export async function GET(request: Request) {
  const auth = await requirePlatformProfile()
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status }
    )
  }

  if (auth.profile.role !== 'docente' && !isAdminRole(auth.profile.role)) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos.' },
      { status: 403 }
    )
  }

  const thresholdParam = Number(
    new URL(request.url).searchParams.get('inactive_days') ?? '7'
  )
  const inactiveDays = Number.isFinite(thresholdParam)
    ? Math.max(1, Math.min(thresholdParam, 60))
    : 7

  const assignmentsRes = isAdminRole(auth.profile.role)
    ? await supabaseAdmin
        .from('docente_team_assignments')
        .select('team_id')
        .eq('is_active', true)
    : await supabaseAdmin
        .from('docente_team_assignments')
        .select('team_id')
        .eq('is_active', true)
        .eq('docente_profile_id', auth.profile.id)

  if (assignmentsRes.error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudieron cargar asignaciones.' },
      { status: 400 }
    )
  }

  const teamIds = (assignmentsRes.data ?? [])
    .map((row) => row.team_id)
    .filter((value): value is string => Boolean(value))

  if (!teamIds.length) {
    return NextResponse.json({
      ok: true,
      threshold_days: inactiveDays,
      students: [],
      totals: { total: 0, inactive: 0 },
    })
  }

  const applicationsRes = await supabaseAdmin
    .from('applications')
    .select(
      'id, team_id, applicant_profile_id, team:program_edition_teams(id, name), profile:profiles(id, first_name, last_name, email, last_relevant_activity_at), last_seen:user_last_seen(last_relevant_activity_at)'
    )
    .in('team_id', teamIds)
    .eq('status', 'enrolled')

  if (applicationsRes.error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo cargar actividad de estudiantes.' },
      { status: 400 }
    )
  }

  const students = (applicationsRes.data ?? []).map((row) => {
    const profile = row.profile as {
      id?: string
      first_name?: string | null
      last_name?: string | null
      email?: string | null
      last_relevant_activity_at?: string | null
    } | null
    const lastSeen = row.last_seen as {
      last_relevant_activity_at?: string | null
    } | null
    const team = row.team as { name?: string | null } | null

    const lastActivity =
      lastSeen?.last_relevant_activity_at ??
      profile?.last_relevant_activity_at ??
      null
    const inactiveForDays = toDaysSince(lastActivity)
    return {
      profile_id: row.applicant_profile_id,
      first_name: profile?.first_name ?? null,
      last_name: profile?.last_name ?? null,
      email: profile?.email ?? null,
      team_id: row.team_id,
      team_name: team?.name ?? null,
      inactive_for_days: inactiveForDays,
      is_inactive: inactiveForDays !== null && inactiveForDays >= inactiveDays,
    }
  })

  return NextResponse.json({
    ok: true,
    threshold_days: inactiveDays,
    students,
    totals: {
      total: students.length,
      inactive: students.filter((student) => student.is_inactive).length,
    },
  })
}

