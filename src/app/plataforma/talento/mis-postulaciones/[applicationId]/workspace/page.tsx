// src/app/plataforma/talento/mis-postulaciones/[applicationId]/workspace/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  FileUp,
  ExternalLink,
  Folder,
  GraduationCap,
  MessageSquare,
  Users,
  Video,
} from 'lucide-react'
import {
  formatDateOnlyInTimeZone,
  formatDateTimeInTimeZone,
  PLATFORM_TIMEZONE,
  PLATFORM_TIMEZONE_LABEL,
} from '@/lib/platform/timezone'
import {
  submissionStatusBadgeClass,
  submissionStatusLabel,
  taskAssignmentStatusBadgeClass,
  taskAssignmentStatusLabel,
} from '@/lib/platform/status-labels'

type WorkspaceTeamRow = {
  id: string
  name: string
  drive_url: string | null
  classroom_url: string | null
  slack_url: string | null
}

type WorkspaceMilestoneRow = {
  id: string
  title: string
  meet_url: string | null
  drive_url: string | null
  starts_at: string | null
  position: number | null
  created_at: string
}

type WorkspacePayload = {
  application: {
    id: string
    program_id: string
    edition_id: string | null
    status: string
    team_id: string | null
    certificate_bucket_id: string | null
    certificate_object_path: string | null
  }
  program: { title: string | null }
  edition: {
    edition_name: string | null
    starts_at: string | null
    ends_at: string | null
  }
  team: WorkspaceTeamRow | null
  milestones: WorkspaceMilestoneRow[]
}

type WorkspaceApiResponse =
  | { ok: true; data: WorkspacePayload }
  | { ok: false; message: string }

type WorkspaceTaskSubmission = {
  id: string
  submission_scope: 'team' | 'individual'
  submission_type: 'link' | 'file' | 'both'
  link_url: string | null
  file_path: string | null
  file_name: string | null
  attempt_number: number
  is_resubmission: boolean
  status:
    | 'submitted'
    | 'changes_requested'
    | 'approved'
    | 'rejected'
    | 'reviewed'
  submitted_at: string
  latest_feedback: {
    feedback_id: string
    comment: string | null
    score: number | null
    created_at: string
  } | null
}

type WorkspaceTaskAssignment = {
  id: string
  milestone_id: string | null
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
  submissions: WorkspaceTaskSubmission[]
}

type WorkspaceState =
  | { kind: 'loading' }
  | { kind: 'unauthorized'; message: string }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: WorkspacePayload }

function buildEditionRange(edition: WorkspacePayload['edition'] | null) {
  if (!edition) return ''
  const startLine = formatDateOnlyInTimeZone(
    edition.starts_at,
    PLATFORM_TIMEZONE
  )
  const endLine = formatDateOnlyInTimeZone(edition.ends_at, PLATFORM_TIMEZONE)
  const startText = startLine ? `Inicio: ${startLine}` : ''
  const endText = endLine ? `Fin: ${endLine}` : ''
  if (startText && endText) return `${startText} - ${endText}`
  return startText || endText
}

function submissionTypeLabel(value: 'link' | 'file' | 'both'): string {
  if (value === 'link') return 'Solo link'
  if (value === 'file') return 'Solo archivo'
  return 'Link y archivo'
}

export default function WorkspacePage() {
  const params = useParams<{ applicationId?: string }>()
  const router = useRouter()
  const { showError } = useToastEnhanced()
  const showErrorRef = useRef(showError)

  const [state, setState] = useState<WorkspaceState>({ kind: 'loading' })
  const [certificateBusy, setCertificateBusy] = useState(false)
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasks, setTasks] = useState<WorkspaceTaskAssignment[]>([])
  const [milestoneTasksDialogId, setMilestoneTasksDialogId] = useState<
    string | null
  >(null)
  const [submissionDialogTaskId, setSubmissionDialogTaskId] = useState<
    string | null
  >(null)
  const [submissionLink, setSubmissionLink] = useState('')
  const [submissionComment, setSubmissionComment] = useState('')
  const [submissionFile, setSubmissionFile] = useState<File | null>(null)
  const [submittingTask, setSubmittingTask] = useState(false)

  useEffect(() => {
    showErrorRef.current = showError
  }, [showError])

  const applicationId = useMemo(() => {
    const raw = params.applicationId
    return typeof raw === 'string' ? raw : ''
  }, [params.applicationId])

  useEffect(() => {
    if (!applicationId) {
      setState({ kind: 'error', message: 'Falta el identificador.' })
      return
    }

    let cancelled = false

    const run = async () => {
      setState({ kind: 'loading' })
      try {
        const response = await fetch(
          `/api/plataforma/talento/workspace/${applicationId}`
        )
        const payload = (await response.json()) as WorkspaceApiResponse

        if (!response.ok || !payload.ok) {
          const message =
            typeof payload === 'object' && payload && 'message' in payload
              ? payload.message
              : 'No se pudo cargar el workspace'

          if (response.status === 401 || response.status === 403) {
            if (!cancelled) {
              setState({ kind: 'unauthorized', message })
            }
            return
          }

          if (!cancelled) {
            showErrorRef.current('No se pudo cargar el workspace', message)
            setState({ kind: 'error', message })
          }
          return
        }

        if (!cancelled) {
          setState({ kind: 'ready', data: payload.data })
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error inesperado'
        if (!cancelled) {
          showErrorRef.current('No se pudo cargar el workspace', message)
          setState({ kind: 'error', message })
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [applicationId])

  async function loadTasks(targetApplicationId: string) {
    setTasksLoading(true)
    const response = await fetch(
      `/api/plataforma/workspace/tasks?application_id=${targetApplicationId}`,
      {
        cache: 'no-store',
      }
    )
    const payload = (await response.json().catch(() => null)) as
      | { ok: true; tasks: WorkspaceTaskAssignment[] }
      | { ok: false; message: string }
      | null

    if (!response.ok || !payload || !payload.ok) {
      const message =
        payload && 'message' in payload
          ? payload.message
          : 'No se pudieron cargar tareas.'
      showErrorRef.current('No se pudieron cargar tareas', message)
      setTasks([])
      setTasksLoading(false)
      return
    }

    setTasks(payload.tasks ?? [])
    setTasksLoading(false)
  }

  useEffect(() => {
    if (state.kind !== 'ready') return
    void loadTasks(state.data.application.id)
  }, [state])

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === submissionDialogTaskId) ?? null,
    [submissionDialogTaskId, tasks]
  )
  const selectedTaskSubmissionType =
    selectedTask?.allowed_submission_type ?? 'both'
  const showLinkInput = selectedTaskSubmissionType !== 'file'
  const showFileInput = selectedTaskSubmissionType !== 'link'

  useEffect(() => {
    if (selectedTaskSubmissionType === 'file') {
      setSubmissionLink('')
    }
    if (selectedTaskSubmissionType === 'link') {
      setSubmissionFile(null)
    }
  }, [selectedTaskSubmissionType])

  const editionRange = useMemo(() => {
    if (state.kind !== 'ready') return ''
    return buildEditionRange(state.data.edition)
  }, [state])

  const showCertificate = useMemo(() => {
    if (state.kind !== 'ready') return false
    return Boolean(state.data.application.certificate_object_path)
  }, [state])

  const tasksByMilestone = useMemo(() => {
    const grouped = new Map<string, WorkspaceTaskAssignment[]>()
    const withoutMilestone: WorkspaceTaskAssignment[] = []

    for (const task of tasks) {
      const key = task.milestone_id?.trim()
      if (key) {
        const bucket = grouped.get(key) ?? []
        bucket.push(task)
        grouped.set(key, bucket)
      } else {
        withoutMilestone.push(task)
      }
    }

    for (const entry of grouped.values()) {
      entry.sort((left, right) => {
        const leftDate = Date.parse(String(left.deadline_at ?? ''))
        const rightDate = Date.parse(String(right.deadline_at ?? ''))
        const leftSafe = Number.isNaN(leftDate)
          ? Number.MAX_SAFE_INTEGER
          : leftDate
        const rightSafe = Number.isNaN(rightDate)
          ? Number.MAX_SAFE_INTEGER
          : rightDate
        return leftSafe - rightSafe
      })
    }

    withoutMilestone.sort((left, right) => {
      const leftDate = Date.parse(String(left.deadline_at ?? ''))
      const rightDate = Date.parse(String(right.deadline_at ?? ''))
      const leftSafe = Number.isNaN(leftDate)
        ? Number.MAX_SAFE_INTEGER
        : leftDate
      const rightSafe = Number.isNaN(rightDate)
        ? Number.MAX_SAFE_INTEGER
        : rightDate
      return leftSafe - rightSafe
    })

    return { grouped, withoutMilestone }
  }, [tasks])

  const milestonesForTasks = useMemo(() => {
    if (state.kind !== 'ready') return [] as WorkspaceMilestoneRow[]

    const merged = new Map<string, WorkspaceMilestoneRow>()
    for (const milestone of state.data.milestones) {
      merged.set(milestone.id, milestone)
    }

    for (const task of tasks) {
      const milestoneId = task.milestone_id?.trim()
      if (!milestoneId) continue
      if (merged.has(milestoneId)) continue

      const taskMilestone = task.milestone
      merged.set(milestoneId, {
        id: milestoneId,
        title: taskMilestone?.title ?? 'Hito',
        meet_url: null,
        drive_url: null,
        starts_at: taskMilestone?.starts_at ?? null,
        position: taskMilestone?.position ?? null,
        created_at: '',
      })
    }

    return Array.from(merged.values()).sort((left, right) => {
      const leftPos =
        typeof left.position === 'number'
          ? left.position
          : Number.MAX_SAFE_INTEGER
      const rightPos =
        typeof right.position === 'number'
          ? right.position
          : Number.MAX_SAFE_INTEGER
      if (leftPos !== rightPos) return leftPos - rightPos

      const leftDate = Date.parse(String(left.starts_at ?? ''))
      const rightDate = Date.parse(String(right.starts_at ?? ''))
      const leftDateSafe = Number.isNaN(leftDate)
        ? Number.MAX_SAFE_INTEGER
        : leftDate
      const rightDateSafe = Number.isNaN(rightDate)
        ? Number.MAX_SAFE_INTEGER
        : rightDate
      if (leftDateSafe !== rightDateSafe) return leftDateSafe - rightDateSafe

      const leftCreated = Date.parse(String(left.created_at ?? ''))
      const rightCreated = Date.parse(String(right.created_at ?? ''))
      const leftCreatedSafe = Number.isNaN(leftCreated) ? 0 : leftCreated
      const rightCreatedSafe = Number.isNaN(rightCreated) ? 0 : rightCreated
      return leftCreatedSafe - rightCreatedSafe
    })
  }, [state, tasks])

  const selectedMilestoneForTasks = useMemo(() => {
    if (!milestoneTasksDialogId) return null
    return (
      milestonesForTasks.find((milestone) => milestone.id === milestoneTasksDialogId) ??
      null
    )
  }, [milestoneTasksDialogId, milestonesForTasks])

  const selectedMilestoneTasks = useMemo(() => {
    if (!milestoneTasksDialogId) return [] as WorkspaceTaskAssignment[]
    return tasksByMilestone.grouped.get(milestoneTasksDialogId) ?? []
  }, [milestoneTasksDialogId, tasksByMilestone.grouped])

  function renderTaskCard(task: WorkspaceTaskAssignment) {
    const currentSubmission = task.submissions[0] ?? null
    const isDeliverable = task.status === 'published'
    return (
      <div
        key={task.id}
        className="rounded-lg border border-white/10 bg-black/20 p-3"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">
              {task.task_template?.title ?? 'Tarea'}
            </div>
            <div className="text-xs text-white/60">
              Modo: {task.submission_mode === 'team' ? 'Equipo' : 'Individual'}
            </div>
            <div className="text-xs text-white/60">
              Tipo entrega:{' '}
              {submissionTypeLabel(task.allowed_submission_type ?? 'both')}
            </div>
            <div className="text-xs text-white/50">
              Deadline:{' '}
              {formatDateTimeInTimeZone(task.deadline_at, PLATFORM_TIMEZONE)}
            </div>
          </div>
          <Badge className={taskAssignmentStatusBadgeClass(task.status)}>
            {taskAssignmentStatusLabel(task.status)}
          </Badge>
          <Badge className="border border-white/10 bg-white/10 text-white">
            {!isDeliverable
              ? 'No disponible'
              : currentSubmission
              ? `Entregado · ${submissionStatusLabel(currentSubmission.status)}`
              : 'Pendiente'}
          </Badge>
        </div>

        {task.task_template?.description ? (
          <div className="mt-2 text-xs text-white/70">
            {task.task_template.description}
          </div>
        ) : null}

        {task.task_template?.instructions ? (
          <div className="mt-2 rounded-md border border-white/10 bg-black/30 p-2 text-xs text-white/70">
            {task.task_template.instructions}
          </div>
        ) : null}

        {currentSubmission ? (
          <div className="mt-3 space-y-2">
            <div className="text-xs text-white/60">
              Intento #{currentSubmission.attempt_number} ·{' '}
              {formatDateTimeInTimeZone(
                currentSubmission.submitted_at,
                PLATFORM_TIMEZONE
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {currentSubmission.link_url ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void openSubmissionLink(currentSubmission.id)}
                >
                  Ver link
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              ) : null}
              {currentSubmission.file_path ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void openSubmissionFile(currentSubmission.id)}
                >
                  Ver archivo
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              ) : null}
            </div>
            {currentSubmission.latest_feedback?.comment ? (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-100">
                Feedback: {currentSubmission.latest_feedback.comment}
              </div>
            ) : null}
            <Badge className={submissionStatusBadgeClass(currentSubmission.status)}>
              {submissionStatusLabel(currentSubmission.status)}
            </Badge>
          </div>
        ) : null}

        <div className="mt-3 flex justify-end">
          <Button
            onClick={() => {
              setMilestoneTasksDialogId(null)
              setSubmissionDialogTaskId(task.id)
            }}
            className="gap-2 bg-emerald-700 text-white hover:bg-emerald-600"
            disabled={
              !isDeliverable || (currentSubmission && !task.allow_resubmission)
            }
          >
            <FileUp className="h-4 w-4" />
            {currentSubmission ? 'Reentregar' : 'Entregar'}
          </Button>
        </div>
      </div>
    )
  }

  const handleCertificateOpen = async () => {
    if (state.kind !== 'ready') return
    if (!state.data.application.certificate_object_path) return

    setCertificateBusy(true)

    try {
      const response = await fetch(
        `/api/plataforma/edition-artifacts/get-signed-url?application_id=${state.data.application.id}&kind=certificate`
      )
      const payload = (await response.json()) as {
        signed_url?: string
        message?: string
      }

      if (!response.ok || !payload.signed_url) {
        throw new Error(payload.message ?? 'No se pudo obtener el enlace')
      }

      window.open(payload.signed_url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error inesperado'
      showErrorRef.current('No se pudo abrir el certificado', message)
    } finally {
      setCertificateBusy(false)
    }
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
      showErrorRef.current(payload?.message ?? 'No se pudo abrir archivo')
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
      showErrorRef.current(payload?.message ?? 'No se pudo abrir el link')
      return
    }
    window.open(payload.link_url, '_blank', 'noopener,noreferrer')
  }

  async function submitTask() {
    if (state.kind !== 'ready' || !submissionDialogTaskId || !selectedTask)
      return

    const submissionType = selectedTask.allowed_submission_type
    const hasLink = Boolean(submissionLink.trim())
    const hasFile = Boolean(submissionFile)

    if (submissionType === 'link' && (!hasLink || hasFile)) {
      showErrorRef.current(
        'Esta tarea acepta solo link. Completa URL y no adjuntes archivo.'
      )
      return
    }

    if (submissionType === 'file' && (!hasFile || hasLink)) {
      showErrorRef.current(
        'Esta tarea acepta solo archivo. Adjunta archivo y no incluyas URL.'
      )
      return
    }

    if (submissionType === 'both' && (!hasLink || !hasFile)) {
      showErrorRef.current('Esta tarea requiere link y archivo.')
      return
    }

    setSubmittingTask(true)
    const formData = new FormData()
    formData.append('task_assignment_id', submissionDialogTaskId)
    if (submissionLink.trim())
      formData.append('link_url', submissionLink.trim())
    if (submissionComment.trim())
      formData.append('comment', submissionComment.trim())
    if (submissionFile) formData.append('file', submissionFile)

    const response = await fetch('/api/plataforma/submissions', {
      method: 'POST',
      body: formData,
    })
    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      message?: string
    } | null
    setSubmittingTask(false)

    if (!response.ok || !payload?.ok) {
      showErrorRef.current(payload?.message ?? 'No se pudo enviar la entrega.')
      return
    }

    setSubmissionDialogTaskId(null)
    setSubmissionLink('')
    setSubmissionComment('')
    setSubmissionFile(null)
    await loadTasks(state.data.application.id)
  }

  if (state.kind === 'loading') {
    return (
      <Card className="border bg-background/10">
        <CardContent className="py-10 text-sm text-white/70">
          Cargando espacio de trabajo...
        </CardContent>
      </Card>
    )
  }

  if (state.kind === 'unauthorized') {
    return (
      <Card className="border bg-background/10">
        <CardContent className="py-8 space-y-3">
          <div className="text-sm text-white/70">
            {state.message || 'No autorizado.'}
          </div>
          <Button
            variant="secondary"
            className="bg-white/10 hover:bg-white/15 border border-white/10 text-white"
            onClick={() => router.push('/plataforma/talento/mis-postulaciones')}
          >
            Ir a mis postulaciones
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (state.kind === 'error') {
    return (
      <Card className="border bg-background/10">
        <CardContent className="py-8 space-y-3">
          <div className="text-sm text-white/70">
            {state.message || 'No se pudo cargar el contenido.'}
          </div>
          <Button
            variant="secondary"
            className="bg-white/10 hover:bg-white/15 border border-white/10 text-white"
            onClick={() => router.refresh()}
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { data } = state
  const programTitle = data.program.title ?? 'Programa'
  const editionName = data.edition.edition_name ?? 'Edición'

  const teamLinks = [
    {
      key: 'drive',
      label: 'Drive',
      href: data.team?.drive_url ?? null,
      icon: <Folder className="h-4 w-4" />,
    },
    {
      key: 'classroom',
      label: 'Classroom',
      href: data.team?.classroom_url ?? null,
      icon: <GraduationCap className="h-4 w-4" />,
    },
    {
      key: 'slack',
      label: 'Slack',
      href: data.team?.slack_url ?? null,
      icon: <MessageSquare className="h-4 w-4" />,
    },
  ].filter((link) => Boolean(link.href))

  return (
    <div className="space-y-6 text-white">
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-[0.2em] text-white/40">
          Espacio de trabajo
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="text-2xl font-semibold text-white break-words">
              {programTitle}
            </div>
            <div className="text-sm text-white/70 break-words">
              Edición: {editionName}
            </div>
            <div className="text-xs text-white/50">
              Zona horaria oficial: {PLATFORM_TIMEZONE_LABEL}
            </div>
            {editionRange ? (
              <div className="text-sm text-white/70">{editionRange}</div>
            ) : null}
          </div>
          <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
            Matrícula confirmada
          </Badge>
        </div>
      </div>

      <div
        className={[
          'grid gap-4',
          showCertificate ? 'md:grid-cols-2' : 'md:grid-cols-1',
        ].join(' ')}
      >
        <Card className="border bg-background/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Mi equipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.team ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border bg-background/10">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {data.team.name}
                    </div>
                    <div className="text-xs text-white/60">Equipo asignado</div>
                  </div>
                </div>

                {teamLinks.length ? (
                  <div className="flex flex-wrap gap-2">
                    {teamLinks.map((link) => (
                      <Button
                        key={link.key}
                        variant="secondary"
                        className="gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white"
                        asChild
                      >
                        <Link
                          href={link.href ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.label} {link.icon}
                        </Link>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-white/70">
                    No hay enlaces disponibles todavía.
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-white/70">
                Aún no tienes equipo asignado.
              </div>
            )}
          </CardContent>
        </Card>

        {showCertificate ? (
          <Card className="border bg-background/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">
                Certificado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl border bg-background/10">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    Certificado disponible
                  </div>
                  <div className="text-xs text-white/70">
                    Descarga tu constancia de participación.
                  </div>
                </div>
              </div>
              <Button
                className="gap-2 bg-emerald-700 hover:bg-emerald-600 text-white"
                disabled={certificateBusy}
                onClick={() => void handleCertificateOpen()}
              >
                Ver certificado <ExternalLink className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card className="border bg-background/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">
            Hitos de la edición
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data.milestones.length ? (
            <div className="text-sm text-white/70">No hay hitos todavía.</div>
          ) : (
            <div
              className="rounded-lg border border-white/10 overflow-hidden"
              style={{ contentVisibility: 'auto' }}
            >
              <div className="hidden md:grid grid-cols-12 gap-0 border-b border-white/10 bg-white/5 text-xs text-white/60 font-medium">
                <div className="col-span-6 px-3 py-2">Hito</div>
                <div className="col-span-3 px-3 py-2">Fecha</div>
                <div className="col-span-3 px-3 py-2 text-right">Acciones</div>
              </div>

              {data.milestones.map((milestone) => {
                const dateLabel = milestone.starts_at
                  ? formatDateOnlyInTimeZone(
                      milestone.starts_at,
                      PLATFORM_TIMEZONE
                    )
                  : '-'
                const milestoneTasks =
                  tasksByMilestone.grouped.get(milestone.id) ?? []

                return (
                  <div
                    key={milestone.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-0 border-b border-white/10 last:border-b-0 bg-black/20 px-3 py-3"
                  >
                    <div className="md:col-span-6">
                      <div className="text-sm font-semibold text-white">
                        {milestone.title}
                      </div>
                    </div>
                    <div className="md:col-span-3 text-sm text-white/60">
                      {dateLabel}
                    </div>
                    <div className="md:col-span-3">
                      <div className="flex flex-wrap justify-start md:justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-white/10 hover:bg-white/15 border border-white/10 text-white"
                          onClick={() => setMilestoneTasksDialogId(milestone.id)}
                        >
                          Tareas ({milestoneTasks.length})
                        </Button>
                        {milestone.meet_url ? (
                          <Button
                            size="icon"
                            variant="secondary"
                            className="bg-white/10 hover:bg-white/15 border border-white/10 text-white"
                            asChild
                          >
                            <Link
                              href={milestone.meet_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Abrir meet"
                              title="Abrir meet"
                            >
                              <Video className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">Abrir meet</span>
                            </Link>
                          </Button>
                        ) : null}
                        {milestone.drive_url ? (
                          <Button
                            size="icon"
                            variant="secondary"
                            className="bg-white/10 hover:bg-white/15 border border-white/10 text-white"
                            asChild
                          >
                            <Link
                              href={milestone.drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Abrir drive"
                              title="Abrir drive"
                            >
                              <Folder className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">Abrir drive</span>
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {tasksByMilestone.withoutMilestone.length > 0 ? (
        <Card className="border border-amber-500/30 bg-amber-500/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-amber-100">
              Tareas sin hito visible
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksByMilestone.withoutMilestone.map((task) =>
              renderTaskCard(task)
            )}
          </CardContent>
        </Card>
      ) : null}

      <Dialog
        open={Boolean(milestoneTasksDialogId)}
        onOpenChange={(open) => {
          if (!open) setMilestoneTasksDialogId(null)
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto border border-white/10 bg-black text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedMilestoneForTasks?.title ?? 'Tareas del hito'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            {tasksLoading ? (
              <div className="text-sm text-white/70">Cargando tareas...</div>
            ) : selectedMilestoneTasks.length === 0 ? (
              <div className="text-sm text-white/70">
                No hay tareas publicadas para este hito.
              </div>
            ) : (
              selectedMilestoneTasks.map((task) => renderTaskCard(task))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(submissionDialogTaskId)}
        onOpenChange={(open) => {
          if (!open) {
            setSubmissionDialogTaskId(null)
            setSubmissionLink('')
            setSubmissionComment('')
            setSubmissionFile(null)
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto border border-white/10 bg-black text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedTask?.task_template?.title ?? 'Enviar entrega'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border border-white/10 bg-white/5 p-2 text-xs text-white/70">
              Tipo de entrega requerido:{' '}
              {submissionTypeLabel(selectedTaskSubmissionType)}
            </div>
            {showLinkInput ? (
              <div className="space-y-2">
                <Label className="text-white/70">
                  Link de entrega
                  {selectedTaskSubmissionType === 'both'
                    ? ' (obligatorio)'
                    : ''}
                </Label>
                <Input
                  value={submissionLink}
                  onChange={(event) => setSubmissionLink(event.target.value)}
                  className="border-white/10 bg-white/5"
                  placeholder="https://..."
                />
              </div>
            ) : null}
            {showFileInput ? (
              <div className="space-y-2">
                <Label className="text-white/70">
                  Archivo
                  {selectedTaskSubmissionType === 'both'
                    ? ' (obligatorio)'
                    : ''}
                </Label>
                <Input
                  type="file"
                  onChange={(event) =>
                    setSubmissionFile(event.target.files?.[0] ?? null)
                  }
                  className="border-white/10 bg-white/5"
                />
                <div className="text-[11px] text-white/50">
                  Máximo 25MB. PDF, imágenes, ZIP, DOC/DOCX o TXT.
                </div>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label className="text-white/70">Comentario</Label>
              <Textarea
                value={submissionComment}
                onChange={(event) => setSubmissionComment(event.target.value)}
                className="border-white/10 bg-white/5"
                placeholder="Notas de entrega"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              className="border border-white/10 bg-white/10 text-white hover:bg-white/15"
              onClick={() => setSubmissionDialogTaskId(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void submitTask()}
              disabled={submittingTask}
              className="bg-emerald-700 text-white hover:bg-emerald-600"
            >
              {submittingTask ? 'Enviando...' : 'Enviar entrega'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
