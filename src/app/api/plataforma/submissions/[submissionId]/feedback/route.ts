import { NextResponse } from 'next/server'

import { touchPlatformActivity } from '@/lib/platform/activity'
import { emailTeamMembers, notifyTeamMembers } from '@/lib/platform/notifications'
import { canManageTeam } from '@/lib/platform/permissions'
import { isAdminRole, requirePlatformProfile } from '@/lib/platform/security'
import { sanitizeFeedbackComment } from '@/lib/platform/submissions'
import { supabaseAdmin } from '@/lib/supabase/admin'

type FeedbackBody = {
  comment?: string
  score?: number | null
  status?: 'changes_requested' | 'approved' | 'rejected' | 'reviewed'
}

function sanitizeText(value: unknown, max = 5000): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max)
}

export async function POST(
  request: Request,
  context: { params: Promise<{ submissionId?: string }> }
) {
  const auth = await requirePlatformProfile()
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status }
    )
  }

  const { submissionId } = await context.params
  const targetId = sanitizeText(submissionId, 80)
  if (!targetId) {
    return NextResponse.json(
      { ok: false, message: 'submissionId inválido.' },
      { status: 400 }
    )
  }

  const { data: submission, error: submissionError } = await supabaseAdmin
    .from('submissions')
    .select(
      'id, team_id, task_assignment_id, submission_scope, owner_profile_id, status, task_assignment:task_assignments(id, edition_id, program_id, team_id)'
    )
    .eq('id', targetId)
    .maybeSingle()

  if (submissionError || !submission) {
    return NextResponse.json(
      { ok: false, message: 'Entrega no encontrada.' },
      { status: 404 }
    )
  }

  const canManage = isAdminRole(auth.profile.role)
    ? true
    : await canManageTeam(auth.profile.id, submission.team_id)

  if (!canManage) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos para revisar esta entrega.' },
      { status: 403 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as FeedbackBody
  const comment = sanitizeFeedbackComment(sanitizeText(body.comment, 5000), 5000)
  const status =
    body.status === 'approved' ||
    body.status === 'rejected' ||
    body.status === 'changes_requested' ||
    body.status === 'reviewed'
      ? body.status
      : 'reviewed'

  if (!comment) {
    return NextResponse.json(
      { ok: false, message: 'comment es obligatorio.' },
      { status: 400 }
    )
  }

  const { data: feedback, error: feedbackError } = await supabaseAdmin
    .from('submission_feedback')
    .insert({
      submission_id: submission.id,
      actor_id: auth.profile.id,
      comment,
      score:
        typeof body.score === 'number' && Number.isFinite(body.score)
          ? body.score
          : null,
    })
    .select('id, submission_id, actor_id, score, created_at')
    .maybeSingle()

  if (feedbackError || !feedback) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo guardar el feedback.' },
      { status: 400 }
    )
  }

  const { error: updateError } = await supabaseAdmin
    .from('submissions')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: auth.profile.id,
    })
    .eq('id', submission.id)

  if (updateError) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo actualizar estado de la entrega.' },
      { status: 400 }
    )
  }

  let notificationType = 'feedback_added'
  let notificationTitle = 'Nueva devolución docente'
  if (status === 'approved') {
    notificationType = 'submission_approved'
    notificationTitle = 'Entrega aprobada'
  } else if (status === 'rejected') {
    notificationType = 'submission_rejected'
    notificationTitle = 'Entrega rechazada'
  } else if (status === 'changes_requested') {
    notificationType = 'submission_changes_requested'
    notificationTitle = 'Cambios solicitados'
  }

  await notifyTeamMembers({
    teamId: submission.team_id,
    type: notificationType,
    title: notificationTitle,
    body: 'Revisa el detalle de feedback en tu workspace.',
    payload: {
      submission_id: submission.id,
      task_assignment_id: submission.task_assignment_id,
      feedback_id: feedback.id,
      status,
    },
    source: 'submission_feedback',
    createdBy: auth.profile.id,
  })

  await emailTeamMembers({
    teamId: submission.team_id,
    subject: notificationTitle,
    text: 'Hay una nueva devolución en tu entrega. Revisa el workspace.',
  })

  const assignmentRef = submission.task_assignment as {
    edition_id?: string
    program_id?: string
  } | null

  await touchPlatformActivity({
    userId: auth.profile.id,
    activityType: 'task_submission_feedback_added',
    route: '/plataforma/docente',
    teamId: submission.team_id,
    editionId: assignmentRef?.edition_id ?? null,
    programId: assignmentRef?.program_id ?? null,
    metadata: {
      submission_id: submission.id,
      feedback_id: feedback.id,
      status,
    },
  })

  return NextResponse.json({ ok: true, feedback_id: feedback.id })
}

