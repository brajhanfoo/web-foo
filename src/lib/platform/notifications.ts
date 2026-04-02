import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendTransactionalEmail } from '@/lib/platform/email'

type NotificationPayload = Record<string, unknown>

type TeamNotificationInput = {
  teamId: string
  type: string
  title: string
  body: string
  payload?: NotificationPayload
  source?: string | null
  createdBy?: string | null
}

function sanitizeText(value: string, max = 2000): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max)
}

export async function notifyTeamMembers(input: TeamNotificationInput) {
  await supabaseAdmin.rpc('notify_team_members_fanout', {
    p_team_id: input.teamId,
    p_type: input.type,
    p_title: sanitizeText(input.title, 140),
    p_body: sanitizeText(input.body),
    p_payload: input.payload ?? {},
    p_source: input.source ?? null,
    p_created_by: input.createdBy ?? null,
  })
}

export async function notifyDocentesAndAdmins(input: TeamNotificationInput) {
  await supabaseAdmin.rpc('notify_docentes_and_admins_fanout', {
    p_team_id: input.teamId,
    p_type: input.type,
    p_title: sanitizeText(input.title, 140),
    p_body: sanitizeText(input.body),
    p_payload: input.payload ?? {},
    p_source: input.source ?? null,
    p_created_by: input.createdBy ?? null,
  })
}

export async function emailTeamMembers(input: {
  teamId: string
  subject: string
  text: string
}) {
  const { data: members } = await supabaseAdmin
    .from('applications')
    .select('applicant_profile_id')
    .eq('team_id', input.teamId)
    .eq('status', 'enrolled')

  const profileIds =
    members
      ?.map((row) => row.applicant_profile_id)
      .filter((value): value is string => Boolean(value)) ?? []

  if (!profileIds.length) return

  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .in('id', profileIds)

  const emails =
    data
      ?.map((row) => row.email)
      .filter((value): value is string => Boolean(value)) ?? []

  await sendTransactionalEmail({
    to: emails,
    subject: sanitizeText(input.subject, 180),
    text: sanitizeText(input.text),
  })
}

export async function emailDocentesAndAdmins(input: {
  teamId: string
  subject: string
  text: string
}) {
  const [docenteRows, adminRows] = await Promise.all([
    supabaseAdmin
      .from('docente_team_assignments')
      .select('docente_profile_id')
      .eq('team_id', input.teamId)
      .eq('is_active', true),
    supabaseAdmin
      .from('profiles')
      .select('email')
      .in('role', ['super_admin', 'admin'])
      .eq('is_active', true),
  ])

  const docenteIds =
    docenteRows.data
      ?.map((row) => row.docente_profile_id)
      .filter((value): value is string => Boolean(value)) ?? []

  const { data: docenteProfiles } = docenteIds.length
    ? await supabaseAdmin.from('profiles').select('id, email').in('id', docenteIds)
    : { data: [] as Array<{ id: string; email: string | null }> }

  const docEmails =
    docenteProfiles
      ?.map((row) => row.email)
      .filter((value): value is string => Boolean(value)) ?? []

  const adminEmails =
    adminRows.data
      ?.map((row) => row.email)
      .filter((value): value is string => Boolean(value)) ?? []

  await sendTransactionalEmail({
    to: [...docEmails, ...adminEmails],
    subject: sanitizeText(input.subject, 180),
    text: sanitizeText(input.text),
  })
}
