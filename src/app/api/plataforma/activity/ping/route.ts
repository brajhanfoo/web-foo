import { NextResponse } from 'next/server'

import { touchPlatformActivity } from '@/lib/platform/activity'
import { requirePlatformProfile } from '@/lib/platform/security'

type PingBody = {
  activity_type?: string
  route?: string
  program_id?: string | null
  edition_id?: string | null
  team_id?: string | null
  metadata?: Record<string, unknown>
}

export async function POST(request: Request) {
  const auth = await requirePlatformProfile()
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status }
    )
  }

  const body = (await request.json().catch(() => ({}))) as PingBody

  await touchPlatformActivity({
    userId: auth.profile.id,
    activityType: body.activity_type ?? 'heartbeat',
    route: body.route ?? null,
    programId: body.program_id ?? null,
    editionId: body.edition_id ?? null,
    teamId: body.team_id ?? null,
    metadata: body.metadata ?? {},
  })

  return NextResponse.json({ ok: true })
}

