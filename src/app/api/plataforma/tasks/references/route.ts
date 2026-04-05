import { NextResponse } from 'next/server'

import {
  canManageTasks,
  isAdminRole,
  requirePlatformProfile,
} from '@/lib/platform/security'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const auth = await requirePlatformProfile()
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status }
    )
  }
  if (!canManageTasks(auth.profile.role)) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos.' },
      { status: 403 }
    )
  }

  const url = new URL(request.url)
  const teamId = url.searchParams.get('team_id')?.trim() ?? ''

  let allowedTeamIds: string[] | null = null
  if (!isAdminRole(auth.profile.role)) {
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('docente_team_assignments')
      .select('team_id')
      .eq('docente_profile_id', auth.profile.id)
      .eq('is_active', true)

    if (assignmentsError) {
      return NextResponse.json(
        { ok: false, message: 'No se pudo validar equipos asignados.' },
        { status: 400 }
      )
    }

    allowedTeamIds = (assignments ?? [])
      .map((row) => row.team_id)
      .filter((value): value is string => Boolean(value))

    if (teamId && !allowedTeamIds.includes(teamId)) {
      return NextResponse.json(
        { ok: false, message: 'Sin permisos para este equipo.' },
        { status: 403 }
      )
    }
  }

  let teamsQuery = supabaseAdmin
    .from('program_edition_teams')
    .select(
      'id, name, edition_id, edition:program_editions(id, edition_name, program_id, program:programs(id, title))'
    )
    .order('name', { ascending: true })

  if (allowedTeamIds) {
    if (!allowedTeamIds.length) {
      return NextResponse.json({
        ok: true,
        teams: [],
        milestones: [],
      })
    }
    teamsQuery = teamsQuery.in('id', allowedTeamIds)
  }

  const teamsRes = await teamsQuery

  if (teamsRes.error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudieron cargar equipos.' },
      { status: 400 }
    )
  }

  const milestonesRes = teamId
    ? await supabaseAdmin
        .from('program_edition_milestones')
        .select('id, team_id, title, starts_at, position')
        .eq('team_id', teamId)
        .order('position', { ascending: true, nullsFirst: false })
    : { data: [], error: null as null | { message: string } }

  if (milestonesRes.error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudieron cargar hitos.' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    ok: true,
    teams: teamsRes.data ?? [],
    milestones: milestonesRes.data ?? [],
  })
}
