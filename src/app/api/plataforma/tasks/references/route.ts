import { NextResponse } from 'next/server'

import { canManageTasks, requirePlatformProfile } from '@/lib/platform/security'
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

  const teamsRes = await supabaseAdmin
    .from('program_edition_teams')
    .select(
      'id, name, edition_id, edition:program_editions(id, edition_name, program_id, program:programs(id, title))'
    )
    .order('name', { ascending: true })

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
