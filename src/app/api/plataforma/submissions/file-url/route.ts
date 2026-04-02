import { NextResponse } from 'next/server'

import {
  canReviewTeamSubmissions,
  isTeamMember,
} from '@/lib/platform/permissions'
import { requirePlatformProfile } from '@/lib/platform/security'
import { supabaseAdmin } from '@/lib/supabase/admin'

function sanitizeText(value: unknown, max = 80): string {
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

  const url = new URL(request.url)
  const submissionId = sanitizeText(url.searchParams.get('submission_id'))
  if (!submissionId) {
    return NextResponse.json(
      { ok: false, message: 'submission_id es obligatorio.' },
      { status: 400 }
    )
  }

  const { data: submission, error } = await supabaseAdmin
    .from('submissions')
    .select(
      'id, team_id, submission_scope, owner_profile_id, file_bucket_id, file_path'
    )
    .eq('id', submissionId)
    .maybeSingle()

  if (error || !submission || !submission.file_path) {
    return NextResponse.json(
      { ok: false, message: 'Archivo de entrega no disponible.' },
      { status: 404 }
    )
  }

  const canReadAsManager = await canReviewTeamSubmissions(
    auth.profile.id,
    auth.profile.role,
    submission.team_id
  )

  const canReadAsTalent =
    auth.profile.role === 'talent'
      ? submission.submission_scope === 'team'
        ? await isTeamMember(auth.profile.id, submission.team_id)
        : submission.owner_profile_id === auth.profile.id
      : false

  if (!canReadAsManager && !canReadAsTalent) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos para este archivo.' },
      { status: 403 }
    )
  }

  const bucket =
    sanitizeText(submission.file_bucket_id, 120) || 'task-submissions'
  const { data: signed, error: signedError } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(submission.file_path, 600)

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo generar URL firmada.' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true, signed_url: signed.signedUrl })
}
