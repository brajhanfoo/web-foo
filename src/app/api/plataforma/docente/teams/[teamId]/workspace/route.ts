import { NextResponse } from 'next/server'

import { isDocenteAssigned } from '@/lib/platform/permissions'
import { isAdminRole, requirePlatformProfile } from '@/lib/platform/security'
import { supabaseAdmin } from '@/lib/supabase/admin'

function sanitizeText(value: unknown, max = 80): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max)
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ teamId?: string }> }
) {
  const auth = await requirePlatformProfile()
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status }
    )
  }

  const { teamId } = await context.params
  const targetTeamId = sanitizeText(teamId, 80)
  if (!targetTeamId) {
    return NextResponse.json(
      { ok: false, message: 'teamId inválido.' },
      { status: 400 }
    )
  }

  const canRead = isAdminRole(auth.profile.role)
    ? true
    : await isDocenteAssigned(auth.profile.id, targetTeamId)
  if (!canRead) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos para este equipo.' },
      { status: 403 }
    )
  }

  const [teamRes, milestonesRes, assignmentsRes, membersRes] =
    await Promise.all([
      supabaseAdmin
        .from('program_edition_teams')
        .select(
          'id, name, edition_id, edition:program_editions(id, edition_name, program_id, program:programs(id, title))'
        )
        .eq('id', targetTeamId)
        .maybeSingle(),
      supabaseAdmin
        .from('program_edition_milestones')
        .select('id, title, position, starts_at')
        .eq('team_id', targetTeamId)
        .order('position', { ascending: true, nullsFirst: false }),
      supabaseAdmin
        .from('task_assignments')
        .select(
          'id, milestone_id, submission_mode, allowed_submission_type, deadline_at, allow_resubmission, resubmission_deadline_at, max_attempts, grading_mode, status, created_at, task_template:task_templates(id, title, description, instructions)'
        )
        .eq('team_id', targetTeamId)
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('applications')
        .select(
          'id, applicant_profile_id, assigned_role, applicant:profiles(id, first_name, last_name, email)'
        )
        .eq('team_id', targetTeamId)
        .eq('status', 'enrolled'),
    ])

  if (teamRes.error || !teamRes.data) {
    return NextResponse.json(
      { ok: false, message: 'Equipo no encontrado.' },
      { status: 404 }
    )
  }

  if (milestonesRes.error || assignmentsRes.error || membersRes.error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo cargar workspace docente.' },
      { status: 400 }
    )
  }

  const assignmentIds = (assignmentsRes.data ?? []).map((item) => item.id)
  const submissionsRes = assignmentIds.length
    ? await supabaseAdmin
        .from('submissions')
        .select(
          'id, task_assignment_id, submission_scope, owner_profile_id, submission_type, link_url, file_path, file_name, attempt_number, is_current_attempt, is_resubmission, status, submitted_at, submitted_by'
        )
        .in('task_assignment_id', assignmentIds)
        .eq('is_current_attempt', true)
        .order('submitted_at', { ascending: false })
    : { data: [] as Array<Record<string, unknown>>, error: null }

  if (submissionsRes.error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudieron cargar entregas.' },
      { status: 400 }
    )
  }

  const submissionIds = (submissionsRes.data ?? []).map((row) => String(row.id))
  const feedbackRes = submissionIds.length
    ? await supabaseAdmin
        .from('submission_latest_feedback_v')
        .select(
          'submission_id, feedback_id, actor_id, comment, score, score_max, created_at'
        )
        .in('submission_id', submissionIds)
    : { data: [] as Array<Record<string, unknown>>, error: null }

  const feedbackBySubmission = new Map<string, Record<string, unknown>>(
    (feedbackRes.data ?? []).map((row) => [String(row.submission_id), row])
  )

  const submissionsByAssignment = new Map<
    string,
    Array<
      Record<string, unknown> & {
        latest_feedback: Record<string, unknown> | null
      }
    >
  >()
  for (const submission of submissionsRes.data ?? []) {
    const key = String(submission.task_assignment_id)
    const bucket = submissionsByAssignment.get(key) ?? []
    bucket.push({
      ...(submission as Record<string, unknown>),
      latest_feedback: feedbackBySubmission.get(String(submission.id)) ?? null,
    })
    submissionsByAssignment.set(key, bucket)
  }

  const assignments = (assignmentsRes.data ?? []).map((assignment) => ({
    ...assignment,
    submissions: submissionsByAssignment.get(String(assignment.id)) ?? [],
  }))

  return NextResponse.json({
    ok: true,
    team: teamRes.data,
    milestones: milestonesRes.data ?? [],
    assignments,
    members: membersRes.data ?? [],
  })
}
