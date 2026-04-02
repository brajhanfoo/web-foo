import { NextResponse } from 'next/server'

import { touchPlatformActivity } from '@/lib/platform/activity'
import {
  emailDocentesAndAdmins,
  notifyDocentesAndAdmins,
} from '@/lib/platform/notifications'
import { isTeamMember } from '@/lib/platform/permissions'
import { requirePlatformProfile } from '@/lib/platform/security'
import {
  buildSubmissionObjectPath,
  sanitizeFeedbackComment,
  validateSubmissionFile,
} from '@/lib/platform/submissions'
import { supabaseAdmin } from '@/lib/supabase/admin'

function sanitizeText(value: unknown, max = 3000): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max)
}

export async function POST(request: Request) {
  const auth = await requirePlatformProfile()
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status }
    )
  }

  const form = await request.formData()
  const assignmentId = sanitizeText(form.get('task_assignment_id'), 80)
  const rawLink = sanitizeText(form.get('link_url'), 2000)
  const linkUrl = rawLink || null
  const comment = sanitizeFeedbackComment(
    sanitizeText(form.get('comment'), 5000),
    5000
  )
  const uploadedFile = form.get('file')

  if (!assignmentId) {
    return NextResponse.json(
      { ok: false, message: 'task_assignment_id es obligatorio.' },
      { status: 400 }
    )
  }

  if (!linkUrl && !(uploadedFile instanceof File)) {
    return NextResponse.json(
      { ok: false, message: 'Debes enviar un link, archivo o ambos.' },
      { status: 400 }
    )
  }

  const { data: assignment, error: assignmentError } = await supabaseAdmin
    .from('task_assignments')
    .select(
      'id, team_id, edition_id, program_id, submission_mode, allowed_submission_type, status, deadline_at, allow_resubmission, resubmission_deadline_at, max_attempts'
    )
    .eq('id', assignmentId)
    .maybeSingle()

  if (assignmentError || !assignment) {
    return NextResponse.json(
      { ok: false, message: 'Tarea no encontrada.' },
      { status: 404 }
    )
  }

  const member = await isTeamMember(auth.profile.id, assignment.team_id)
  if (!member) {
    return NextResponse.json(
      { ok: false, message: 'Solo miembros del equipo pueden entregar.' },
      { status: 403 }
    )
  }

  const hasLink = Boolean(linkUrl)
  const hasFile = uploadedFile instanceof File
  const allowedSubmissionType = (
    assignment.allowed_submission_type ?? 'both'
  ) as 'link' | 'file' | 'both'

  if (allowedSubmissionType === 'link' && (!hasLink || hasFile)) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Esta tarea acepta solo link. Adjunta URL valida y no subas archivo.',
      },
      { status: 400 }
    )
  }

  if (allowedSubmissionType === 'file' && (!hasFile || hasLink)) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Esta tarea acepta solo archivo. Sube archivo y no adjuntes URL.',
      },
      { status: 400 }
    )
  }

  if (allowedSubmissionType === 'both' && (!hasLink || !hasFile)) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Esta tarea requiere link y archivo. Completa ambos campos para enviar.',
      },
      { status: 400 }
    )
  }

  let filePath: string | null = null
  let fileBucketId: string | null = null
  let fileName: string | null = null
  let fileMime: string | null = null
  let fileSizeBytes: number | null = null

  if (uploadedFile instanceof File) {
    const validFile = await validateSubmissionFile(uploadedFile)
    const objectPath = buildSubmissionObjectPath({
      programId: assignment.program_id,
      editionId: assignment.edition_id,
      teamId: assignment.team_id,
      assignmentId: assignment.id,
      scope: assignment.submission_mode,
      ownerProfileId:
        assignment.submission_mode === 'individual' ? auth.profile.id : null,
      extension: validFile.extension,
    })

    const { error: uploadError } = await supabaseAdmin.storage
      .from('task-submissions')
      .upload(objectPath, validFile.bytes, {
        contentType: validFile.mimeType,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        { ok: false, message: 'No se pudo subir el archivo.' },
        { status: 400 }
      )
    }

    filePath = objectPath
    fileBucketId = 'task-submissions'
    fileName = validFile.sanitizedName
    fileMime = validFile.mimeType
    fileSizeBytes = validFile.size
  }

  const submissionType: 'link' | 'file' | 'both' =
    linkUrl && filePath ? 'both' : linkUrl ? 'link' : 'file'

  const { data: submission, error: submissionError } = await supabaseAdmin
    .from('submissions')
    .insert({
      task_assignment_id: assignment.id,
      team_id: assignment.team_id,
      submission_scope: assignment.submission_mode,
      owner_profile_id:
        assignment.submission_mode === 'individual' ? auth.profile.id : null,
      submission_type: submissionType,
      link_url: linkUrl,
      file_bucket_id: fileBucketId,
      file_path: filePath,
      file_name: fileName,
      file_mime: fileMime,
      file_size_bytes: fileSizeBytes,
      comment: comment || null,
      submitted_by: auth.profile.id,
      status: 'submitted',
    })
    .select(
      'id, task_assignment_id, team_id, submission_scope, owner_profile_id, attempt_number, is_resubmission, created_at'
    )
    .maybeSingle()

  if (submissionError || !submission) {
    if (filePath) {
      await supabaseAdmin.storage.from('task-submissions').remove([filePath])
    }
    return NextResponse.json(
      {
        ok: false,
        message:
          submissionError?.message ?? 'No se pudo registrar la entrega en DB.',
      },
      { status: 400 }
    )
  }

  const title = submission.is_resubmission
    ? 'Nueva reentrega recibida'
    : 'Nueva entrega recibida'
  const body = submission.is_resubmission
    ? 'Se registró una reentrega de estudiante.'
    : 'Se registró una entrega de estudiante.'

  await notifyDocentesAndAdmins({
    teamId: assignment.team_id,
    type: submission.is_resubmission ? 'task_resubmitted' : 'task_submitted',
    title,
    body,
    payload: {
      submission_id: submission.id,
      task_assignment_id: assignment.id,
      attempt_number: submission.attempt_number,
    },
    source: 'submissions',
    createdBy: auth.profile.id,
  })

  await emailDocentesAndAdmins({
    teamId: assignment.team_id,
    subject: title,
    text: `${body} Intento #${submission.attempt_number}.`,
  })

  await touchPlatformActivity({
    userId: auth.profile.id,
    activityType: submission.is_resubmission
      ? 'task_resubmission_created'
      : 'task_submission_created',
    route: '/plataforma/talento/mis-postulaciones/workspace',
    teamId: assignment.team_id,
    editionId: assignment.edition_id,
    programId: assignment.program_id,
    metadata: {
      submission_id: submission.id,
      task_assignment_id: assignment.id,
      attempt_number: submission.attempt_number,
    },
  })

  return NextResponse.json({
    ok: true,
    submission,
  })
}
