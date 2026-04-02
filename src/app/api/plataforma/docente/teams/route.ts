import { NextResponse } from 'next/server'

import { isAdminRole, requirePlatformProfile } from '@/lib/platform/security'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
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

  const baseAssignmentsQuery = supabaseAdmin
    .from('docente_team_assignments')
    .select('id, team_id, edition_id, program_id, is_active')
    .eq('is_active', true)

  const assignmentsRes = isAdminRole(auth.profile.role)
    ? await baseAssignmentsQuery
    : await baseAssignmentsQuery.eq('docente_profile_id', auth.profile.id)

  if (assignmentsRes.error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudieron cargar equipos.' },
      { status: 400 }
    )
  }

  const teamIds = (assignmentsRes.data ?? [])
    .map((row) => row.team_id)
    .filter((value): value is string => Boolean(value))

  if (!teamIds.length) {
    return NextResponse.json({ ok: true, teams: [], assignments: [] })
  }

  const [teamsRes, tasksRes] = await Promise.all([
    supabaseAdmin
      .from('program_edition_teams')
      .select(
        'id, name, edition_id, edition:program_editions(id, edition_name, program_id, program:programs(id, title))'
      )
      .in('id', teamIds),
    supabaseAdmin
      .from('task_assignments')
      .select('id, team_id, status, deadline_at')
      .in('team_id', teamIds)
      .in('status', ['draft', 'published', 'closed']),
  ])

  if (teamsRes.error || tasksRes.error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo cargar detalle de equipos.' },
      { status: 400 }
    )
  }

  const tasksByTeam = new Map<string, number>()
  for (const task of tasksRes.data ?? []) {
    const current = tasksByTeam.get(task.team_id) ?? 0
    tasksByTeam.set(task.team_id, current + 1)
  }

  const teams = (teamsRes.data ?? []).map((team) => ({
    ...team,
    task_count: tasksByTeam.get(team.id) ?? 0,
  }))

  return NextResponse.json({
    ok: true,
    teams,
    assignments: assignmentsRes.data ?? [],
  })
}

