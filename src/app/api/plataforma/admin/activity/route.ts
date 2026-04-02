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
  if (!isAdminRole(auth.profile.role)) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos.' },
      { status: 403 }
    )
  }

  const url = new URL(request.url)
  const programId = url.searchParams.get('program_id')?.trim() ?? ''
  const teamId = url.searchParams.get('team_id')?.trim() ?? ''
  const inactiveDaysParam = Number(url.searchParams.get('inactive_days') ?? '7')
  const inactiveDays = Number.isFinite(inactiveDaysParam)
    ? Math.max(1, Math.min(inactiveDaysParam, 90))
    : 7

  let appQuery = supabaseAdmin
    .from('applications')
    .select(
      'id, program_id, edition_id, team_id, applicant_profile_id, status, program:programs(id, title), team:program_edition_teams(id, name)'
    )
    .eq('status', 'enrolled')

  if (programId) appQuery = appQuery.eq('program_id', programId)
  if (teamId) appQuery = appQuery.eq('team_id', teamId)

  const appsRes = await appQuery

  if (appsRes.error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo cargar actividad.' },
      { status: 400 }
    )
  }

  const appRows =
    ((appsRes.data ?? []) as unknown as Array<Record<string, unknown>>) ?? []

  const studentProfileIds = Array.from(
    new Set(
      appRows
        .map((row) => String(row.applicant_profile_id ?? '').trim())
        .filter(Boolean)
    )
  )

  const [studentProfilesRes, studentLastSeenRes, docentesRes] =
    await Promise.all([
      studentProfileIds.length
        ? supabaseAdmin
            .from('profiles')
            .select(
              'id, first_name, last_name, email, role, last_relevant_activity_at'
            )
            .in('id', studentProfileIds)
        : Promise.resolve({
            data: [] as Array<{
              id: string
              first_name: string | null
              last_name: string | null
              email: string | null
              role: string | null
              last_relevant_activity_at: string | null
            }>,
            error: null,
          }),
      studentProfileIds.length
        ? supabaseAdmin
            .from('user_last_seen')
            .select('user_id, last_relevant_activity_at')
            .in('user_id', studentProfileIds)
        : Promise.resolve({
            data: [] as Array<{
              user_id: string
              last_relevant_activity_at: string | null
            }>,
            error: null,
          }),
      supabaseAdmin
        .from('profiles')
        .select(
          'id, first_name, last_name, email, role, last_relevant_activity_at'
        )
        .eq('role', 'docente')
        .eq('is_active', true),
    ])

  if (studentProfilesRes.error || studentLastSeenRes.error || docentesRes.error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo cargar actividad.' },
      { status: 400 }
    )
  }

  const profileById = new Map(
    (studentProfilesRes.data ?? []).map((row) => [row.id, row])
  )
  const studentLastSeenById = new Map(
    (studentLastSeenRes.data ?? []).map((row) => [
      row.user_id,
      row.last_relevant_activity_at,
    ])
  )

  const students = appRows.map((row) => {
    const profileId = String(row.applicant_profile_id ?? '')
    const profile = profileById.get(profileId) ?? null

    const lastActivity =
      studentLastSeenById.get(profileId) ??
      profile?.last_relevant_activity_at ??
      null
    const inactiveForDays = toDaysSince(lastActivity)

    return {
      application_id: String(row.id ?? ''),
      profile_id: String(row.applicant_profile_id ?? ''),
      first_name: profile?.first_name ?? null,
      last_name: profile?.last_name ?? null,
      email: profile?.email ?? null,
      team_id: (row.team_id as string | null) ?? null,
      team_name:
        ((row.team as { name?: string | null } | null)?.name ?? null) || null,
      program_id: (row.program_id as string | null) ?? null,
      program_title:
        ((row.program as { title?: string | null } | null)?.title ?? null) ||
        null,
      inactive_for_days: inactiveForDays,
      is_inactive: inactiveForDays !== null && inactiveForDays >= inactiveDays,
    }
  })

  const inactiveStudents = students.filter((student) => student.is_inactive)

  const docenteRows = docentesRes.data ?? []
  const docenteIds = docenteRows
    .map((row) => String(row.id ?? '').trim())
    .filter(Boolean)

  const docenteLastSeenRes = docenteIds.length
    ? await supabaseAdmin
        .from('user_last_seen')
        .select('user_id, last_relevant_activity_at')
        .in('user_id', docenteIds)
    : {
        data: [] as Array<{
          user_id: string
          last_relevant_activity_at: string | null
        }>,
        error: null,
      }

  if (docenteLastSeenRes.error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo cargar actividad.' },
      { status: 400 }
    )
  }

  const docenteLastSeenById = new Map(
    (docenteLastSeenRes.data ?? []).map((row) => [
      row.user_id,
      row.last_relevant_activity_at,
    ])
  )

  const docentes = docenteRows.map((row) => {
    const lastActivity =
      docenteLastSeenById.get(String(row.id ?? '')) ??
      row.last_relevant_activity_at
    const inactiveForDays = toDaysSince(lastActivity)
    return {
      ...row,
      inactive_for_days: inactiveForDays,
      is_inactive: inactiveForDays !== null && inactiveForDays >= inactiveDays,
    }
  })

  const teamStatsMap = new Map<
    string,
    {
      team_id: string
      team_name: string
      total_students: number
      inactive_students: number
    }
  >()

  for (const student of students) {
    if (!student.team_id) continue
    const key = student.team_id
    const prev = teamStatsMap.get(key) ?? {
      team_id: student.team_id,
      team_name: student.team_name ?? 'Equipo',
      total_students: 0,
      inactive_students: 0,
    }
    prev.total_students += 1
    if (student.is_inactive) prev.inactive_students += 1
    teamStatsMap.set(key, prev)
  }

  const programStatsMap = new Map<
    string,
    {
      program_id: string
      program_title: string
      total_students: number
      inactive_students: number
    }
  >()

  for (const student of students) {
    if (!student.program_id) continue
    const key = student.program_id
    const prev = programStatsMap.get(key) ?? {
      program_id: student.program_id,
      program_title: student.program_title ?? 'Programa',
      total_students: 0,
      inactive_students: 0,
    }
    prev.total_students += 1
    if (student.is_inactive) prev.inactive_students += 1
    programStatsMap.set(key, prev)
  }

  return NextResponse.json({
    ok: true,
    inactive_days_threshold: inactiveDays,
    totals: {
      students: students.length,
      inactive_students: inactiveStudents.length,
      docentes: docentes.length,
      inactive_docentes: docentes.filter((item) => item.is_inactive).length,
    },
    by_team: Array.from(teamStatsMap.values()),
    by_program: Array.from(programStatsMap.values()),
    inactive_students: inactiveStudents,
    docentes,
  })
}

