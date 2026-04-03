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

type PublicProfile = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

function toPublicProfile(value: unknown): PublicProfile | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  const id = sanitizeText(row.id, 80)
  if (!id) return null

  return {
    id,
    first_name: sanitizeText(row.first_name, 120) || null,
    last_name: sanitizeText(row.last_name, 120) || null,
    email: sanitizeText(row.email, 180) || null,
  }
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

  const [teamRes, milestonesRes, assignmentsRes, membersRes, docentesRes] =
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
        .select('id, applicant_profile_id, assigned_role')
        .eq('team_id', targetTeamId)
        .eq('status', 'enrolled'),
      supabaseAdmin
        .from('docente_team_assignments')
        .select('id, docente_profile_id, staff_role, is_active')
        .eq('team_id', targetTeamId)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    ])

  if (teamRes.error || !teamRes.data) {
    return NextResponse.json(
      { ok: false, message: 'Equipo no encontrado.' },
      { status: 404 }
    )
  }

  if (
    milestonesRes.error ||
    assignmentsRes.error ||
    membersRes.error ||
    docentesRes.error
  ) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo cargar workspace docente.' },
      { status: 400 }
    )
  }

  const assignmentIds = (assignmentsRes.data ?? [])
    .map((item) => sanitizeText(item.id, 80))
    .filter(Boolean)

  const submissionsRes = assignmentIds.length
    ? await supabaseAdmin
        .from('submissions')
        .select(
          'id, task_assignment_id, submission_scope, owner_profile_id, submission_type, link_url, file_path, file_name, attempt_number, is_current_attempt, is_resubmission, status, submitted_at, submitted_by, reviewed_at, reviewed_by'
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

  const submissionIds = (submissionsRes.data ?? [])
    .map((row) => sanitizeText(row.id, 80))
    .filter(Boolean)

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
      { ok: false, message: 'No se pudo cargar feedback de entregas.' },
      { status: 400 }
    )
  }

  const profileIds = new Set<string>()

  for (const row of membersRes.data ?? []) {
    const applicantProfileId = sanitizeText(row.applicant_profile_id, 80)
    if (applicantProfileId) profileIds.add(applicantProfileId)
  }

  for (const row of docentesRes.data ?? []) {
    const docenteProfileId = sanitizeText(row.docente_profile_id, 80)
    if (docenteProfileId) profileIds.add(docenteProfileId)
  }

  for (const row of submissionsRes.data ?? []) {
    const ownerId = sanitizeText(row.owner_profile_id, 80)
    const submittedBy = sanitizeText(row.submitted_by, 80)
    const reviewedBy = sanitizeText(row.reviewed_by, 80)

    if (ownerId) profileIds.add(ownerId)
    if (submittedBy) profileIds.add(submittedBy)
    if (reviewedBy) profileIds.add(reviewedBy)
  }

  for (const row of feedbackRes.data ?? []) {
    const actorId = sanitizeText(row.actor_id, 80)
    if (actorId) profileIds.add(actorId)
  }

  const profileIdsArray = Array.from(profileIds)
  const profilesRes = profileIdsArray.length
    ? await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', profileIdsArray)
    : { data: [] as Array<Record<string, unknown>>, error: null }

  if (profilesRes.error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo resolver perfiles de entregas.' },
      { status: 400 }
    )
  }

  const profileById = new Map<string, PublicProfile>()
  for (const row of profilesRes.data ?? []) {
    const profile = toPublicProfile(row)
    if (!profile) continue
    profileById.set(profile.id, profile)
  }

  const feedbackBySubmission = new Map<string, Record<string, unknown>>()
  for (const row of feedbackRes.data ?? []) {
    const submissionId = sanitizeText(row.submission_id, 80)
    if (!submissionId) continue

    const actorId = sanitizeText(row.actor_id, 80)
    const actorProfile = actorId ? profileById.get(actorId) ?? null : null

    feedbackBySubmission.set(submissionId, {
      ...row,
      actor_profile: actorProfile,
    })
  }

  const submissionsByAssignment = new Map<
    string,
    Array<
      Record<string, unknown> & {
        latest_feedback: Record<string, unknown> | null
        reviewed_by_profile: PublicProfile | null
        owner_profile: PublicProfile | null
        submitted_by_profile: PublicProfile | null
      }
    >
  >()

  for (const submission of submissionsRes.data ?? []) {
    const assignmentId = sanitizeText(submission.task_assignment_id, 80)
    if (!assignmentId) continue

    const submissionId = sanitizeText(submission.id, 80)
    const ownerId = sanitizeText(submission.owner_profile_id, 80)
    const submittedById = sanitizeText(submission.submitted_by, 80)
    const reviewedById = sanitizeText(submission.reviewed_by, 80)

    const bucket = submissionsByAssignment.get(assignmentId) ?? []
    bucket.push({
      ...(submission as Record<string, unknown>),
      latest_feedback:
        (submissionId ? feedbackBySubmission.get(submissionId) : null) ?? null,
      owner_profile: ownerId ? profileById.get(ownerId) ?? null : null,
      submitted_by_profile: submittedById
        ? profileById.get(submittedById) ?? null
        : null,
      reviewed_by_profile: reviewedById
        ? profileById.get(reviewedById) ?? null
        : null,
    })
    submissionsByAssignment.set(assignmentId, bucket)
  }

  const assignments = (assignmentsRes.data ?? []).map((assignment) => {
    const assignmentId = sanitizeText(assignment.id, 80)
    return {
      ...assignment,
      submissions: assignmentId
        ? submissionsByAssignment.get(assignmentId) ?? []
        : [],
    }
  })

  const members = (membersRes.data ?? []).map((row) => ({
    id: sanitizeText(row.id, 80),
    applicant_profile_id: sanitizeText(row.applicant_profile_id, 80),
    assigned_role: sanitizeText(row.assigned_role, 120) || null,
    status: 'enrolled',
    applicant:
      profileById.get(sanitizeText(row.applicant_profile_id, 80)) ?? null,
  }))

  const docentes = (docentesRes.data ?? []).map((row) => ({
    id: sanitizeText(row.id, 80),
    docente_profile_id: sanitizeText(row.docente_profile_id, 80),
    staff_role: sanitizeText(row.staff_role, 120) || null,
    is_active: Boolean(row.is_active),
    docente: profileById.get(sanitizeText(row.docente_profile_id, 80)) ?? null,
  }))

  return NextResponse.json({
    ok: true,
    viewer: {
      id: auth.profile.id,
      role: auth.profile.role,
    },
    team: teamRes.data,
    milestones: milestonesRes.data ?? [],
    assignments,
    members,
    docentes,
  })
}
