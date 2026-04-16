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
      'id, team_id, applicant_profile_id, team:program_edition_teams(id, name)'
    )
    .in('team_id', teamIds)
    .eq('status', 'enrolled')

  if (applicationsRes.error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo cargar actividad de estudiantes.' },
      { status: 400 }
    )
  }

  const applicationRows = applicationsRes.data ?? []
  const profileIds = Array.from(
    new Set(
      applicationRows
        .map((row) => String(row.applicant_profile_id ?? '').trim())
        .filter(Boolean)
    )
  )

  const [profilesRes, lastSeenRes] = await Promise.all([
    profileIds.length
      ? supabaseAdmin
          .from('profiles')
          .select('id, first_name, last_name, email, last_relevant_activity_at')
          .in('id', profileIds)
      : Promise.resolve({
          data: [] as Array<{
            id: string
            first_name: string | null
            last_name: string | null
            email: string | null
            last_relevant_activity_at: string | null
          }>,
          error: null,
        }),
    profileIds.length
      ? supabaseAdmin
          .from('user_last_seen')
          .select('user_id, last_relevant_activity_at')
          .in('user_id', profileIds)
      : Promise.resolve({
          data: [] as Array<{
            user_id: string
            last_relevant_activity_at: string | null
          }>,
          error: null,
        }),
  ])

  if (profilesRes.error || lastSeenRes.error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo cargar actividad de estudiantes.' },
      { status: 400 }
    )
  }

  const profileById = new Map(
    (profilesRes.data ?? []).map((row) => [row.id, row])
  )
  const lastSeenById = new Map(
    (lastSeenRes.data ?? []).map((row) => [
      row.user_id,
      row.last_relevant_activity_at,
    ])
  )

  const students = applicationRows.map((row) => {
    const profile =
      profileById.get(String(row.applicant_profile_id ?? '')) ?? null
    const team = row.team as { name?: string | null } | null

    const lastActivity =
      lastSeenById.get(String(row.applicant_profile_id ?? '')) ??
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
