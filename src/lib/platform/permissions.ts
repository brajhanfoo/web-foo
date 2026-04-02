import { supabaseAdmin } from '@/lib/supabase/admin'

export async function canManageTeam(
  userId: string,
  teamId: string
): Promise<boolean> {
  const { data } = await supabaseAdmin.rpc('app_can_manage_team', {
    p_user_id: userId,
    p_team_id: teamId,
  })
  return Boolean(data)
}

export async function isDocenteAssigned(
  userId: string,
  teamId: string
): Promise<boolean> {
  const { data } = await supabaseAdmin.rpc('app_is_docente_assigned', {
    p_user_id: userId,
    p_team_id: teamId,
  })
  return Boolean(data)
}

export async function isTeamMember(
  userId: string,
  teamId: string
): Promise<boolean> {
  const { data } = await supabaseAdmin.rpc('app_is_team_member', {
    p_user_id: userId,
    p_team_id: teamId,
  })
  return Boolean(data)
}
