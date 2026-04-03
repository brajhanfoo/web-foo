import { NextResponse } from 'next/server'

import {
  canReviewTeamSubmissions,
  isTeamMember,
} from '@/lib/platform/permissions'
import { requirePlatformProfile } from '@/lib/platform/security'
import { supabaseAdmin } from '@/lib/supabase/admin'

function sanitizeText(value: unknown, max = 2000): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max)
}

function normalizeLink(raw: string): string | null {
  const value = sanitizeText(raw, 2000)
  if (!value) return null

  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }
    return url.toString()
  } catch {
    return null
  }
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
  const submissionId = sanitizeText(url.searchParams.get('submission_id'), 80)
  if (!submissionId) {
    return NextResponse.json(
      { ok: false, message: 'submission_id es obligatorio.' },
      { status: 400 }
    )
  }

  const { data: submission, error } = await supabaseAdmin
    .from('submissions')
    .select('id, team_id, submission_scope, owner_profile_id, link_url')
    .eq('id', submissionId)
    .maybeSingle()

  const linkUrl = normalizeLink(submission?.link_url ?? '')
  if (error || !submission || !linkUrl) {
    return NextResponse.json(
      { ok: false, message: 'Link de entrega no disponible.' },
      { status: 404 }
    )
  }

  const canReadAsReviewer = await canReviewTeamSubmissions(
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

  if (!canReadAsReviewer && !canReadAsTalent) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos para este link.' },
      { status: 403 }
    )
  }

  return NextResponse.json({ ok: true, link_url: linkUrl })
}

