import { NextResponse } from 'next/server'

import { touchPlatformActivity } from '@/lib/platform/activity'
import {
  emailTeamMembers,
  notifyTeamMembers,
} from '@/lib/platform/notifications'
import { canManageTeam } from '@/lib/platform/permissions'
import {
  canManageTasks,
  isAdminRole,
  requirePlatformProfile,
} from '@/lib/platform/security'
import {
  localDateTimeToUtcIso,
  PLATFORM_TIMEZONE,
} from '@/lib/platform/timezone'
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
  allowed_submission_type?: 'link' | 'file' | 'both'
  grading_mode?: 'score_100' | 'pass_fail' | 'none'
  status?: 'draft' | 'published' | 'closed' | 'archived'
}

type PatchAssignmentBody = {
  assignment_id?: string
  title?: string | null
  description?: string | null
  instructions?: string | null
  deadline_at?: string | null
  allow_resubmission?: boolean
  resubmission_deadline_at?: string | null
  max_attempts?: number
  submission_mode?: 'team' | 'individual'
  allowed_submission_type?: 'link' | 'file' | 'both'
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
  if (!clean) return null

  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(clean)) {
    const date = new Date(clean)
    if (Number.isNaN(date.getTime())) {
      throw new Error('Formato de fecha invalido.')
    }
    return date.toISOString()
  }

  const localIso = localDateTimeToUtcIso(clean, PLATFORM_TIMEZONE)
  if (!localIso) {
    throw new Error(
      `Formato de fecha invalido. Usa YYYY-MM-DDTHH:mm en ${PLATFORM_TIMEZONE}.`
    )
  }
  return localIso
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

  if (!teamId && !isAdminRole(auth.profile.role)) {
    return NextResponse.json(
      { ok: false, message: 'team_id es obligatorio para este rol.' },
      { status: 400 }
    )
  }

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
        'allowed_submission_type',
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
      const allowed = await assertTaskManagementPermission(
        auth.profile.id,
        teamId
      )
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
  const allowedSubmissionType =
    body.allowed_submission_type === 'link' ||
    body.allowed_submission_type === 'file'
      ? body.allowed_submission_type
      : 'both'
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
      { ok: false, message: 'No se pudo resolver programa/ediciÃ³n.' },
      { status: 404 }
    )
  }

  const { data: milestoneRow, error: milestoneError } = await supabaseAdmin
    .from('program_edition_milestones')
    .select('id, team_id, edition_id')
    .eq('id', milestoneId)
    .maybeSingle()

  if (milestoneError || !milestoneRow?.id) {
    return NextResponse.json(
      { ok: false, message: 'Hito no encontrado.' },
      { status: 404 }
    )
  }

  if (
    milestoneRow.team_id !== teamId ||
    milestoneRow.edition_id !== teamRow.edition_id
  ) {
    return NextResponse.json(
      {
        ok: false,
        message: 'El hito no pertenece al equipo/edicion indicada.',
      },
      { status: 400 }
    )
  }

  let normalizedDeadlineAt: string | null = null
  let normalizedResubmissionDeadlineAt: string | null = null
  try {
    normalizedDeadlineAt = normalizeDateTime(body.deadline_at)
    normalizedResubmissionDeadlineAt = normalizeDateTime(
      body.resubmission_deadline_at
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : 'Formato de fecha invalido.',
      },
      { status: 400 }
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
      deadline_at: normalizedDeadlineAt,
      allow_resubmission: Boolean(body.allow_resubmission),
      resubmission_deadline_at: normalizedResubmissionDeadlineAt,
      max_attempts:
        typeof body.max_attempts === 'number' && body.max_attempts > 0
          ? Math.floor(body.max_attempts)
          : 1,
      submission_mode: submissionMode,
      allowed_submission_type: allowedSubmissionType,
      grading_mode: gradingMode,
      status,
      is_published: status === 'published',
      published_at: status === 'published' ? new Date().toISOString() : null,
    })
    .select('id, team_id, submission_mode, status, deadline_at')
    .maybeSingle()

  if (assignmentError || !assignment) {
    return NextResponse.json(
      {
        ok: false,
        message: assignmentError?.message ?? 'No se pudo crear tarea.',
      },
      { status: 400 }
    )
  }

  if (assignment.status === 'published') {
    const title = 'Nueva tarea publicada'
    const bodyText =
      assignment.submission_mode === 'team'
        ? 'Se publicÃ³ una tarea con entrega por equipo.'
        : 'Se publicÃ³ una tarea con entrega individual.'

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
    route: '/plataforma/admin/programas',
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
    .select('id, team_id, edition_id, program_id, status, task_template_id')
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
  const templatePatch: Record<string, unknown> = {}

  if (Object.prototype.hasOwnProperty.call(body, 'title')) {
    const title = sanitizeText(body.title, 140)
    if (!title) {
      return NextResponse.json(
        { ok: false, message: 'title no puede ser vacio.' },
        { status: 400 }
      )
    }
    templatePatch.title = title
  }

  if (Object.prototype.hasOwnProperty.call(body, 'description')) {
    templatePatch.description = sanitizeText(body.description, 800) || null
  }

  if (Object.prototype.hasOwnProperty.call(body, 'instructions')) {
    templatePatch.instructions = sanitizeText(body.instructions, 5000) || null
  }
  if (Object.prototype.hasOwnProperty.call(body, 'deadline_at')) {
    try {
      patch.deadline_at = normalizeDateTime(body.deadline_at)
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : 'Formato de fecha invalido.',
        },
        { status: 400 }
      )
    }
  }
  if (typeof body.allow_resubmission === 'boolean') {
    patch.allow_resubmission = body.allow_resubmission
  }
  if (Object.prototype.hasOwnProperty.call(body, 'resubmission_deadline_at')) {
    try {
      patch.resubmission_deadline_at = normalizeDateTime(
        body.resubmission_deadline_at
      )
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : 'Formato de fecha invalido.',
        },
        { status: 400 }
      )
    }
  }
  if (typeof body.max_attempts === 'number' && body.max_attempts > 0) {
    patch.max_attempts = Math.floor(body.max_attempts)
  }
  if (
    body.submission_mode === 'team' ||
    body.submission_mode === 'individual'
  ) {
    patch.submission_mode = body.submission_mode
  }
  if (
    body.allowed_submission_type === 'link' ||
    body.allowed_submission_type === 'file' ||
    body.allowed_submission_type === 'both'
  ) {
    patch.allowed_submission_type = body.allowed_submission_type
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

  if (!Object.keys(patch).length && !Object.keys(templatePatch).length) {
    return NextResponse.json(
      { ok: false, message: 'No hay cambios para aplicar.' },
      { status: 400 }
    )
  }

  if (Object.keys(templatePatch).length) {
    if (!currentRow.task_template_id) {
      return NextResponse.json(
        { ok: false, message: 'La tarea no tiene plantilla editable.' },
        { status: 400 }
      )
    }

    const { error: templateError } = await supabaseAdmin
      .from('task_templates')
      .update(templatePatch)
      .eq('id', currentRow.task_template_id)

    if (templateError) {
      return NextResponse.json(
        {
          ok: false,
          message:
            templateError.message ?? 'No se pudo actualizar la plantilla.',
        },
        { status: 400 }
      )
    }
  }

  let updated: {
    id: string
    team_id: string
    status: 'draft' | 'published' | 'closed' | 'archived'
  } = {
    id: assignmentId,
    team_id: currentRow.team_id,
    status: currentRow.status as 'draft' | 'published' | 'closed' | 'archived',
  }

  if (Object.keys(patch).length) {
    const { data: updatedRow, error: updateError } = await supabaseAdmin
      .from('task_assignments')
      .update(patch)
      .eq('id', assignmentId)
      .select('id, team_id, status')
      .maybeSingle()

    if (updateError || !updatedRow) {
      return NextResponse.json(
        {
          ok: false,
          message: updateError?.message ?? 'No se pudo actualizar tarea.',
        },
        { status: 400 }
      )
    }

    updated = updatedRow
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
      body: 'Se habilitÃ³ reentrega para una tarea de tu equipo.',
      payload: { task_assignment_id: updated.id },
      source: 'task_assignments',
      createdBy: auth.profile.id,
    })
    await emailTeamMembers({
      teamId: updated.team_id,
      subject: 'Reentrega habilitada',
      text: 'Se habilitÃ³ reentrega para una tarea. Revisa los plazos en tu workspace.',
    })
  }

  await touchPlatformActivity({
    userId: auth.profile.id,
    activityType: 'task_assignment_updated',
    route: '/plataforma/admin/programas',
    teamId: currentRow.team_id,
    editionId: currentRow.edition_id,
    programId: currentRow.program_id,
    metadata: {
      task_assignment_id: assignmentId,
      template_updated: Object.keys(templatePatch).length > 0,
    },
  })

  return NextResponse.json({ ok: true, assignment: updated })
}
