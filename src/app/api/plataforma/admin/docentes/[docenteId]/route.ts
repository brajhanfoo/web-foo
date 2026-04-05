import { NextResponse } from 'next/server'

import { touchPlatformActivity } from '@/lib/platform/activity'
import { isAdminRole, requirePlatformProfile } from '@/lib/platform/security'
import { supabaseAdmin } from '@/lib/supabase/admin'

type UpdateDocenteBody = {
  first_name?: string
  last_name?: string
  professional_area_id?: string | null
  is_active?: boolean
  password_reset_required?: boolean
}

function sanitizeText(value: unknown, max = 120): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max)
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ docenteId?: string }> }
) {
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

  const { docenteId } = await context.params
  const targetId = sanitizeText(docenteId, 80)
  if (!targetId) {
    return NextResponse.json(
      { ok: false, message: 'docenteId inválido.' },
      { status: 400 }
    )
  }

  const [docenteRes, areasRes, assignmentsRes, editionsRes, teamsRes, programsRes] =
    await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select(
          [
            'id',
            'email',
            'first_name',
            'last_name',
            'role',
            'is_active',
            'professional_area_id',
            'password_reset_required',
            'last_login_at',
            'created_at',
            'updated_at',
            'professional_area:professional_areas(id, code, name, is_active)',
          ].join(', ')
        )
        .eq('id', targetId)
        .eq('role', 'docente')
        .maybeSingle(),
      supabaseAdmin
        .from('professional_areas')
        .select('id, code, name, is_active')
        .order('name', { ascending: true }),
      supabaseAdmin
        .from('docente_team_assignments')
        .select(
          [
            'id',
            'docente_profile_id',
            'program_id',
            'edition_id',
            'team_id',
            'staff_role',
            'is_active',
            'assigned_by',
            'created_at',
            'updated_at',
            'team:program_edition_teams(id, name, edition_id)',
          ].join(', ')
        )
        .eq('docente_profile_id', targetId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('program_editions')
        .select('id, program_id, edition_name, is_open, starts_at, ends_at')
        .eq('is_open', true)
        .order('starts_at', { ascending: false }),
      supabaseAdmin
        .from('program_edition_teams')
        .select('id, name, edition_id, program_editions!inner(id, is_open)')
        .eq('program_editions.is_open', true)
        .order('name', { ascending: true }),
      supabaseAdmin
        .from('programs')
        .select('id, title, is_published, program_editions!inner(id, is_open)')
        .eq('program_editions.is_open', true)
        .order('title', { ascending: true }),
    ])

  if (docenteRes.error || !docenteRes.data) {
    return NextResponse.json(
      { ok: false, message: 'Docente no encontrado.' },
      { status: 404 }
    )
  }

  if (
    areasRes.error ||
    assignmentsRes.error ||
    editionsRes.error ||
    teamsRes.error ||
    programsRes.error
  ) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo cargar el detalle del docente.' },
      { status: 400 }
    )
  }

  const teams = (teamsRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    edition_id: row.edition_id,
  }))

  const uniquePrograms = new Map<
    string,
    { id: string; title: string; is_published: boolean }
  >()
  for (const row of programsRes.data ?? []) {
    if (!row.id) continue
    uniquePrograms.set(row.id, {
      id: row.id,
      title: row.title,
      is_published: Boolean(row.is_published),
    })
  }

  await touchPlatformActivity({
    userId: auth.profile.id,
    activityType: 'admin_docente_detail_view',
    route: `/plataforma/admin/docentes/${targetId}`,
    metadata: { docente_id: targetId },
  })

  return NextResponse.json({
    ok: true,
    docente: docenteRes.data,
    professional_areas: areasRes.data ?? [],
    assignments: assignmentsRes.data ?? [],
    teams,
    editions: editionsRes.data ?? [],
    programs: Array.from(uniquePrograms.values()),
  })
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ docenteId?: string }> }
) {
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

  const { docenteId } = await context.params
  const targetId = sanitizeText(docenteId, 80)
  if (!targetId) {
    return NextResponse.json(
      { ok: false, message: 'docenteId inválido.' },
      { status: 400 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as UpdateDocenteBody
  const patch: Record<string, unknown> = {}

  if (typeof body.first_name === 'string') {
    patch.first_name = sanitizeText(body.first_name, 80) || null
  }
  if (typeof body.last_name === 'string') {
    patch.last_name = sanitizeText(body.last_name, 80) || null
  }
  if (Object.prototype.hasOwnProperty.call(body, 'professional_area_id')) {
    patch.professional_area_id =
      sanitizeText(body.professional_area_id, 80) || null
  }
  if (typeof body.is_active === 'boolean') {
    patch.is_active = body.is_active
  }
  if (typeof body.password_reset_required === 'boolean') {
    patch.password_reset_required = body.password_reset_required
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json(
      { ok: false, message: 'No hay cambios para guardar.' },
      { status: 400 }
    )
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(patch)
    .eq('id', targetId)
    .eq('role', 'docente')

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo actualizar el docente.' },
      { status: 400 }
    )
  }

  await touchPlatformActivity({
    userId: auth.profile.id,
    activityType: 'admin_docente_updated',
    route: '/plataforma/admin/docentes',
    metadata: { docente_id: targetId },
  })

  return NextResponse.json({ ok: true })
}

