'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import {
  formatDateTimeInTimeZone,
  PLATFORM_TIMEZONE,
  PLATFORM_TIMEZONE_LABEL,
} from '@/lib/platform/timezone'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import type {
  ProgramEditionMilestone,
  ProgramEditionTeam,
} from '@/types/program-editions'
import type { EditionRow, ProgramRowBase } from '@/types/programs'

type StudentRow = {
  id: string
  applicant_profile_id: string
  assigned_role: string | null
  applicant_profile: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  } | null
}

type DocenteRow = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
}

type DocenteAssignmentRow = {
  id: string
  docente_profile_id: string
  team_id: string
  staff_role: string | null
  is_active: boolean
}

type TeamScheduleSlot = {
  id: string
  team_id: string
  day_of_week: number
  start_time: string
  end_time: string
  timezone: string
}

type TaskAssignmentRow = {
  id: string
  milestone_id: string
  team_id: string
  submission_mode: 'team' | 'individual'
  allowed_submission_type: 'link' | 'file' | 'both'
  deadline_at: string | null
  allow_resubmission: boolean
  resubmission_deadline_at: string | null
  max_attempts: number
  grading_mode: 'score_100' | 'pass_fail' | 'none'
  status: 'draft' | 'published' | 'closed' | 'archived'
  task_template: {
    id: string
    title: string
    description: string | null
    instructions: string | null
  } | null
  milestone: {
    id: string
    title: string
    position: number | null
    starts_at: string | null
  } | null
}

const DAY_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miercoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sabado',
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toDateOnlyOrNull(value: string): string | null {
  const v = value.trim()
  if (!v) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  return v
}

function formatDate(value: string | null): string {
  return formatDateTimeInTimeZone(value, PLATFORM_TIMEZONE)
}

function formatDateRange(startsAt: string | null, endsAt: string | null) {
  const start = startsAt ?? '--'
  const end = endsAt ?? '--'
  return `${start} -> ${end}`
}

function docenteName(docente: DocenteRow): string {
  const full = `${docente.first_name ?? ''} ${docente.last_name ?? ''}`.trim()
  return full || docente.email || 'Docente'
}

function studentName(student: StudentRow): string {
  const full =
    `${student.applicant_profile?.first_name ?? ''} ${student.applicant_profile?.last_name ?? ''}`.trim()
  return full || student.applicant_profile?.email || 'Estudiante'
}

function submissionTypeLabel(value: 'link' | 'file' | 'both'): string {
  if (value === 'link') return 'Solo link'
  if (value === 'file') return 'Solo archivo'
  return 'Link y archivo'
}

export default function AdminTeamDetailPage() {
  const params = useParams<{
    programId: string
    editionId: string
    teamId: string
  }>()
  const { showError, showSuccess, showWarning } = useToastEnhanced()

  const programId = params.programId
  const editionId = params.editionId
  const teamId = params.teamId

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [savingTeam, setSavingTeam] = useState(false)

  const [program, setProgram] = useState<ProgramRowBase | null>(null)
  const [edition, setEdition] = useState<EditionRow | null>(null)
  const [team, setTeam] = useState<ProgramEditionTeam | null>(null)

  const [milestones, setMilestones] = useState<ProgramEditionMilestone[]>([])
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignmentRow[]>(
    []
  )
  const [students, setStudents] = useState<StudentRow[]>([])
  const [docentes, setDocentes] = useState<DocenteRow[]>([])
  const [docenteAssignments, setDocenteAssignments] = useState<
    DocenteAssignmentRow[]
  >([])
  const [scheduleSlots, setScheduleSlots] = useState<TeamScheduleSlot[]>([])

  const [teamName, setTeamName] = useState('')
  const [teamDriveUrl, setTeamDriveUrl] = useState('')
  const [teamClassroomUrl, setTeamClassroomUrl] = useState('')
  const [teamSlackUrl, setTeamSlackUrl] = useState('')

  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] =
    useState<ProgramEditionMilestone | null>(null)
  const [milestoneToDelete, setMilestoneToDelete] =
    useState<ProgramEditionMilestone | null>(null)
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneMeetUrl, setMilestoneMeetUrl] = useState('')
  const [milestoneDriveUrl, setMilestoneDriveUrl] = useState('')
  const [milestoneStartsAt, setMilestoneStartsAt] = useState('')
  const [milestonePosition, setMilestonePosition] = useState('')

  const [selectedDocenteId, setSelectedDocenteId] = useState('none')
  const [staffRole, setStaffRole] = useState('')

  const [slotDayOfWeek, setSlotDayOfWeek] = useState('1')
  const [slotStartTime, setSlotStartTime] = useState('19:00')
  const [slotEndTime, setSlotEndTime] = useState('21:00')
  const [slotTimezone, setSlotTimezone] = useState(PLATFORM_TIMEZONE)

  const [taskMilestoneId, setTaskMilestoneId] = useState<string | null>(null)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskInstructions, setTaskInstructions] = useState('')
  const [taskSubmissionMode, setTaskSubmissionMode] = useState<
    'team' | 'individual'
  >('team')
  const [taskAllowedSubmissionType, setTaskAllowedSubmissionType] = useState<
    'link' | 'file' | 'both'
  >('both')
  const [taskGradingMode, setTaskGradingMode] = useState<
    'score_100' | 'pass_fail' | 'none'
  >('score_100')
  const [taskDeadlineAt, setTaskDeadlineAt] = useState('')
  const [taskAllowResubmission, setTaskAllowResubmission] = useState(false)
  const [taskResubDeadlineAt, setTaskResubDeadlineAt] = useState('')
  const [taskMaxAttempts, setTaskMaxAttempts] = useState('1')
  const [taskStatus, setTaskStatus] = useState<'draft' | 'published'>('draft')

  const [editingTask, setEditingTask] = useState<TaskAssignmentRow | null>(null)
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskDescription, setEditTaskDescription] = useState('')
  const [editTaskInstructions, setEditTaskInstructions] = useState('')
  const [editTaskAllowedSubmissionType, setEditTaskAllowedSubmissionType] =
    useState<'link' | 'file' | 'both'>('both')

  useEffect(() => {
    if (!programId || !editionId || !teamId) return
    void loadAll()
  }, [programId, editionId, teamId])
  async function loadCore() {
    const [programResponse, editionResponse, teamResponse, milestonesResponse] =
      await Promise.all([
        supabase
          .from('programs')
          .select('id, slug, title, description')
          .eq('id', programId)
          .maybeSingle(),
        supabase
          .from('program_editions')
          .select(
            'id, program_id, edition_name, starts_at, ends_at, is_open, created_at, updated_at'
          )
          .eq('id', editionId)
          .maybeSingle(),
        supabase
          .from('program_edition_teams')
          .select(
            'id, edition_id, name, drive_url, classroom_url, slack_url, created_at, updated_at'
          )
          .eq('id', teamId)
          .eq('edition_id', editionId)
          .maybeSingle(),
        supabase
          .from('program_edition_milestones')
          .select(
            'id, edition_id, team_id, title, meet_url, drive_url, starts_at, position, created_at, updated_at'
          )
          .eq('edition_id', editionId)
          .eq('team_id', teamId)
          .order('position', { ascending: true, nullsFirst: false })
          .order('starts_at', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: true }),
      ])

    if (programResponse.error || !programResponse.data) {
      showError('No se pudo cargar el programa.')
    } else {
      setProgram(programResponse.data as ProgramRowBase)
    }

    if (editionResponse.error || !editionResponse.data) {
      showError('No se pudo cargar la edicion.')
    } else {
      setEdition(editionResponse.data as EditionRow)
    }

    if (teamResponse.error || !teamResponse.data) {
      showError('No se pudo cargar el equipo.')
    } else {
      const row = teamResponse.data as ProgramEditionTeam
      setTeam(row)
      setTeamName(row.name)
      setTeamDriveUrl(row.drive_url ?? '')
      setTeamClassroomUrl(row.classroom_url ?? '')
      setTeamSlackUrl(row.slack_url ?? '')
    }

    if (milestonesResponse.error) {
      showError('No se pudieron cargar hitos.')
      setMilestones([])
    } else {
      setMilestones(
        (milestonesResponse.data ?? []) as ProgramEditionMilestone[]
      )
    }

    const studentsResponse = await supabase
      .from('applications')
      .select(
        'id, applicant_profile_id, assigned_role, applicant_profile:profiles(id, first_name, last_name, email)'
      )
      .eq('team_id', teamId)
      .eq('edition_id', editionId)
      .eq('status', 'enrolled')
      .order('created_at', { ascending: true })

    if (studentsResponse.error) {
      showError('No se pudieron cargar estudiantes del equipo.')
      setStudents([])
    } else {
      setStudents((studentsResponse.data ?? []) as unknown as StudentRow[])
    }
  }

  async function loadTasks() {
    const response = await fetch(
      `/api/plataforma/tasks/assignments?team_id=${teamId}`,
      {
        cache: 'no-store',
      }
    )
    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      assignments?: TaskAssignmentRow[]
      message?: string
    } | null

    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudieron cargar tareas.')
      setTaskAssignments([])
      return
    }

    setTaskAssignments(payload.assignments ?? [])
  }

  async function loadDocenteContext() {
    const [docentesResponse, assignmentsResponse, scheduleResponse] =
      await Promise.all([
        fetch('/api/plataforma/admin/docentes', { cache: 'no-store' }),
        fetch(`/api/plataforma/admin/docente-assignments?team_id=${teamId}`, {
          cache: 'no-store',
        }),
        fetch(`/api/plataforma/admin/team-schedule-slots?team_id=${teamId}`, {
          cache: 'no-store',
        }),
      ])

    const docentesPayload = (await docentesResponse
      .json()
      .catch(() => null)) as {
      ok: boolean
      docentes?: DocenteRow[]
      message?: string
    } | null

    const assignmentsPayload = (await assignmentsResponse
      .json()
      .catch(() => null)) as {
      ok: boolean
      assignments?: DocenteAssignmentRow[]
      conflicts?: Array<{
        conflict_team_name?: string
        day_of_week?: number
        start_time?: string
        end_time?: string
      }>
      message?: string
    } | null

    const schedulePayload = (await scheduleResponse
      .json()
      .catch(() => null)) as {
      ok: boolean
      slots?: TeamScheduleSlot[]
      message?: string
    } | null

    if (!docentesResponse.ok || !docentesPayload?.ok) {
      showError(docentesPayload?.message ?? 'No se pudieron cargar docentes.')
      setDocentes([])
    } else {
      setDocentes(docentesPayload.docentes ?? [])
    }

    if (!assignmentsResponse.ok || !assignmentsPayload?.ok) {
      showError(
        assignmentsPayload?.message ?? 'No se pudieron cargar asignaciones.'
      )
      setDocenteAssignments([])
    } else {
      setDocenteAssignments(assignmentsPayload.assignments ?? [])
    }

    if (!scheduleResponse.ok || !schedulePayload?.ok) {
      showError(schedulePayload?.message ?? 'No se pudieron cargar horarios.')
      setScheduleSlots([])
    } else {
      setScheduleSlots(schedulePayload.slots ?? [])
    }
  }

  async function loadAll() {
    setLoading(true)
    await loadCore()
    await Promise.all([loadTasks(), loadDocenteContext()])
    setLoading(false)
  }

  async function saveTeam() {
    if (!team) return
    const name = teamName.trim()
    if (!name) {
      showError('Pone un nombre de equipo.')
      return
    }

    setSavingTeam(true)
    const response = await supabase
      .from('program_edition_teams')
      .update({
        name,
        drive_url: teamDriveUrl.trim() || null,
        classroom_url: teamClassroomUrl.trim() || null,
        slack_url: teamSlackUrl.trim() || null,
      })
      .eq('id', team.id)
      .select('*')
      .maybeSingle()
    setSavingTeam(false)

    if (response.error || !response.data) {
      showError(
        `No se pudo guardar el equipo. ${safeString(response.error?.message)}`
      )
      return
    }

    const updated = response.data as ProgramEditionTeam
    setTeam(updated)
    setTeamName(updated.name)
    setTeamDriveUrl(updated.drive_url ?? '')
    setTeamClassroomUrl(updated.classroom_url ?? '')
    setTeamSlackUrl(updated.slack_url ?? '')
    showSuccess('Equipo actualizado.')
  }

  function openMilestoneModal(milestone?: ProgramEditionMilestone) {
    if (milestone) {
      setEditingMilestone(milestone)
      setMilestoneTitle(milestone.title)
      setMilestoneMeetUrl(milestone.meet_url ?? '')
      setMilestoneDriveUrl(milestone.drive_url ?? '')
      setMilestoneStartsAt(milestone.starts_at ?? '')
      setMilestonePosition(
        typeof milestone.position === 'number' ? String(milestone.position) : ''
      )
    } else {
      setEditingMilestone(null)
      setMilestoneTitle('')
      setMilestoneMeetUrl('')
      setMilestoneDriveUrl('')
      setMilestoneStartsAt('')
      setMilestonePosition('')
    }
    setMilestoneModalOpen(true)
  }

  async function saveMilestone() {
    const title = milestoneTitle.trim()
    if (!title) {
      showError('El titulo es obligatorio.')
      return
    }

    const positionRaw = milestonePosition.trim()
    const positionValue = positionRaw ? Number(positionRaw) : null
    if (positionRaw && !Number.isFinite(positionValue)) {
      showError('Posicion invalida.')
      return
    }

    const basePayload = {
      title,
      meet_url: milestoneMeetUrl.trim() || null,
      drive_url: milestoneDriveUrl.trim() || null,
      starts_at: toDateOnlyOrNull(milestoneStartsAt),
      position: positionValue,
    }

    const response = editingMilestone
      ? await supabase
          .from('program_edition_milestones')
          .update(basePayload)
          .eq('id', editingMilestone.id)
          .eq('team_id', teamId)
          .select('*')
          .maybeSingle()
      : await supabase
          .from('program_edition_milestones')
          .insert({
            ...basePayload,
            edition_id: editionId,
            team_id: teamId,
          })
          .select('*')
          .maybeSingle()

    if (response.error || !response.data) {
      showError(
        `No se pudo guardar hito. ${safeString(response.error?.message)}`
      )
      return
    }

    setMilestoneModalOpen(false)
    showSuccess(editingMilestone ? 'Hito actualizado.' : 'Hito creado.')
    await loadCore()
  }

  async function deleteMilestone() {
    if (!milestoneToDelete) return

    const response = await supabase
      .from('program_edition_milestones')
      .delete()
      .eq('id', milestoneToDelete.id)
      .eq('team_id', teamId)

    if (response.error) {
      showError(
        `No se pudo eliminar hito. ${safeString(response.error.message)}`
      )
      return
    }

    setMilestones((prev) =>
      prev.filter((milestone) => milestone.id !== milestoneToDelete.id)
    )
    setMilestoneToDelete(null)
    showSuccess('Hito eliminado.')
    await loadTasks()
  }
  function openCreateTaskModal(milestoneId: string) {
    setTaskMilestoneId(milestoneId)
    setTaskTitle('')
    setTaskDescription('')
    setTaskInstructions('')
    setTaskSubmissionMode('team')
    setTaskAllowedSubmissionType('both')
    setTaskGradingMode('score_100')
    setTaskDeadlineAt('')
    setTaskAllowResubmission(false)
    setTaskResubDeadlineAt('')
    setTaskMaxAttempts('1')
    setTaskStatus('draft')
  }

  async function createTask() {
    if (!taskMilestoneId || !taskTitle.trim()) {
      showError('Completa el titulo de la tarea.')
      return
    }

    setBusy(true)
    const response = await fetch('/api/plataforma/tasks/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_id: teamId,
        milestone_id: taskMilestoneId,
        title: taskTitle,
        description: taskDescription,
        instructions: taskInstructions,
        submission_mode: taskSubmissionMode,
        allowed_submission_type: taskAllowedSubmissionType,
        grading_mode: taskGradingMode,
        deadline_at: taskDeadlineAt || null,
        allow_resubmission: taskAllowResubmission,
        resubmission_deadline_at: taskAllowResubmission
          ? taskResubDeadlineAt || null
          : null,
        max_attempts: Number(taskMaxAttempts || 1),
        status: taskStatus,
      }),
    })
    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      message?: string
    } | null
    setBusy(false)

    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo crear tarea.')
      return
    }

    showSuccess('Tarea creada.')
    setTaskMilestoneId(null)
    await loadTasks()
  }

  function openTaskEditor(task: TaskAssignmentRow) {
    setEditingTask(task)
    setEditTaskTitle(task.task_template?.title ?? '')
    setEditTaskDescription(task.task_template?.description ?? '')
    setEditTaskInstructions(task.task_template?.instructions ?? '')
    setEditTaskAllowedSubmissionType(task.allowed_submission_type ?? 'both')
  }

  async function saveTaskEdits() {
    if (!editingTask) return
    if (!editTaskTitle.trim()) {
      showError('El titulo no puede estar vacio.')
      return
    }

    setBusy(true)
    const response = await fetch('/api/plataforma/tasks/assignments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignment_id: editingTask.id,
        title: editTaskTitle,
        description: editTaskDescription,
        instructions: editTaskInstructions,
        allowed_submission_type: editTaskAllowedSubmissionType,
      }),
    })
    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      message?: string
    } | null
    setBusy(false)

    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo editar tarea.')
      return
    }

    showSuccess('Tarea actualizada.')
    setEditingTask(null)
    await loadTasks()
  }

  async function updateTaskStatus(
    assignmentId: string,
    status: 'draft' | 'published' | 'closed' | 'archived'
  ) {
    setBusy(true)
    const response = await fetch('/api/plataforma/tasks/assignments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignment_id: assignmentId, status }),
    })
    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      message?: string
    } | null
    setBusy(false)

    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo actualizar estado.')
      return
    }

    showSuccess('Estado actualizado.')
    await loadTasks()
  }

  async function assignDocente() {
    if (selectedDocenteId === 'none') {
      showError('Selecciona un docente.')
      return
    }

    setBusy(true)
    const response = await fetch('/api/plataforma/admin/docente-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        docente_profile_id: selectedDocenteId,
        team_id: teamId,
        staff_role: staffRole.trim() || null,
      }),
    })

    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      conflicts?: Array<{
        conflict_team_name?: string
        day_of_week?: number
        start_time?: string
        end_time?: string
      }>
      message?: string
    } | null

    setBusy(false)

    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo asignar docente.')
      return
    }

    if (payload.conflicts?.length) {
      const summary = payload.conflicts
        .slice(0, 2)
        .map((conflict) => {
          const day = DAY_LABELS[conflict.day_of_week ?? 0] ?? ''
          return `${conflict.conflict_team_name ?? 'Equipo'} ${day} ${conflict.start_time ?? ''}-${conflict.end_time ?? ''}`
        })
        .join(' | ')

      showWarning('Asignacion creada con conflicto horario.', summary)
    } else {
      showSuccess('Docente asignado.')
    }

    setSelectedDocenteId('none')
    setStaffRole('')
    await loadDocenteContext()
  }

  async function removeDocenteAssignment(assignmentId: string) {
    setBusy(true)
    const response = await fetch('/api/plataforma/admin/docente-assignments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignment_id: assignmentId }),
    })
    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      message?: string
    } | null
    setBusy(false)

    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo quitar docente.')
      return
    }

    showSuccess('Asignacion removida.')
    await loadDocenteContext()
  }

  async function addScheduleSlot() {
    setBusy(true)
    const response = await fetch('/api/plataforma/admin/team-schedule-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_id: teamId,
        day_of_week: Number(slotDayOfWeek),
        start_time: slotStartTime,
        end_time: slotEndTime,
        timezone: slotTimezone,
      }),
    })
    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      message?: string
    } | null
    setBusy(false)

    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo agregar horario.')
      return
    }

    showSuccess('Horario agregado.')
    await loadDocenteContext()
  }

  async function deleteScheduleSlot(slotId: string) {
    setBusy(true)
    const response = await fetch('/api/plataforma/admin/team-schedule-slots', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: slotId }),
    })
    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      message?: string
    } | null
    setBusy(false)

    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo eliminar horario.')
      return
    }

    showSuccess('Horario eliminado.')
    await loadDocenteContext()
  }

  const tasksByMilestone = useMemo(() => {
    const map = new Map<string, TaskAssignmentRow[]>()
    const withoutMilestone: TaskAssignmentRow[] = []

    for (const task of taskAssignments) {
      if (task.milestone_id) {
        const bucket = map.get(task.milestone_id) ?? []
        bucket.push(task)
        map.set(task.milestone_id, bucket)
      } else {
        withoutMilestone.push(task)
      }
    }

    return { map, withoutMilestone }
  }, [taskAssignments])

  const docenteById = useMemo(() => {
    const map = new Map<string, DocenteRow>()
    for (const docente of docentes) {
      map.set(docente.id, docente)
    }
    return map
  }, [docentes])
  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
          Cargando equipo...
        </div>
      </div>
    )
  }

  if (!program || !edition || !team) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
          No se encontro el equipo.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/plataforma/admin/programas/${programId}/ediciones/${editionId}`}
            className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-slate-100 break-words">
              {program.title} / {edition.edition_name} / {team.name}
            </h1>
            <div className="text-sm text-slate-300">
              {formatDateRange(edition.starts_at, edition.ends_at)}
            </div>
            <div className="text-xs text-slate-400">
              Zona horaria oficial: {PLATFORM_TIMEZONE_LABEL}
            </div>
          </div>
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader>
          <CardTitle>Equipo</CardTitle>
          <CardDescription className="text-slate-300">
            Actualiza nombre y enlaces principales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Drive</Label>
              <Input
                value={teamDriveUrl}
                onChange={(event) => setTeamDriveUrl(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Classroom</Label>
              <Input
                value={teamClassroomUrl}
                onChange={(event) => setTeamClassroomUrl(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Slack</Label>
            <Input
              value={teamSlackUrl}
              onChange={(event) => setTeamSlackUrl(event.target.value)}
            />
          </div>

          <div className="flex items-center justify-end">
            <Button onClick={saveTeam} disabled={savingTeam} className="gap-2">
              <Save className="h-4 w-4" /> Guardar equipo
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader>
            <CardTitle>Estudiantes asignados</CardTitle>
            <CardDescription className="text-slate-300">
              Contexto actual del equipo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {students.length === 0 ? (
              <div className="text-sm text-slate-400">
                Sin estudiantes enrolados.
              </div>
            ) : (
              students.map((student) => (
                <div
                  key={student.id}
                  className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2"
                >
                  <div className="text-sm font-semibold text-slate-100">
                    {studentName(student)}
                  </div>
                  <div className="text-xs text-slate-400">
                    {student.applicant_profile?.email ?? 'Sin email'}
                  </div>
                  <div className="text-xs text-slate-500">
                    Rol asignado: {student.assigned_role ?? '--'}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader>
            <CardTitle>Docentes asignados</CardTitle>
            <CardDescription className="text-slate-300">
              Asignacion contextual por equipo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Docente</Label>
                <Select
                  value={selectedDocenteId}
                  onValueChange={setSelectedDocenteId}
                >
                  <SelectTrigger className="border-slate-800 bg-slate-950">
                    <SelectValue placeholder="Selecciona docente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecciona</SelectItem>
                    {docentes.map((docente) => (
                      <SelectItem key={docente.id} value={docente.id}>
                        {docenteName(docente)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rol (opcional)</Label>
                <Input
                  value={staffRole}
                  onChange={(event) => setStaffRole(event.target.value)}
                  className="border-slate-800 bg-slate-950"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button disabled={busy} onClick={() => void assignDocente()}>
                Asignar docente
              </Button>
            </div>

            <div className="space-y-2">
              {docenteAssignments.length === 0 ? (
                <div className="text-sm text-slate-400">
                  Sin docentes asignados.
                </div>
              ) : (
                docenteAssignments.map((assignment) => {
                  const docente = docenteById.get(assignment.docente_profile_id)
                  return (
                    <div
                      key={assignment.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-100">
                          {docente ? docenteName(docente) : 'Docente'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {assignment.staff_role || 'Sin rol especifico'}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busy}
                        onClick={() =>
                          void removeDocenteAssignment(assignment.id)
                        }
                      >
                        Quitar
                      </Button>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader>
          <CardTitle>Horarios del equipo</CardTitle>
          <CardDescription className="text-slate-300">
            Soporte para advertencia de conflictos. Default:{' '}
            {PLATFORM_TIMEZONE_LABEL}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Select value={slotDayOfWeek} onValueChange={setSlotDayOfWeek}>
              <SelectTrigger className="border-slate-800 bg-slate-950">
                <SelectValue placeholder="Dia" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DAY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="time"
              value={slotStartTime}
              onChange={(event) => setSlotStartTime(event.target.value)}
              className="border-slate-800 bg-slate-950"
            />
            <Input
              type="time"
              value={slotEndTime}
              onChange={(event) => setSlotEndTime(event.target.value)}
              className="border-slate-800 bg-slate-950"
            />
            <Input
              value={slotTimezone}
              onChange={(event) => setSlotTimezone(event.target.value)}
              className="border-slate-800 bg-slate-950"
            />
          </div>
          <div className="text-xs text-slate-400">
            Usa zona horaria IANA (ej. {PLATFORM_TIMEZONE}).
          </div>

          <div className="flex justify-end">
            <Button disabled={busy} onClick={() => void addScheduleSlot()}>
              Agregar horario
            </Button>
          </div>

          <div className="space-y-2">
            {scheduleSlots.length === 0 ? (
              <div className="text-sm text-slate-400">
                Sin horarios configurados.
              </div>
            ) : (
              scheduleSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2"
                >
                  <div className="text-xs text-slate-300">
                    {DAY_LABELS[slot.day_of_week] ?? slot.day_of_week} ·{' '}
                    {slot.start_time} - {slot.end_time} ({slot.timezone})
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => void deleteScheduleSlot(slot.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-slate-800" />

      <Card className="bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Hitos y tareas del equipo</CardTitle>
          </div>
          <Button
            onClick={() => openMilestoneModal()}
            className="gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" /> Nuevo hito
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs text-slate-400">
            Deadlines en {PLATFORM_TIMEZONE_LABEL}.
          </div>
          {milestones.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-700 bg-slate-950 p-4 text-sm text-slate-400">
              No hay hitos para este equipo.
            </div>
          ) : (
            milestones.map((milestone) => {
              const tasks = tasksByMilestone.map.get(milestone.id) ?? []

              return (
                <div
                  key={milestone.id}
                  className="space-y-3 rounded-lg border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-100 break-words">
                          {milestone.title}
                        </h3>
                        <Badge className="border border-slate-700 bg-slate-900 text-slate-200">
                          Posicion {milestone.position ?? '--'}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-400">
                        Inicio: {milestone.starts_at ?? '--'}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs">
                        {milestone.meet_url ? (
                          <a
                            href={milestone.meet_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-300 hover:underline"
                          >
                            Meet
                          </a>
                        ) : null}
                        {milestone.drive_url ? (
                          <a
                            href={milestone.drive_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-300 hover:underline"
                          >
                            Drive
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-700 bg-slate-900 text-slate-100"
                        onClick={() => openCreateTaskModal(milestone.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Nueva tarea
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-700 bg-slate-900 text-slate-100"
                        onClick={() => openMilestoneModal(milestone)}
                      >
                        Editar hito
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setMilestoneToDelete(milestone)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {tasks.length === 0 ? (
                    <div className="rounded-md border border-dashed border-slate-700 p-3 text-xs text-slate-400">
                      Este hito aun no tiene tareas.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-md border border-slate-800 bg-slate-900 p-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 space-y-1">
                              <div className="text-sm font-semibold text-slate-100 break-words">
                                {task.task_template?.title ??
                                  'Tarea sin titulo'}
                              </div>
                              <div className="text-xs text-slate-400">
                                {task.task_template?.description ??
                                  'Sin descripcion'}
                              </div>
                              <div className="text-xs text-slate-500">
                                Entrega: {task.submission_mode} · Deadline:{' '}
                                {formatDate(task.deadline_at)} · Max intentos:{' '}
                                {task.max_attempts}
                              </div>
                              <div className="text-xs text-slate-500">
                                Tipo entrega:{' '}
                                {submissionTypeLabel(
                                  task.allowed_submission_type ?? 'both'
                                )}
                              </div>
                              <div className="text-xs text-slate-500">
                                Reentrega:{' '}
                                {task.allow_resubmission ? 'si' : 'no'}
                                {task.allow_resubmission
                                  ? ` (hasta ${formatDate(task.resubmission_deadline_at)})`
                                  : ''}
                              </div>
                            </div>
                            <Badge className="border border-slate-700 bg-slate-800 text-slate-100">
                              {task.status}
                            </Badge>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-700 bg-slate-900 text-slate-100"
                              onClick={() => openTaskEditor(task)}
                            >
                              Editar contenido
                            </Button>
                            {task.status !== 'published' ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  void updateTaskStatus(task.id, 'published')
                                }
                                disabled={busy}
                              >
                                Publicar
                              </Button>
                            ) : null}
                            {task.status !== 'closed' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-700 bg-slate-900 text-slate-100"
                                onClick={() =>
                                  void updateTaskStatus(task.id, 'closed')
                                }
                                disabled={busy}
                              >
                                Cerrar
                              </Button>
                            ) : null}
                            {task.status !== 'archived' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-700 bg-slate-900 text-slate-100"
                                onClick={() =>
                                  void updateTaskStatus(task.id, 'archived')
                                }
                                disabled={busy}
                              >
                                Archivar
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}

          {tasksByMilestone.withoutMilestone.length > 0 ? (
            <div className="space-y-2 rounded-lg border border-amber-600/30 bg-amber-900/10 p-4">
              <div className="text-sm font-medium text-amber-200">
                Tareas sin hito visible
              </div>
              <div className="text-xs text-amber-300/80">
                Estas tareas existen pero no quedaron vinculadas a un hito
                cargado en esta vista.
              </div>
              {tasksByMilestone.withoutMilestone.map((task) => (
                <div
                  key={task.id}
                  className="rounded-md border border-amber-600/40 bg-amber-900/10 p-3"
                >
                  <div className="text-sm text-amber-100">
                    {task.task_template?.title ?? 'Tarea sin titulo'}
                  </div>
                  <div className="text-xs text-amber-200/80">
                    Estado: {task.status} · Deadline:{' '}
                    {formatDate(task.deadline_at)}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={milestoneModalOpen}
        onOpenChange={(open) => {
          setMilestoneModalOpen(open)
          if (!open) setEditingMilestone(null)
        }}
      >
        <DialogContent className="border-slate-800 bg-slate-950 text-slate-100 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingMilestone ? 'Editar hito' : 'Crear hito'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Configura fechas y enlaces del hito para este equipo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input
                value={milestoneTitle}
                onChange={(event) => setMilestoneTitle(event.target.value)}
                className="border-slate-800 bg-slate-900"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Fecha inicio (YYYY-MM-DD)</Label>
                <Input
                  value={milestoneStartsAt}
                  onChange={(event) => setMilestoneStartsAt(event.target.value)}
                  className="border-slate-800 bg-slate-900"
                  placeholder="2026-04-15"
                />
              </div>
              <div className="space-y-2">
                <Label>Posicion</Label>
                <Input
                  value={milestonePosition}
                  onChange={(event) => setMilestonePosition(event.target.value)}
                  className="border-slate-800 bg-slate-900"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Meet URL</Label>
              <Input
                value={milestoneMeetUrl}
                onChange={(event) => setMilestoneMeetUrl(event.target.value)}
                className="border-slate-800 bg-slate-900"
              />
            </div>
            <div className="space-y-2">
              <Label>Drive URL</Label>
              <Input
                value={milestoneDriveUrl}
                onChange={(event) => setMilestoneDriveUrl(event.target.value)}
                className="border-slate-800 bg-slate-900"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-700 bg-slate-900 text-slate-100"
              onClick={() => setMilestoneModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={() => void saveMilestone()} disabled={busy}>
              Guardar hito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(taskMilestoneId)}
        onOpenChange={(open) => {
          if (!open) setTaskMilestoneId(null)
        }}
      >
        <DialogContent className="border-slate-800 bg-slate-950 text-slate-100 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva tarea del hito</DialogTitle>
            <DialogDescription className="text-slate-400">
              Esta tarea se crea dentro del hito seleccionado del equipo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                className="border-slate-800 bg-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
                className="border-slate-800 bg-slate-900"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Instrucciones</Label>
              <Textarea
                value={taskInstructions}
                onChange={(event) => setTaskInstructions(event.target.value)}
                className="border-slate-800 bg-slate-900"
                rows={4}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Modo entrega</Label>
                <Select
                  value={taskSubmissionMode}
                  onValueChange={(value) =>
                    setTaskSubmissionMode(value as 'team' | 'individual')
                  }
                >
                  <SelectTrigger className="border-slate-800 bg-slate-900">
                    <SelectValue placeholder="Modo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team">Equipo</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de entrega</Label>
                <Select
                  value={taskAllowedSubmissionType}
                  onValueChange={(value) =>
                    setTaskAllowedSubmissionType(
                      value as 'link' | 'file' | 'both'
                    )
                  }
                >
                  <SelectTrigger className="border-slate-800 bg-slate-900">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Solo link</SelectItem>
                    <SelectItem value="file">Solo archivo</SelectItem>
                    <SelectItem value="both">Link y archivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Evaluacion</Label>
                <Select
                  value={taskGradingMode}
                  onValueChange={(value) =>
                    setTaskGradingMode(
                      value as 'score_100' | 'pass_fail' | 'none'
                    )
                  }
                >
                  <SelectTrigger className="border-slate-800 bg-slate-900">
                    <SelectValue placeholder="Evaluacion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score_100">Puntaje 0-100</SelectItem>
                    <SelectItem value="pass_fail">Pass / Fail</SelectItem>
                    <SelectItem value="none">Sin nota</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado inicial</Label>
                <Select
                  value={taskStatus}
                  onValueChange={(value) =>
                    setTaskStatus(value as 'draft' | 'published')
                  }
                >
                  <SelectTrigger className="border-slate-800 bg-slate-900">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="published">Publicada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Deadline (hora Buenos Aires)</Label>
                <Input
                  type="datetime-local"
                  value={taskDeadlineAt}
                  onChange={(event) => setTaskDeadlineAt(event.target.value)}
                  className="border-slate-800 bg-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label>Max intentos</Label>
                <Input
                  value={taskMaxAttempts}
                  onChange={(event) => setTaskMaxAttempts(event.target.value)}
                  className="border-slate-800 bg-slate-900"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label>Reentrega</Label>
                <Select
                  value={String(taskAllowResubmission)}
                  onValueChange={(value) =>
                    setTaskAllowResubmission(value === 'true')
                  }
                >
                  <SelectTrigger className="border-slate-800 bg-slate-900">
                    <SelectValue placeholder="Reentrega" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Si</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {taskAllowResubmission ? (
              <div className="space-y-2">
                <Label>Deadline reentrega (hora Buenos Aires)</Label>
                <Input
                  type="datetime-local"
                  value={taskResubDeadlineAt}
                  onChange={(event) =>
                    setTaskResubDeadlineAt(event.target.value)
                  }
                  className="border-slate-800 bg-slate-900"
                />
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-700 bg-slate-900 text-slate-100"
              onClick={() => setTaskMilestoneId(null)}
            >
              Cancelar
            </Button>
            <Button onClick={() => void createTask()} disabled={busy}>
              Crear tarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingTask)}
        onOpenChange={(open) => {
          if (!open) setEditingTask(null)
        }}
      >
        <DialogContent className="border-slate-800 bg-slate-950 text-slate-100 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar tarea</DialogTitle>
            <DialogDescription className="text-slate-400">
              Cambios sobre la plantilla de esta tarea en el hito actual.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input
                value={editTaskTitle}
                onChange={(event) => setEditTaskTitle(event.target.value)}
                className="border-slate-800 bg-slate-900"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                value={editTaskDescription}
                onChange={(event) => setEditTaskDescription(event.target.value)}
                className="border-slate-800 bg-slate-900"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de entrega</Label>
              <Select
                value={editTaskAllowedSubmissionType}
                onValueChange={(value) =>
                  setEditTaskAllowedSubmissionType(
                    value as 'link' | 'file' | 'both'
                  )
                }
              >
                <SelectTrigger className="border-slate-800 bg-slate-900">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Solo link</SelectItem>
                  <SelectItem value="file">Solo archivo</SelectItem>
                  <SelectItem value="both">Link y archivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Instrucciones</Label>
              <Textarea
                value={editTaskInstructions}
                onChange={(event) =>
                  setEditTaskInstructions(event.target.value)
                }
                className="border-slate-800 bg-slate-900"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-700 bg-slate-900 text-slate-100"
              onClick={() => setEditingTask(null)}
            >
              Cancelar
            </Button>
            <Button onClick={() => void saveTaskEdits()} disabled={busy}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(milestoneToDelete)}
        onOpenChange={(open) => {
          if (!open) setMilestoneToDelete(null)
        }}
        title="Eliminar hito"
        description="Esta accion eliminara el hito y puede afectar tareas vinculadas."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
        onConfirm={() => void deleteMilestone()}
      />
    </div>
  )
}
