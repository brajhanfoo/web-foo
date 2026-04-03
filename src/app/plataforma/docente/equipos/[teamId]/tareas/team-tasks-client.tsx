'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react'

import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  formatDateTimeInTimeZone,
  PLATFORM_TIMEZONE_LABEL,
} from '@/lib/platform/timezone'
import {
  submissionStatusBadgeClass,
  submissionStatusLabel,
} from '@/lib/platform/status-labels'

type PublicProfile = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

type TeamMemberRow = {
  id: string
  applicant_profile_id: string
  assigned_role: string | null
  status: 'enrolled'
  applicant: PublicProfile | null
}

type TeamDocenteRow = {
  id: string
  docente_profile_id: string
  staff_role: string | null
  is_active: boolean
  docente: PublicProfile | null
}

type MilestoneRow = {
  id: string
  title: string
  position: number | null
  starts_at: string | null
}

type FeedbackRow = {
  feedback_id: string
  actor_id: string | null
  comment: string | null
  score: number | null
  score_max: number | null
  created_at: string | null
  actor_profile: PublicProfile | null
}

type SubmissionRow = {
  id: string
  submission_scope: 'team' | 'individual'
  owner_profile_id: string | null
  submission_type: 'link' | 'file' | 'both'
  link_url: string | null
  file_path: string | null
  file_name: string | null
  attempt_number: number
  is_current_attempt: boolean
  is_resubmission: boolean
  status:
    | 'submitted'
    | 'changes_requested'
    | 'approved'
    | 'rejected'
    | 'reviewed'
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  latest_feedback: FeedbackRow | null
  reviewed_by_profile: PublicProfile | null
  owner_profile: PublicProfile | null
  submitted_by_profile: PublicProfile | null
}

type AssignmentRow = {
  id: string
  milestone_id: string | null
  submission_mode: 'team' | 'individual'
  allowed_submission_type: 'link' | 'file' | 'both'
  grading_mode: 'score_100' | 'pass_fail' | 'none'
  deadline_at: string | null
  allow_resubmission: boolean
  resubmission_deadline_at: string | null
  max_attempts: number
  status: 'draft' | 'published' | 'closed' | 'archived'
  task_template: {
    id: string
    title: string
    description: string | null
    instructions: string | null
  } | null
  submissions: SubmissionRow[]
}

type WorkspacePayload = {
  ok: boolean
  viewer: {
    id: string
    role: 'talent' | 'docente' | 'staff' | 'admin' | 'super_admin'
  }
  team: {
    id: string
    name: string
    edition?: {
      edition_name?: string
      program?: { title?: string } | null
    } | null
  }
  milestones: MilestoneRow[]
  assignments: AssignmentRow[]
  members: TeamMemberRow[]
  docentes: TeamDocenteRow[]
}

type DeliveryRow = {
  id: string
  assignment: AssignmentRow
  milestone: MilestoneRow | null
  participant_label: string
  participant_profile_id: string | null
  submission: SubmissionRow | null
  status_priority: number
}

type SortBy =
  | 'default'
  | 'status'
  | 'submitted_at'
  | 'reviewed_at'
  | 'task'
  | 'participant'
  | 'milestone'

type SortDirection = 'asc' | 'desc'

type ReviewStatus = 'changes_requested' | 'approved' | 'rejected' | 'reviewed'
type ReviewDialogMode = 'detail' | 'edit' | 'readonly'

const PRIMARY_CTA_CLASS = 'bg-[#00CCA4] text-slate-950 hover:bg-[#00b997]'
const ACTION_BUTTON_CLASS =
  'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700'

function profileName(profile: PublicProfile | null): string {
  const fullName =
    `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || ''
  return fullName || profile?.email || 'Sin nombre'
}

function formatDateTime(value: string | null): string {
  return formatDateTimeInTimeZone(value)
}

function submissionModeLabel(mode: 'team' | 'individual'): string {
  if (mode === 'team') return 'Una sola entrega por equipo'
  return 'Cada integrante entrega por separado'
}

function defaultReviewStatus(
  gradingMode: 'score_100' | 'pass_fail' | 'none'
): ReviewStatus {
  if (gradingMode === 'pass_fail') return 'approved'
  return 'reviewed'
}

function reviewStatusOptions(
  gradingMode: 'score_100' | 'pass_fail' | 'none'
): Array<{ value: ReviewStatus; label: string }> {
  if (gradingMode === 'pass_fail') {
    return [
      { value: 'approved', label: 'Aprobada' },
      { value: 'rejected', label: 'Rechazada' },
      { value: 'changes_requested', label: 'Solicitar cambios' },
    ]
  }

  return [
    { value: 'reviewed', label: 'Revisada' },
    { value: 'changes_requested', label: 'Solicitar cambios' },
    { value: 'approved', label: 'Aprobada' },
    { value: 'rejected', label: 'Rechazada' },
  ]
}

function statusPriority(status: SubmissionRow['status'] | null): number {
  if (!status) return 60
  if (status === 'submitted') return 10
  if (status === 'changes_requested') return 20
  if (status === 'reviewed') return 25
  if (status === 'approved') return 30
  if (status === 'rejected') return 40
  return 50
}

function isReviewedSubmission(submission: SubmissionRow | null): boolean {
  if (!submission) return false
  if (submission.reviewed_by || submission.reviewed_at) return true
  if (submission.latest_feedback?.feedback_id) return true
  return submission.status !== 'submitted'
}

function canEditSubmissionFeedback(
  viewer: WorkspacePayload['viewer'],
  submission: SubmissionRow | null
): boolean {
  if (!submission) return false
  if (viewer.role === 'super_admin' || viewer.role === 'admin') return true
  if (viewer.role !== 'docente') return false
  if (!isReviewedSubmission(submission)) return true
  if (!submission.reviewed_by) return true
  return submission.reviewed_by === viewer.id
}

function reviewerName(submission: SubmissionRow | null): string {
  if (!submission) return '--'

  if (submission.reviewed_by_profile) {
    return profileName(submission.reviewed_by_profile)
  }

  if (submission.latest_feedback?.actor_profile) {
    return profileName(submission.latest_feedback.actor_profile)
  }

  return '--'
}

function milestoneSortValue(milestone: MilestoneRow | null): string {
  if (!milestone) return 'ZZZ'
  return `${String(milestone.position ?? 9999).padStart(4, '0')}:${milestone.title}`
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, 'es', { sensitivity: 'base' })
}

function parseSafeDate(value: string | null): number {
  const parsed = Date.parse(String(value ?? ''))
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed
}

function buildSubmissionMap(
  submissions: SubmissionRow[]
): Map<string, SubmissionRow> {
  const map = new Map<string, SubmissionRow>()
  for (const submission of submissions) {
    const owner = submission.owner_profile_id?.trim()
    if (!owner) continue
    map.set(owner, submission)
  }
  return map
}

function buildDeliveryRows(workspace: WorkspacePayload): DeliveryRow[] {
  const rows: DeliveryRow[] = []
  const milestoneById = new Map(workspace.milestones.map((m) => [m.id, m]))

  for (const assignment of workspace.assignments) {
    const milestone = assignment.milestone_id
      ? (milestoneById.get(assignment.milestone_id) ?? null)
      : null

    if (assignment.submission_mode === 'team') {
      const submission =
        assignment.submissions.find((item) => item.is_current_attempt) ??
        assignment.submissions[0] ??
        null

      rows.push({
        id: `${assignment.id}:team`,
        assignment,
        milestone,
        participant_label: workspace.team.name,
        participant_profile_id: null,
        submission,
        status_priority: statusPriority(submission?.status ?? null),
      })
      continue
    }

    const assignmentSubmissionMap = buildSubmissionMap(assignment.submissions)
    const seenProfiles = new Set<string>()

    for (const member of workspace.members) {
      const participantId = member.applicant_profile_id
      const submission = assignmentSubmissionMap.get(participantId) ?? null
      seenProfiles.add(participantId)

      rows.push({
        id: `${assignment.id}:${participantId}`,
        assignment,
        milestone,
        participant_label: profileName(member.applicant),
        participant_profile_id: participantId,
        submission,
        status_priority: statusPriority(submission?.status ?? null),
      })
    }

    for (const submission of assignment.submissions) {
      const ownerProfileId = submission.owner_profile_id?.trim()
      if (!ownerProfileId || seenProfiles.has(ownerProfileId)) continue

      rows.push({
        id: `${assignment.id}:${ownerProfileId}`,
        assignment,
        milestone,
        participant_label: profileName(submission.owner_profile),
        participant_profile_id: ownerProfileId,
        submission,
        status_priority: statusPriority(submission.status),
      })
    }
  }

  return rows
}

function scoreText(feedback: FeedbackRow | null): string {
  if (!feedback || feedback.score === null || feedback.score === undefined) {
    return '--'
  }

  const scoreMax = feedback.score_max ?? 100
  return `${feedback.score}/${scoreMax}`
}

export default function TeamTasksClientPage({
  teamId,
  initialMilestoneId,
}: {
  teamId: string
  initialMilestoneId: string | null
}) {
  const { showError, showSuccess } = useToastEnhanced()

  const [loading, setLoading] = useState(true)
  const [busyRefresh, setBusyRefresh] = useState(false)
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [milestoneFilter, setMilestoneFilter] = useState(
    initialMilestoneId && initialMilestoneId.trim().length > 0
      ? initialMilestoneId
      : 'all'
  )
  const [taskStatusFilter, setTaskStatusFilter] = useState<
    'published' | 'closed' | 'draft' | 'archived' | 'all'
  >('published')
  const [searchText, setSearchText] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('default')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [selectedDialogMode, setSelectedDialogMode] =
    useState<ReviewDialogMode>('detail')
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('reviewed')
  const [reviewComment, setReviewComment] = useState('')
  const [reviewScore, setReviewScore] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)

  const loadWorkspace = useCallback(
    async (silent = false) => {
      if (!teamId) return
      if (!silent) setLoading(true)
      setBusyRefresh(silent)

      const response = await fetch(
        `/api/plataforma/docente/teams/${teamId}/workspace`,
        {
          cache: 'no-store',
        }
      )

      const payload = (await response.json().catch(() => null)) as
        | (WorkspacePayload & { message?: string })
        | { ok: false; message?: string }
        | null

      if (!response.ok || !payload || !payload.ok) {
        const message =
          payload && 'message' in payload
            ? payload.message
            : 'No se pudo cargar tareas y entregas del equipo.'

        if (silent) {
          showError(message ?? 'No se pudo refrescar la vista.')
        } else {
          setLoadError(message ?? 'No se pudo cargar tareas y entregas.')
        }

        setBusyRefresh(false)
        setLoading(false)
        return
      }

      setWorkspace(payload)
      setLoadError(null)
      setBusyRefresh(false)
      setLoading(false)
    },
    [showError, teamId]
  )

  useEffect(() => {
    void loadWorkspace(false)
  }, [loadWorkspace])

  const milestoneOptions = useMemo(() => {
    if (!workspace) return [] as MilestoneRow[]
    return [...workspace.milestones].sort((left, right) => {
      const leftPos =
        typeof left.position === 'number'
          ? left.position
          : Number.MAX_SAFE_INTEGER
      const rightPos =
        typeof right.position === 'number'
          ? right.position
          : Number.MAX_SAFE_INTEGER

      if (leftPos !== rightPos) return leftPos - rightPos
      return compareText(left.title, right.title)
    })
  }, [workspace])

  useEffect(() => {
    if (!workspace || milestoneFilter === 'all') return
    const exists = workspace.milestones.some(
      (item) => item.id === milestoneFilter
    )
    if (!exists) {
      setMilestoneFilter('all')
    }
  }, [workspace, milestoneFilter])

  const allRows = useMemo(() => {
    if (!workspace) return [] as DeliveryRow[]
    return buildDeliveryRows(workspace)
  }, [workspace])

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase()

    const rows = allRows.filter((row) => {
      if (
        milestoneFilter !== 'all' &&
        (row.assignment.milestone_id ?? '') !== milestoneFilter
      ) {
        return false
      }

      if (
        taskStatusFilter !== 'all' &&
        row.assignment.status !== taskStatusFilter
      ) {
        return false
      }

      if (!normalizedSearch) return true

      const taskTitle = row.assignment.task_template?.title ?? ''
      const milestoneTitle = row.milestone?.title ?? 'Sin hito'
      const participant = row.participant_label

      return (
        taskTitle.toLowerCase().includes(normalizedSearch) ||
        milestoneTitle.toLowerCase().includes(normalizedSearch) ||
        participant.toLowerCase().includes(normalizedSearch)
      )
    })

    const sorted = [...rows]

    sorted.sort((left, right) => {
      if (sortBy === 'default') {
        const diff = left.status_priority - right.status_priority
        if (diff !== 0) return diff
        return (
          parseSafeDate(right.submission?.submitted_at ?? null) -
          parseSafeDate(left.submission?.submitted_at ?? null)
        )
      }

      if (sortBy === 'status') {
        return left.status_priority - right.status_priority
      }

      if (sortBy === 'submitted_at') {
        return (
          parseSafeDate(left.submission?.submitted_at ?? null) -
          parseSafeDate(right.submission?.submitted_at ?? null)
        )
      }

      if (sortBy === 'reviewed_at') {
        return (
          parseSafeDate(left.submission?.reviewed_at ?? null) -
          parseSafeDate(right.submission?.reviewed_at ?? null)
        )
      }

      if (sortBy === 'task') {
        return compareText(
          left.assignment.task_template?.title ?? '',
          right.assignment.task_template?.title ?? ''
        )
      }

      if (sortBy === 'participant') {
        return compareText(left.participant_label, right.participant_label)
      }

      return compareText(
        milestoneSortValue(left.milestone),
        milestoneSortValue(right.milestone)
      )
    })

    if (sortDirection === 'desc') {
      sorted.reverse()
    }

    return sorted
  }, [
    allRows,
    milestoneFilter,
    searchText,
    sortBy,
    sortDirection,
    taskStatusFilter,
  ])

  const summary = useMemo(() => {
    let pending = 0
    let changesRequested = 0
    let approved = 0
    let rejected = 0
    let noSubmission = 0

    for (const row of filteredRows) {
      const status = row.submission?.status
      if (!status) {
        noSubmission += 1
        continue
      }

      if (status === 'submitted') pending += 1
      else if (status === 'changes_requested') changesRequested += 1
      else if (status === 'approved') approved += 1
      else if (status === 'rejected') rejected += 1
    }

    return {
      pending,
      changesRequested,
      approved,
      rejected,
      noSubmission,
    }
  }, [filteredRows])

  const selectedRow = useMemo(
    () => filteredRows.find((row) => row.id === selectedRowId) ?? null,
    [filteredRows, selectedRowId]
  )

  const selectedSubmission = selectedRow?.submission ?? null
  const selectedCanEdit = workspace?.viewer
    ? canEditSubmissionFeedback(workspace.viewer, selectedSubmission)
    : false
  const selectedIsReviewed = isReviewedSubmission(selectedSubmission)
  const selectedCanSubmitFeedback =
    selectedDialogMode === 'edit' &&
    Boolean(selectedSubmission) &&
    selectedCanEdit

  function openSubmissionDialog(row: DeliveryRow, mode: ReviewDialogMode) {
    setSelectedRowId(row.id)
    setSelectedDialogMode(mode)

    const submission = row.submission
    if (!submission) {
      setReviewComment('')
      setReviewScore('')
      setReviewStatus(defaultReviewStatus(row.assignment.grading_mode))
      return
    }

    const feedback = submission.latest_feedback
    setReviewComment(feedback?.comment ?? '')
    setReviewScore(
      feedback?.score !== null && feedback?.score !== undefined
        ? String(feedback.score)
        : ''
    )

    if (
      submission.status === 'approved' ||
      submission.status === 'rejected' ||
      submission.status === 'changes_requested' ||
      submission.status === 'reviewed'
    ) {
      setReviewStatus(submission.status)
    } else {
      setReviewStatus(defaultReviewStatus(row.assignment.grading_mode))
    }
  }

  function openReviewDialog(row: DeliveryRow) {
    if (!row.submission) return
    openSubmissionDialog(row, 'edit')
  }

  function openFeedbackViewDialog(row: DeliveryRow) {
    if (!row.submission) return
    openSubmissionDialog(row, 'readonly')
  }

  function openRowDetail(row: DeliveryRow) {
    openSubmissionDialog(row, 'detail')
  }

  async function openSubmissionFile(submissionId: string) {
    const response = await fetch(
      `/api/plataforma/submissions/file-url?submission_id=${submissionId}`
    )
    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      signed_url?: string
      message?: string
    } | null

    if (!response.ok || !payload?.ok || !payload.signed_url) {
      showError(payload?.message ?? 'No se pudo abrir el archivo.')
      return
    }

    window.open(payload.signed_url, '_blank', 'noopener,noreferrer')
  }

  async function openSubmissionLink(submissionId: string) {
    const response = await fetch(
      `/api/plataforma/submissions/link-url?submission_id=${submissionId}`
    )
    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      link_url?: string
      message?: string
    } | null

    if (!response.ok || !payload?.ok || !payload.link_url) {
      showError(payload?.message ?? 'No se pudo abrir el enlace.')
      return
    }

    window.open(payload.link_url, '_blank', 'noopener,noreferrer')
  }

  async function submitFeedback() {
    if (!selectedRow || !selectedSubmission) return
    if (!workspace) return

    if (!selectedCanSubmitFeedback) {
      showError('Esta entrega ya fue revisada por otro docente.')
      return
    }

    const comment = reviewComment.trim()
    if (!comment) {
      showError('El comentario es obligatorio.')
      return
    }

    let normalizedScore: number | null = null
    if (selectedRow.assignment.grading_mode === 'score_100') {
      const parsedScore = Number(reviewScore)
      if (
        !Number.isFinite(parsedScore) ||
        parsedScore < 0 ||
        parsedScore > 100
      ) {
        showError('Ingresa un puntaje valido entre 0 y 100.')
        return
      }
      normalizedScore = parsedScore
    }

    setReviewBusy(true)

    const response = await fetch(
      `/api/plataforma/submissions/${selectedSubmission.id}/feedback`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment,
          status: reviewStatus,
          score: normalizedScore,
        }),
      }
    )

    const payload = (await response.json().catch(() => null)) as
      | { ok: true; feedback_id: string }
      | { ok: false; message?: string }
      | null

    setReviewBusy(false)

    if (!response.ok || !payload || !payload.ok) {
      const message =
        payload && 'message' in payload
          ? payload.message
          : 'No se pudo enviar feedback.'
      showError(message ?? 'No se pudo enviar feedback.')
      return
    }

    showSuccess('Feedback enviado.')
    setSelectedRowId(null)
    setReviewComment('')
    setReviewScore('')
    await loadWorkspace(true)
  }

  const teamTitle = workspace?.team.name ?? 'Equipo'
  const programTitle = workspace?.team.edition?.program?.title ?? 'Programa'
  const editionTitle = workspace?.team.edition?.edition_name ?? 'Edicion'

  if (loading) {
    return (
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="py-8 text-sm text-slate-300">
          Cargando tareas y entregas...
        </CardContent>
      </Card>
    )
  }

  if (!workspace) {
    return (
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="space-y-3 py-8">
          <div className="text-sm text-slate-300">
            {loadError ?? 'No se pudo cargar la vista de tareas del equipo.'}
          </div>
          <Button
            variant="outline"
            className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
            onClick={() => void loadWorkspace(false)}
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Revision de entregas
            </div>
            <CardTitle>{teamTitle}</CardTitle>
            <CardDescription className="text-slate-300">
              {programTitle} · {editionTitle}
            </CardDescription>
            <div className="text-xs text-slate-400">
              Zona horaria oficial: {PLATFORM_TIMEZONE_LABEL}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge className="border border-slate-700 bg-slate-800 text-slate-100">
                {workspace.assignments.length} tareas
              </Badge>
              <Badge className="border border-slate-700 bg-slate-800 text-slate-100">
                {workspace.members.length} integrantes
              </Badge>
              <Badge className="border border-slate-700 bg-slate-800 text-slate-100">
                {filteredRows.length} filas en tabla
              </Badge>
            </div>
          </div>

          <div className="flex w-full flex-wrap justify-start gap-2 md:w-auto md:justify-end">
            <Button
              asChild
              variant="outline"
              className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
            >
              <Link href={`/plataforma/docente/equipos/${teamId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al equipo
              </Link>
            </Button>

            <Button
              variant="outline"
              className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
              onClick={() => void loadWorkspace(true)}
              disabled={busyRefresh}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {busyRefresh ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Pendientes
            </CardDescription>
            <CardTitle className="text-lg">{summary.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Cambios solicitados
            </CardDescription>
            <CardTitle className="text-lg">
              {summary.changesRequested}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Aprobadas
            </CardDescription>
            <CardTitle className="text-lg">{summary.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Rechazadas
            </CardDescription>
            <CardTitle className="text-lg">{summary.rejected}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Sin entrega
            </CardDescription>
            <CardTitle className="text-lg">{summary.noSubmission}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>Tareas y entregas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <Input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  className="border-slate-800 bg-slate-900"
                  placeholder="Tarea, hito o participante"
                />
              </div>

              <div className="space-y-2">
                <Label>Hito</Label>
                <Select
                  value={milestoneFilter}
                  onValueChange={setMilestoneFilter}
                >
                  <SelectTrigger className="border-slate-800 bg-slate-900">
                    <SelectValue placeholder="Todos los hitos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los hitos</SelectItem>
                    {milestoneOptions.map((milestone) => (
                      <SelectItem key={milestone.id} value={milestone.id}>
                        {milestone.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado de tarea</Label>
                <Select
                  value={taskStatusFilter}
                  onValueChange={(value) =>
                    setTaskStatusFilter(
                      value as
                        | 'published'
                        | 'closed'
                        | 'draft'
                        | 'archived'
                        | 'all'
                    )
                  }
                >
                  <SelectTrigger className="border-slate-800 bg-slate-900">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Publicadas</SelectItem>
                    <SelectItem value="closed">Cerradas</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="archived">Archivadas</SelectItem>
                    <SelectItem value="all">Todas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ordenar por</Label>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as SortBy)}
                >
                  <SelectTrigger className="border-slate-800 bg-slate-900">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Prioridad operativa</SelectItem>
                    <SelectItem value="status">Estado</SelectItem>
                    <SelectItem value="submitted_at">Entrega</SelectItem>
                    <SelectItem value="reviewed_at">Revision</SelectItem>
                    <SelectItem value="task">Tarea</SelectItem>
                    <SelectItem value="participant">Participante</SelectItem>
                    <SelectItem value="milestone">Hito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Direccion</Label>
                <Select
                  value={sortDirection}
                  onValueChange={(value) =>
                    setSortDirection(value as SortDirection)
                  }
                >
                  <SelectTrigger className="border-slate-800 bg-slate-900">
                    <SelectValue placeholder="Direccion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascendente</SelectItem>
                    <SelectItem value="desc">Descendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="rounded-md border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
              No hay filas para los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-800">
              <table
                className="w-full table-fixed border-collapse text-sm"
                style={{ contentVisibility: 'auto' }}
              >
                <thead className="bg-slate-900/70 text-slate-300">
                  <tr className="border-b border-slate-800">
                    <th className="w-[12%] px-2 py-2 text-left font-medium">
                      Estado
                    </th>
                    <th className="w-[14%] px-2 py-2 text-left font-medium">
                      Tarea
                    </th>
                    <th className="w-[14%] px-2 py-2 text-left font-medium">
                      Hito
                    </th>
                    <th className="w-[19%] px-2 py-2 text-left font-medium">
                      Responsable
                    </th>
                    <th className="w-[22%] px-2 py-2 text-left font-medium">
                      Modalidad
                    </th>
                    <th className="w-[10%] whitespace-nowrap px-2 py-2 text-left font-medium">
                      Entregada
                    </th>
                    <th className="w-[9%] whitespace-nowrap px-2 py-2 text-right font-medium">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const submission = row.submission
                    const reviewed = isReviewedSubmission(submission)
                    const canEdit = canEditSubmissionFeedback(
                      workspace.viewer,
                      submission
                    )
                    const hasSubmission = Boolean(submission)

                    let primaryActionLabel = 'Ver detalle'
                    let primaryActionHandler = () => openRowDetail(row)
                    let showSecondaryDetailAction = false

                    if (hasSubmission) {
                      if (!reviewed) {
                        primaryActionLabel = 'Revisar'
                        primaryActionHandler = () => openReviewDialog(row)
                      } else if (canEdit) {
                        primaryActionLabel = 'Editar feedback'
                        primaryActionHandler = () => openReviewDialog(row)
                        showSecondaryDetailAction = true
                      } else {
                        primaryActionLabel = 'Ver feedback'
                        primaryActionHandler = () => openFeedbackViewDialog(row)
                      }
                    }

                    return (
                      <tr
                        key={row.id}
                        className="border-b border-slate-800 bg-[#0B0D12] align-top last:border-b-0"
                      >
                        <td className="px-2 py-3">
                          {submission ? (
                            <Badge
                              className={submissionStatusBadgeClass(
                                submission.status
                              )}
                            >
                              {submissionStatusLabel(submission.status)}
                            </Badge>
                          ) : (
                            <Badge className="border border-slate-700 bg-slate-800 text-slate-300">
                              Sin entrega
                            </Badge>
                          )}
                        </td>

                        <td className="px-2 py-3">
                          <div
                            className="overflow-hidden font-medium leading-snug break-words text-slate-100"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {row.assignment.task_template?.title ??
                              'Tarea sin titulo'}
                          </div>
                        </td>

                        <td className="px-2 py-3 text-slate-200">
                          <div className="font-medium leading-snug whitespace-normal break-words">
                            {row.milestone?.title ?? 'Sin hito'}
                          </div>
                        </td>

                        <td className="px-2 py-3 text-slate-200">
                          <div className="font-medium leading-snug whitespace-normal break-words">
                            {row.participant_label}
                          </div>
                        </td>

                        <td className="px-2 py-3 text-slate-300">
                          <span className="block whitespace-normal break-words text-xs leading-tight sm:text-sm">
                            {submissionModeLabel(
                              row.assignment.submission_mode
                            )}
                          </span>
                        </td>

                        <td className="px-2 py-3">
                          {submission ? (
                            <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                              Sí
                            </Badge>
                          ) : (
                            <Badge className="border border-slate-700 bg-slate-800 text-slate-300">
                              No
                            </Badge>
                          )}
                        </td>

                        <td className="px-2 py-3">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
                                  aria-label="Acciones de la fila"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-52 border-slate-700 bg-slate-900 text-slate-100"
                              >
                                <DropdownMenuItem
                                  onSelect={primaryActionHandler}
                                  className="cursor-pointer focus:bg-slate-800"
                                >
                                  {primaryActionLabel}
                                </DropdownMenuItem>

                                {showSecondaryDetailAction ? (
                                  <DropdownMenuItem
                                    onSelect={() => openRowDetail(row)}
                                    className="cursor-pointer focus:bg-slate-800"
                                  >
                                    Ver detalle
                                  </DropdownMenuItem>
                                ) : null}

                                {submission?.link_url ? (
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      void openSubmissionLink(submission.id)
                                    }
                                    className="cursor-pointer focus:bg-slate-800"
                                  >
                                    Abrir enlace
                                  </DropdownMenuItem>
                                ) : null}

                                {submission?.file_path ? (
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      void openSubmissionFile(submission.id)
                                    }
                                    className="cursor-pointer focus:bg-slate-800"
                                  >
                                    Abrir archivo
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedRow)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRowId(null)
            setSelectedDialogMode('detail')
            setReviewComment('')
            setReviewScore('')
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border border-slate-800 bg-slate-900 text-slate-100 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRow?.assignment.task_template?.title ??
                'Revision de entrega'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedRow?.milestone?.title ?? 'Sin hito'} ·{' '}
              {selectedRow?.participant_label ?? '--'}
            </DialogDescription>
          </DialogHeader>

          {selectedRow ? (
            <div className="rounded-md border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Detalle de la tarea
              </div>
              <div className="mt-2 grid gap-2 text-xs text-slate-400 md:grid-cols-2">
                <div>
                  Modalidad:{' '}
                  {submissionModeLabel(selectedRow.assignment.submission_mode)}
                </div>
                <div>
                  Deadline:{' '}
                  {formatDateTime(selectedRow.assignment.deadline_at) || '--'}
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Descripcion
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-200">
                  {selectedRow.assignment.task_template?.description?.trim() ||
                    'Sin descripcion'}
                </p>
              </div>
              <div className="mt-3 space-y-1">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Instrucciones
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-200">
                  {selectedRow.assignment.task_template?.instructions?.trim() ||
                    'Sin instrucciones'}
                </p>
              </div>
            </div>
          ) : null}

          {selectedSubmission ? (
            <div className="space-y-4">
              <div className="rounded-md border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
                <div className="font-medium text-slate-100">
                  Estado: {submissionStatusLabel(selectedSubmission.status)}
                </div>
                <div className="text-xs text-slate-400">
                  Entregada: {formatDateTime(selectedSubmission.submitted_at)} ·
                  Intento #{selectedSubmission.attempt_number}
                </div>
                {selectedIsReviewed ? (
                  <div className="mt-1 text-xs text-slate-400">
                    Revisada por: {reviewerName(selectedSubmission)} ·{' '}
                    {formatDateTime(selectedSubmission.reviewed_at)}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedSubmission.link_url ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className={ACTION_BUTTON_CLASS}
                    onClick={() =>
                      void openSubmissionLink(selectedSubmission.id)
                    }
                  >
                    Ver enlace
                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </Button>
                ) : null}

                {selectedSubmission.file_path ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className={ACTION_BUTTON_CLASS}
                    onClick={() =>
                      void openSubmissionFile(selectedSubmission.id)
                    }
                  >
                    Ver archivo
                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>

              {selectedSubmission.latest_feedback ? (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                  <div className="font-medium">Feedback registrado</div>
                  <div className="mt-1 text-xs">
                    Puntaje: {scoreText(selectedSubmission.latest_feedback)}
                  </div>
                  <div className="mt-1 text-xs">
                    {selectedSubmission.latest_feedback.comment ||
                      'Sin comentario'}
                  </div>
                </div>
              ) : null}

              {selectedIsReviewed && !selectedCanEdit ? (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                  Esta entrega ya fue revisada por otro docente. Puedes verla,
                  pero no modificarla.
                </div>
              ) : null}

              {selectedCanSubmitFeedback ? (
                <div className="space-y-3 rounded-md border border-slate-800 bg-slate-950 p-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Resultado</Label>
                      <Select
                        value={reviewStatus}
                        onValueChange={(value) =>
                          setReviewStatus(value as ReviewStatus)
                        }
                      >
                        <SelectTrigger className="border-slate-800 bg-slate-900">
                          <SelectValue placeholder="Resultado" />
                        </SelectTrigger>
                        <SelectContent>
                          {reviewStatusOptions(
                            selectedRow?.assignment.grading_mode ?? 'none'
                          ).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedRow?.assignment.grading_mode === 'score_100' ? (
                      <div className="space-y-2">
                        <Label>Puntaje (0 a 100)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          max="100"
                          step="1"
                          value={reviewScore}
                          onChange={(event) =>
                            setReviewScore(event.target.value)
                          }
                          className="border-slate-800 bg-slate-900 tabular-nums"
                          placeholder="Ej: 85"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label>Comentario</Label>
                    <Textarea
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      className="border-slate-800 bg-slate-900"
                      placeholder="Escribe el feedback para la entrega"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-sm text-slate-300">
              No hay entrega asociada a esta fila.
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
              onClick={() => setSelectedRowId(null)}
            >
              Cerrar
            </Button>

            {selectedCanSubmitFeedback ? (
              <Button
                className={PRIMARY_CTA_CLASS}
                disabled={reviewBusy}
                onClick={() => void submitFeedback()}
              >
                {reviewBusy ? 'Enviando...' : 'Enviar feedback'}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
