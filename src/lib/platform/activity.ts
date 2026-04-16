import { supabaseAdmin } from '@/lib/supabase/admin'

type TouchActivityInput = {
  userId: string
  activityType?: string
  route?: string | null
  programId?: string | null
  editionId?: string | null
  teamId?: string | null
  metadata?: Record<string, unknown>
}

export async function touchPlatformActivity(input: TouchActivityInput) {
  const payload = {
    p_user_id: input.userId,
    p_activity_type: input.activityType ?? 'heartbeat',
    p_route: input.route ?? null,
    p_program_id: input.programId ?? null,
    p_edition_id: input.editionId ?? null,
    p_team_id: input.teamId ?? null,
    p_metadata: input.metadata ?? {},
  }

  await supabaseAdmin.rpc('touch_user_activity', payload)
}
