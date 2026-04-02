import { NextResponse } from 'next/server'

import { touchPlatformActivity } from '@/lib/platform/activity'
import { emailTeamMembers, notifyTeamMembers } from '@/lib/platform/notifications'
import { canManageTeam } from '@/lib/platform/permissions'
import { canManageTasks, isAdminRole, requirePlatformProfile } from '@/lib/platform/security'
import { supabaseAdmin } from '@/lib/supabase/admin'

type CreateAssignmentBody = {
  task_template_id?: string | null
  title?: string
  description?: string
  instructions?: string
  milestone_id?: string
  team_id?: string
  deadline_at?: string | null
  allow_resubmission?: boolean
  resubmission_deadline_at?: string | null
  max_attempts?: number
  submission_mode?: 'team' | 'individual'
  grading_mode?: 'score_100' | 'pass_fail' | 'none'
  status?: 'draft' | 'published' | 'closed' | 'archived'
}

type PatchAssignmentBody = {
  assignment_id?: string
  deadline_at?: string | null
  allow_resubmission?: boolean
  resubmission_deadline_at?: string | null
  max_attempts?: number
  submission_mode?: 'team' | 'individual'
  grading_mode?: 'score_100' | 'pass_fail' | 'none'
  status?: 'draft' | 'published' | 'closed' | 'archived'
}

function sanitizeText(value: unknown, max = 2000): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max)
}

function normalizeDateTime(value: string | null | undefined): string | null {
  const clean = sanitizeText(value, 64)
  return clean || null
}

async function assertTaskManagementPermission(userId: string, teamId: string) {
  return canManageTeam(userId, teamId)
}

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

  let query = supabaseAdmin
    .from('task_assignments')
    .select(
      [
        'id',
        'task_template_id',
        'milestone_id',
        'team_id',
        'edition_id',
        'program_id',
        'created_by',
        'deadline_at',
        'allow_resubmission',
        'resubmission_deadline_at',
        'max_attempts',
        'submission_mode',
        'grading_mode',
        'status',
        'is_published',
        'published_at',
        'closed_at',
        'created_at',
        'updated_at',
        'task_template:task_templates(id, title, description, instructions)',
        'milestone:program_edition_milestones(id, title, starts_at, position)',
      ].join(', ')
    )
    .order('created_at', { ascending: false })

  if (teamId) {
    query = query.eq('team_id', teamId)
    if (!isAdminRole(auth.profile.role)) {
      const allowed = await assertTaskManagementPermission(auth.profile.id, teamId)
      if (!allowed) {
        return NextResponse.json(
          { ok: false, message: 'Sin permisos para este equipo.' },
          { status: 403 }
        )
      }
    }
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudieron cargar tareas.' },
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

  if (!canManageTasks(auth.profile.role)) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos.' },
      { status: 403 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as CreateAssignmentBody
  const teamId = sanitizeText(body.team_id, 80)
  const milestoneId = sanitizeText(body.milestone_id, 80)
  const submissionMode =
    body.submission_mode === 'individual' ? 'individual' : 'team'
  const gradingMode =
    body.grading_mode === 'pass_fail' || body.grading_mode === 'none'
      ? body.grading_mode
      : 'score_100'
  const status =
    body.status === 'published' ||
    body.status === 'closed' ||
    body.status === 'archived'
      ? body.status
      : 'draft'

  if (!teamId || !milestoneId) {
    return NextResponse.json(
      { ok: false, message: 'team_id y milestone_id son obligatorios.' },
      { status: 400 }
    )
  }

  const allowed = isAdminRole(auth.profile.role)
    ? true
    : await assertTaskManagementPermission(auth.profile.id, teamId)

  if (!allowed) {
    return NextResponse.json(
      { ok: false, message: 'No puedes crear tareas para este equipo.' },
      { status: 403 }
    )
  }

  let taskTemplateId = sanitizeText(body.task_template_id, 80) || null
  if (!taskTemplateId) {
    const title = sanitizeText(body.title, 140)
    if (!title) {
      return NextResponse.json(
        { ok: false, message: 'title es obligatorio cuando no hay plantilla.' },
        { status: 400 }
      )
    }

    const { data: templateRow, error: templateError } = await supabaseAdmin
      .from('task_templates')
      .insert({
        title,
        description: sanitizeText(body.description, 800) || null,
        instructions: sanitizeText(body.instructions, 5000) || null,
        created_by: auth.profile.id,
      })
      .select('id')
      .maybeSingle()

    if (templateError || !templateRow?.id) {
      return NextResponse.json(
        { ok: false, message: 'No se pudo crear plantilla de tarea.' },
        { status: 400 }
      )
    }
    taskTemplateId = templateRow.id
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
      { ok: false, message: 'No se pudo resolver programa/edición.' },
      { status: 404 }
    )
  }

  const { data: assignment, error: assignmentError } = await supabaseAdmin
    .from('task_assignments')
    .insert({
      task_template_id: taskTemplateId,
      milestone_id: milestoneId,
      team_id: teamId,
      edition_id: teamRow.edition_id,
      program_id: editionRow.program_id,
      created_by: auth.profile.id,
      deadline_at: normalizeDateTime(body.deadline_at),
      allow_resubmission: Boolean(body.allow_resubmission),
      resubmission_deadline_at: normalizeDateTime(body.resubmission_deadline_at),
      max_attempts:
        typeof body.max_attempts === 'number' && body.max_attempts > 0
          ? Math.floor(body.max_attempts)
          : 1,
      submission_mode: submissionMode,
      grading_mode: gradingMode,
      status,
      is_published: status === 'published',
      published_at: status === 'published' ? new Date().toISOString() : null,
    })
    .select('id, team_id, submission_mode, status, deadline_at')
    .maybeSingle()

  if (assignmentError || !assignment) {
    return NextResponse.json(
      { ok: false, message: assignmentError?.message ?? 'No se pudo crear tarea.' },
      { status: 400 }
    )
  }

  if (assignment.status === 'published') {
    const title = 'Nueva tarea publicada'
    const bodyText =
      assignment.submission_mode === 'team'
        ? 'Se publicó una tarea con entrega por equipo.'
        : 'Se publicó una tarea con entrega individual.'

    await notifyTeamMembers({
      teamId,
      type: 'task_published',
      title,
      body: bodyText,
      payload: { task_assignment_id: assignment.id },
      source: 'task_assignments',
      createdBy: auth.profile.id,
    })

    await emailTeamMembers({
      teamId,
      subject: 'Nueva tarea publicada',
      text: `${bodyText} Revisa tu workspace para entregar.`,
    })
  }

  await touchPlatformActivity({
    userId: auth.profile.id,
    activityType: 'task_assignment_created',
    route: '/plataforma/entregables',
    teamId,
    editionId: teamRow.edition_id,
    programId: editionRow.program_id,
    metadata: { task_assignment_id: assignment.id },
  })

  return NextResponse.json({ ok: true, assignment })
}

export async function PATCH(request: Request) {
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

  const body = (await request.json().catch(() => ({}))) as PatchAssignmentBody
  const assignmentId = sanitizeText(body.assignment_id, 80)
  if (!assignmentId) {
    return NextResponse.json(
      { ok: false, message: 'assignment_id es obligatorio.' },
      { status: 400 }
    )
  }

  const { data: currentRow, error: currentError } = await supabaseAdmin
    .from('task_assignments')
    .select('id, team_id, edition_id, program_id, status')
    .eq('id', assignmentId)
    .maybeSingle()

  if (currentError || !currentRow) {
    return NextResponse.json(
      { ok: false, message: 'Tarea no encontrada.' },
      { status: 404 }
    )
  }

  const allowed = isAdminRole(auth.profile.role)
    ? true
    : await assertTaskManagementPermission(auth.profile.id, currentRow.team_id)
  if (!allowed) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos para esta tarea.' },
      { status: 403 }
    )
  }

  const patch: Record<string, unknown> = {}
  if (Object.prototype.hasOwnProperty.call(body, 'deadline_at')) {
    patch.deadline_at = normalizeDateTime(body.deadline_at)
  }
  if (typeof body.allow_resubmission === 'boolean') {
    patch.allow_resubmission = body.allow_resubmission
  }
  if (Object.prototype.hasOwnProperty.call(body, 'resubmission_deadline_at')) {
    patch.resubmission_deadline_at = normalizeDateTime(body.resubmission_deadline_at)
  }
  if (typeof body.max_attempts === 'number' && body.max_attempts > 0) {
    patch.max_attempts = Math.floor(body.max_attempts)
  }
  if (body.submission_mode === 'team' || body.submission_mode === 'individual') {
    patch.submission_mode = body.submission_mode
  }
  if (
    body.grading_mode === 'score_100' ||
    body.grading_mode === 'pass_fail' ||
    body.grading_mode === 'none'
  ) {
    patch.grading_mode = body.grading_mode
  }
  if (
    body.status === 'draft' ||
    body.status === 'published' ||
    body.status === 'closed' ||
    body.status === 'archived'
  ) {
    patch.status = body.status
    if (body.status === 'published') {
      patch.is_published = true
      patch.published_at = new Date().toISOString()
    }
    if (body.status === 'closed') {
      patch.closed_at = new Date().toISOString()
    }
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json(
      { ok: false, message: 'No hay cambios para aplicar.' },
      { status: 400 }
    )
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('task_assignments')
    .update(patch)
    .eq('id', assignmentId)
    .select('id, team_id, status')
    .maybeSingle()

  if (updateError || !updated) {
    return NextResponse.json(
      { ok: false, message: updateError?.message ?? 'No se pudo actualizar tarea.' },
      { status: 400 }
    )
  }

  if (currentRow.status !== updated.status && updated.status === 'published') {
    await notifyTeamMembers({
      teamId: updated.team_id,
      type: 'task_published',
      title: 'Tarea publicada',
      body: 'Tu equipo tiene una nueva tarea publicada.',
      payload: { task_assignment_id: updated.id },
      source: 'task_assignments',
      createdBy: auth.profile.id,
    })
    await emailTeamMembers({
      teamId: updated.team_id,
      subject: 'Tarea publicada',
      text: 'Tu equipo tiene una nueva tarea publicada. Revisa tu workspace.',
    })
  }

  if (
    typeof body.allow_resubmission === 'boolean' &&
    body.allow_resubmission === true
  ) {
    await notifyTeamMembers({
      teamId: updated.team_id,
      type: 'task_resubmission_enabled',
      title: 'Reentrega habilitada',
      body: 'Se habilitó reentrega para una tarea de tu equipo.',
      payload: { task_assignment_id: updated.id },
      source: 'task_assignments',
      createdBy: auth.profile.id,
    })
    await emailTeamMembers({
      teamId: updated.team_id,
      subject: 'Reentrega habilitada',
      text: 'Se habilitó reentrega para una tarea. Revisa los plazos en tu workspace.',
    })
  }

  await touchPlatformActivity({
    userId: auth.profile.id,
    activityType: 'task_assignment_updated',
    route: '/plataforma/entregables',
    teamId: currentRow.team_id,
    editionId: currentRow.edition_id,
    programId: currentRow.program_id,
    metadata: { task_assignment_id: assignmentId },
  })

  return NextResponse.json({ ok: true, assignment: updated })
}

