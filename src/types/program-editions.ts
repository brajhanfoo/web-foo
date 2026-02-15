export type ProgramParticipantRole =
  | 'product_designer'
  | 'frontend_developer'
  | 'backend_developer'
  | 'qa_tester'
  | 'product_manager'
  | 'project_manager'
  | 'ux_ui_designer'
  | 'data_analyst'
  | 'no_code'

export type ProgramEditionTeam = {
  id: string
  edition_id: string
  name: string
  drive_url: string | null
  classroom_url: string | null
  slack_url: string | null
  created_at: string
  updated_at: string
}

export type ProgramEditionMilestone = {
  id: string
  edition_id: string
  team_id: string
  title: string
  meet_url: string | null
  drive_url: string | null
  starts_at: string | null
  position: number | null
  created_at: string
  updated_at: string
}

export type ApplicationFormRow = {
  id: string
  program_id: string
  edition_id: string | null
  version_num: number
  schema_json: unknown
  is_active: boolean
  opens_at: string | null
  closes_at: string | null
  created_at: string
  updated_at: string
}

export type ApplicationParticipantRow = {
  id: string
  applicant_profile_id: string
  edition_id: string | null
  status: string
  applied_role: string | null
  assigned_role: ProgramParticipantRole | null
  team_id: string | null
  certificate_object_path: string | null
  feedback_object_path: string | null
  feedback_notes: string | null
}
