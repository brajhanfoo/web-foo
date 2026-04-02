import { NextResponse } from 'next/server'

import { isDocenteAssigned, isTeamMember } from '@/lib/platform/permissions'
import { isAdminRole, requirePlatformProfile } from '@/lib/platform/security'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const auth = await requirePlatformProfile()
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status }
    )
  }

  const url = new URL(request.url)
  const applicationId = url.searchParams.get('application_id')?.trim() ?? ''
  if (!applicationId) {
    return NextResponse.json(
      { ok: false, message: 'application_id es obligatorio.' },
      { status: 400 }
    )
  }

  const { data: appRow, error: appError } = await supabaseAdmin
    .from('applications')
    .select('id, applicant_profile_id, team_id, edition_id, program_id, status')
    .eq('id', applicationId)
    .maybeSingle()

  if (appError || !appRow?.team_id) {
    return NextResponse.json(
      { ok: false, message: 'AplicaciÃ³n o equipo no encontrado.' },
      { status: 404 }
    )
  }

  if (appRow.status !== 'enrolled') {
    return NextResponse.json(
      { ok: false, message: 'La aplicacion no esta enrolada en el equipo.' },
      { status: 403 }
    )
  }

  const isOwner = appRow.applicant_profile_id === auth.profile.id
  const isAdmin = isAdminRole(auth.profile.role)
  const isDocente = await isDocenteAssigned(auth.profile.id, appRow.team_id)
  const member = isOwner
    ? true
    : await isTeamMember(auth.profile.id, appRow.team_id)

  if (!isAdmin && !isDocente && !member) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos para este workspace.' },
      { status: 403 }
    )
  }

  const { data: assignments, error: assignmentsError } = await supabaseAdmin
    .from('task_assignments')
    .select(
      [
        'id',
        'team_id',
        'milestone_id',
        'submission_mode',
        'allowed_submission_type',
        'deadline_at',
        'allow_resubmission',
        'resubmission_deadline_at',
        'max_attempts',
        'grading_mode',
        'status',
        'created_at',
        'task_template:task_templates(id, title, description, instructions)',
        'milestone:program_edition_milestones(id, title, position, starts_at)',
      ].join(', ')
    )
    .eq('team_id', appRow.team_id)
    .or('status.eq.published,status.eq.closed,is_published.eq.true')
    .order('created_at', { ascending: true })

  if (assignmentsError) {
    return NextResponse.json(
      { ok: false, message: 'No se pudieron cargar tareas.' },
      { status: 400 }
    )
  }

  const assignmentRows =
    ((assignments ?? []) as unknown as Array<Record<string, unknown>>) ?? []
  const assignmentIds = assignmentRows
    .map((row) => String(row.id ?? ''))
    .filter(Boolean)
  const submissionsRes = assignmentIds.length
    ? await supabaseAdmin
        .from('submissions')
        .select(
          'id, task_assignment_id, team_id, submission_scope, owner_profile_id, submission_type, link_url, file_path, file_name, attempt_number, is_current_attempt, is_resubmission, status, submitted_at, submitted_by'
        )
        .in('task_assignment_id', assignmentIds)
        .eq('is_current_attempt', true)
    : { data: [] as Array<Record<string, unknown>>, error: null }

  if (submissionsRes.error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudieron cargar entregas.' },
      { status: 400 }
    )
  }

  const submissionRows =
    ((submissionsRes.data ?? []) as unknown as Array<
      Record<string, unknown>
    >) ?? []

  const visibleSubmissions = submissionRows.filter((submission) => {
    const scope = String(submission.submission_scope ?? '')
    if (isAdmin || isDocente) return true
    if (scope === 'team') return true
    return submission.owner_profile_id === auth.profile.id
  })

  const submissionIds = visibleSubmissions.map((row) => String(row.id))
  const feedbackRes = submissionIds.length
    ? await supabaseAdmin
        .from('submission_latest_feedback_v')
        .select(
          'submission_id, feedback_id, actor_id, comment, score, score_max, created_at'
        )
        .in('submission_id', submissionIds)
    : { data: [] as Array<Record<string, unknown>>, error: null }

  if (feedbackRes.error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo cargar feedback.' },
      { status: 400 }
    )
  }

  const feedbackRows =
    ((feedbackRes.data ?? []) as unknown as Array<Record<string, unknown>>) ??
    []

  const feedbackBySubmission = new Map<string, Record<string, unknown>>(
    feedbackRows.map((row) => [String(row.submission_id), row])
  )

  const submissionsByAssignment = new Map<
    string,
    Array<
      Record<string, unknown> & {
        latest_feedback: Record<string, unknown> | null
      }
    >
  >()

  for (const submission of visibleSubmissions) {
    const assignmentId = String(submission.task_assignment_id)
    const previous = submissionsByAssignment.get(assignmentId) ?? []
    previous.push({
      ...(submission as Record<string, unknown>),
      latest_feedback: feedbackBySubmission.get(String(submission.id)) ?? null,
    })
    submissionsByAssignment.set(assignmentId, previous)
  }

  type AssignmentItem = Record<string, unknown> & {
    submissions: Array<
      Record<string, unknown> & {
        latest_feedback: Record<string, unknown> | null
      }
    >
  }

  const items: AssignmentItem[] = assignmentRows.map((assignment) => ({
    ...assignment,
    submissions: submissionsByAssignment.get(String(assignment.id)) ?? [],
  }))

  items.sort((left, right) => {
    const leftMilestone = left['milestone'] as
      | { position?: number | null; starts_at?: string | null }
      | null
      | undefined
    const rightMilestone = right['milestone'] as
      | { position?: number | null; starts_at?: string | null }
      | null
      | undefined

    const leftPos =
      typeof leftMilestone?.position === 'number'
        ? leftMilestone.position
        : Number.MAX_SAFE_INTEGER
    const rightPos =
      typeof rightMilestone?.position === 'number'
        ? rightMilestone.position
        : Number.MAX_SAFE_INTEGER
    if (leftPos !== rightPos) return leftPos - rightPos

    const leftDate = Date.parse(String(leftMilestone?.starts_at ?? ''))
    const rightDate = Date.parse(String(rightMilestone?.starts_at ?? ''))
    const leftDateSafe = Number.isNaN(leftDate)
      ? Number.MAX_SAFE_INTEGER
      : leftDate
    const rightDateSafe = Number.isNaN(rightDate)
      ? Number.MAX_SAFE_INTEGER
      : rightDate
    if (leftDateSafe !== rightDateSafe) return leftDateSafe - rightDateSafe

    const leftCreated = Date.parse(String(left['created_at'] ?? ''))
    const rightCreated = Date.parse(String(right['created_at'] ?? ''))
    const leftCreatedSafe = Number.isNaN(leftCreated) ? 0 : leftCreated
    const rightCreatedSafe = Number.isNaN(rightCreated) ? 0 : rightCreated
    return leftCreatedSafe - rightCreatedSafe
  })

  return NextResponse.json({
    ok: true,
    team_id: appRow.team_id,
    role_view: isAdmin ? 'admin' : isDocente ? 'docente' : 'talent',
    tasks: items,
  })
}
