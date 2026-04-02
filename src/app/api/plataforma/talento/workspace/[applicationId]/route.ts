import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type WorkspaceTeamRow = {
  id: string
  name: string
  drive_url: string | null
  classroom_url: string | null
  slack_url: string | null
}

type WorkspaceMilestoneRow = {
  id: string
  title: string
  meet_url: string | null
  drive_url: string | null
  starts_at: string | null
  position: number | null
  created_at: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ applicationId?: string }> }
) {
  const supabaseServer = await createClient()
  const { data: userRes, error: userErr } = await supabaseServer.auth.getUser()

  if (userErr || !userRes.user) {
    return NextResponse.json(
      { ok: false, message: 'No autenticado' },
      { status: 401 }
    )
  }

  const { applicationId } = await params
  const targetId = String(applicationId ?? '').trim()
  if (!targetId) {
    return NextResponse.json(
      { ok: false, message: 'Falta applicationId' },
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
  const isTalent = profileRow.role === 'talent'

  if (!isAdmin && !isTalent) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos' },
      { status: 403 }
    )
  }

  const { data: appRow, error: appErr } = await supabaseAdmin
    .from('applications')
    .select(
      'id, applicant_profile_id, program_id, edition_id, status, team_id, certificate_bucket_id, certificate_object_path, programs(title), program_editions(edition_name, starts_at, ends_at)'
    )
    .eq('id', targetId)
    .maybeSingle()

  if (appErr) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo cargar la inscripcion' },
      { status: 500 }
    )
  }

  if (!appRow) {
    return NextResponse.json(
      { ok: false, message: 'Inscripcion no encontrada' },
      { status: 404 }
    )
  }

  if (!isAdmin && appRow.applicant_profile_id !== userRes.user.id) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos' },
      { status: 403 }
    )
  }

  if (appRow.status !== 'enrolled') {
    return NextResponse.json(
      { ok: false, message: 'No autorizado' },
      { status: 403 }
    )
  }

  let team: WorkspaceTeamRow | null = null
  if (appRow.team_id) {
    const { data: teamRow, error: teamErr } = await supabaseAdmin
      .from('program_edition_teams')
      .select('id, name, drive_url, classroom_url, slack_url')
      .eq('id', appRow.team_id)
      .maybeSingle()

    if (teamErr) {
      return NextResponse.json(
        { ok: false, message: 'No se pudo cargar el equipo' },
        { status: 500 }
      )
    }

    team = (teamRow ?? null) as WorkspaceTeamRow | null
  }

  let milestones: WorkspaceMilestoneRow[] = []
  if (appRow.team_id) {
    const { data: milestonesRows, error: milestonesErr } = await supabaseAdmin
      .from('program_edition_milestones')
      .select('id, title, meet_url, drive_url, starts_at, position, created_at')
      .eq('team_id', appRow.team_id)
      .order('position', { ascending: true, nullsFirst: false })
      .order('starts_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })

    if (milestonesErr) {
      return NextResponse.json(
        { ok: false, message: 'No se pudieron cargar los hitos' },
        { status: 500 }
      )
    }

    milestones = (milestonesRows ?? []) as WorkspaceMilestoneRow[]
  }

  const program = appRow.programs as { title?: string | null } | null
  const edition = appRow.program_editions as {
    edition_name?: string | null
    starts_at?: string | null
    ends_at?: string | null
  } | null

  return NextResponse.json({
    ok: true,
    data: {
      application: {
        id: appRow.id,
        program_id: appRow.program_id,
        edition_id: appRow.edition_id,
        status: appRow.status,
        team_id: appRow.team_id,
        certificate_bucket_id: appRow.certificate_bucket_id,
        certificate_object_path: appRow.certificate_object_path,
      },
      program: {
        title: program?.title ?? null,
      },
      edition: {
        edition_name: edition?.edition_name ?? null,
        starts_at: edition?.starts_at ?? null,
        ends_at: edition?.ends_at ?? null,
      },
      team,
      milestones,
    },
  })
}
