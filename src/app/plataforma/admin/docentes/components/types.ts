export type ProfessionalArea = {
  id: string
  code: string
  name: string
  is_active: boolean
}

export type DocenteRow = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  is_active: boolean
  role: string
  professional_area_id: string | null
  password_reset_required: boolean
  created_at: string
  last_login_at: string | null
  active_assignments_count: number
}

export type ProgramRef = {
  id: string
  title: string
  is_published: boolean
}

export type EditionRef = {
  id: string
  program_id: string
  edition_name: string
  is_open: boolean
  starts_at: string | null
  ends_at: string | null
}

export type TeamRef = {
  id: string
  name: string
  edition_id: string
}

export type AssignmentRow = {
  id: string
  docente_profile_id: string
  program_id: string
  edition_id: string
  team_id: string
  staff_role: string | null
  is_active: boolean
  assigned_by: string | null
  created_at: string
  updated_at?: string
  team?: {
    id?: string
    name?: string
    edition_id?: string
  } | null
}

export type DocenteDetail = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  role: string
  is_active: boolean
  professional_area_id: string | null
  password_reset_required: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
  professional_area?: {
    id: string
    code: string
    name: string
    is_active: boolean
  } | null
}
