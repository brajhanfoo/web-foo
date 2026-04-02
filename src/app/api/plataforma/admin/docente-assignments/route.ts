import { NextResponse } from 'next/server'

import { touchPlatformActivity } from '@/lib/platform/activity'
import { isAdminRole, requirePlatformProfile } from '@/lib/platform/security'
import { supabaseAdmin } from '@/lib/supabase/admin'

type AssignmentBody = {
  docente_profile_id?: string
  team_id?: string
  staff_role?: string | null
}

type AssignmentPatchBody = {
  assignment_id?: string
  is_active?: boolean
  staff_role?: string | null
}

function sanitizeText(value: unknown, max = 120): string {
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

  const url = new URL(request.url)
  const teamId = sanitizeText(url.searchParams.get('team_id'), 80)

  let query = supabaseAdmin
    .from('docente_team_assignments')
    .select(
      'id, docente_profile_id, program_id, edition_id, team_id, staff_role, is_active, assigned_by, created_at, updated_at'
    )
    .order('created_at', { ascending: false })

  if (teamId) {
    query = query.eq('team_id', teamId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudieron cargar asignaciones.' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true, assignments: data ?? [] })
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

  const body = (await request.json().catch(() => ({}))) as AssignmentBody
  const docenteProfileId = sanitizeText(body.docente_profile_id, 80)
  const teamId = sanitizeText(body.team_id, 80)
  const staffRole = sanitizeText(body.staff_role, 120) || null

  if (!docenteProfileId || !teamId) {
    return NextResponse.json(
      { ok: false, message: 'docente_profile_id y team_id son obligatorios.' },
      { status: 400 }
    )
  }

  const { data: teamRow, error: teamError } = await supabaseAdmin
    .from('program_edition_teams')
    .select('id, edition_id')
    .eq('id', teamId)
    .maybeSingle()

  if (teamError || !teamRow?.edition_id) {
    return NextResponse.json(
      { ok: false, message: 'Equipo no encontrado.' },
      { status: 404 }
    )
  }

  const { data: editionRow, error: editionError } = await supabaseAdmin
    .from('program_editions')
    .select('id, program_id')
    .eq('id', teamRow.edition_id)
    .maybeSingle()

  if (editionError || !editionRow?.program_id) {
    return NextResponse.json(
      { ok: false, message: 'EdiciÃ³n no encontrada.' },
      { status: 404 }
    )
  }

  const { data: conflicts } = await supabaseAdmin.rpc(
    'get_docente_assignment_conflicts',
    {
      p_docente_profile_id: docenteProfileId,
      p_team_id: teamId,
      p_exclude_assignment_id: null,
    }
  )

  const { data, error } = await supabaseAdmin
    .from('docente_team_assignments')
    .insert({
      docente_profile_id: docenteProfileId,
      team_id: teamId,
      edition_id: teamRow.edition_id,
      program_id: editionRow.program_id,
      staff_role: staffRole,
      assigned_by: auth.profile.id,
      is_active: true,
    })
    .select(
      'id, docente_profile_id, program_id, edition_id, team_id, staff_role, is_active, assigned_by, created_at, updated_at'
    )
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json(
      { ok: false, message: error?.message ?? 'No se pudo crear asignaciÃ³n.' },
      { status: 400 }
    )
  }

  await touchPlatformActivity({
    userId: auth.profile.id,
    activityType: 'admin_docente_assignment_created',
    route: '/plataforma/admin/programas',
    teamId,
    editionId: teamRow.edition_id,
    programId: editionRow.program_id,
    metadata: {
      docente_profile_id: docenteProfileId,
      assignment_id: data.id,
      conflicts_count: Array.isArray(conflicts) ? conflicts.length : 0,
    },
  })

  return NextResponse.json({
    ok: true,
    assignment: data,
    conflicts: conflicts ?? [],
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
  if (!isAdminRole(auth.profile.role)) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos.' },
      { status: 403 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as AssignmentPatchBody
  const assignmentId = sanitizeText(body.assignment_id, 80)
  if (!assignmentId) {
    return NextResponse.json(
      { ok: false, message: 'assignment_id es obligatorio.' },
      { status: 400 }
    )
  }

  const patch: Record<string, unknown> = {}
  if (typeof body.is_active === 'boolean') {
    patch.is_active = body.is_active
  }
  if (Object.prototype.hasOwnProperty.call(body, 'staff_role')) {
    patch.staff_role = sanitizeText(body.staff_role, 120) || null
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json(
      { ok: false, message: 'No hay cambios para guardar.' },
      { status: 400 }
    )
  }

  const { error } = await supabaseAdmin
    .from('docente_team_assignments')
    .update(patch)
    .eq('id', assignmentId)

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo actualizar la asignaciÃ³n.' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true })
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

  const body = (await request.json().catch(() => ({}))) as {
    assignment_id?: string
  }
  const assignmentId = sanitizeText(body.assignment_id, 80)
  if (!assignmentId) {
    return NextResponse.json(
      { ok: false, message: 'assignment_id es obligatorio.' },
      { status: 400 }
    )
  }

  const { error } = await supabaseAdmin
    .from('docente_team_assignments')
    .delete()
    .eq('id', assignmentId)

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo eliminar la asignaciÃ³n.' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true })
}
