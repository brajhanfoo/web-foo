import { supabaseAdmin } from '@/lib/supabase/admin'
import type { AppRole } from '@/lib/platform/security'

export async function canManageTeam(
  userId: string,
  teamId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('app_can_manage_team', {
    p_user_id: userId,
    p_team_id: teamId,
  })
  if (!error) return Boolean(data)

  const [isAdmin, isDocente] = await Promise.all([
    supabaseAdmin.rpc('app_is_admin_level', { p_user_id: userId }),
    supabaseAdmin.rpc('app_is_docente_assigned', {
      p_user_id: userId,
      p_team_id: teamId,
    }),
  ])

  return Boolean(isAdmin.data) || Boolean(isDocente.data)
}

export async function isDocenteAssigned(
  userId: string,
  teamId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('app_is_docente_assigned', {
    p_user_id: userId,
    p_team_id: teamId,
  })
  if (!error) return Boolean(data)

  const { data: fallback } = await supabaseAdmin
    .from('docente_team_assignments')
    .select('id')
    .eq('docente_profile_id', userId)
    .eq('team_id', teamId)
    .eq('is_active', true)
    .maybeSingle()

  return Boolean(fallback?.id)
}

export async function isTeamMember(
  userId: string,
  teamId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('app_is_team_member', {
    p_user_id: userId,
    p_team_id: teamId,
  })
  if (!error) return Boolean(data)

  const { data: fallback } = await supabaseAdmin
    .from('applications')
    .select('id')
    .eq('applicant_profile_id', userId)
    .eq('team_id', teamId)
    .eq('status', 'enrolled')
    .maybeSingle()

  return Boolean(fallback?.id)
}

export async function canReviewTeamSubmissions(
  userId: string,
  role: AppRole,
  teamId: string
): Promise<boolean> {
  if (role === 'super_admin' || role === 'admin') return true
  if (role !== 'docente') return false
  return isDocenteAssigned(userId, teamId)
}
