'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ExternalLink, MessageSquareText } from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type SubmissionRow = {
  id: string
  submission_scope: 'team' | 'individual'
  owner_profile_id: string | null
  submission_type: 'link' | 'file' | 'both'
  link_url: string | null
  file_path: string | null
  file_name: string | null
  attempt_number: number
  status: 'submitted' | 'changes_requested' | 'approved' | 'rejected' | 'reviewed'
  submitted_at: string
  latest_feedback: {
    feedback_id: string
    comment: string | null
    score: number | null
    created_at: string
  } | null
}

type AssignmentRow = {
  id: string
  milestone_id: string
  submission_mode: 'team' | 'individual'
  deadline_at: string | null
  allow_resubmission: boolean
  resubmission_deadline_at: string | null
  max_attempts: number
  grading_mode: 'score_100' | 'pass_fail' | 'none'
  status: 'draft' | 'published' | 'closed' | 'archived'
  task_template: {
    title: string
    description: string | null
    instructions: string | null
  } | null
  submissions: SubmissionRow[]
}

type MilestoneRow = {
  id: string
  title: string
  position: number | null
}

type WorkspacePayload = {
  ok: boolean
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
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function DocenteTeamWorkspacePage() {
  const params = useParams<{ teamId?: string }>()
  const teamId = String(params.teamId ?? '').trim()
  const { showError, showSuccess } = useToastEnhanced()

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null)

  const [milestoneId, setMilestoneId] = useState<string>('none')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [submissionMode, setSubmissionMode] = useState<'team' | 'individual'>(
    'team'
  )
  const [deadlineAt, setDeadlineAt] = useState('')
  const [maxAttempts, setMaxAttempts] = useState('1')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')

  const [reviewSubmissionId, setReviewSubmissionId] = useState<string | null>(null)
  const [reviewStatus, setReviewStatus] = useState<
    'changes_requested' | 'approved' | 'rejected' | 'reviewed'
  >('reviewed')
  const [reviewScore, setReviewScore] = useState('')
  const [reviewComment, setReviewComment] = useState('')

  async function loadWorkspace() {
    setLoading(true)
    const response = await fetch(`/api/plataforma/docente/teams/${teamId}/workspace`, {
      cache: 'no-store',
    })
    const payload = (await response.json().catch(() => null)) as
      | WorkspacePayload
      | { ok: false; message?: string }
      | null
    if (!response.ok || !payload || !payload.ok) {
      const message =
        payload && 'message' in payload
          ? payload.message
          : 'No se pudo cargar workspace de equipo.'
      showError(message ?? 'No se pudo cargar workspace de equipo.')
      setLoading(false)
      return
    }
    setWorkspace(payload)
    setLoading(false)
  }

  useEffect(() => {
    if (!teamId) return
    void loadWorkspace()
  }, [teamId])

  const selectedSubmission = useMemo(() => {
    for (const assignment of workspace?.assignments ?? []) {
      for (const submission of assignment.submissions ?? []) {
        if (submission.id === reviewSubmissionId) return submission
      }
    }
    return null
  }, [reviewSubmissionId, workspace?.assignments])

  async function createTask() {
    if (!workspace || milestoneId === 'none' || !title.trim()) {
      showError('Completa hito y título.')
      return
    }
    setBusy(true)
    const response = await fetch('/api/plataforma/tasks/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_id: workspace.team.id,
        milestone_id: milestoneId,
        title,
        description,
        instructions,
        submission_mode: submissionMode,
        deadline_at: deadlineAt || null,
        max_attempts: Number(maxAttempts),
        status,
      }),
    })
    const payload = (await response.json().catch(() => null)) as
      | { ok: boolean; message?: string }
      | null
    setBusy(false)
    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo crear tarea.')
      return
    }
    showSuccess('Tarea creada.')
    setTitle('')
    setDescription('')
    setInstructions('')
    setDeadlineAt('')
    setMaxAttempts('1')
    setStatus('draft')
    await loadWorkspace()
  }

  async function submitReview() {
    if (!reviewSubmissionId || !reviewComment.trim()) {
      showError('Debes escribir comentario de devolución.')
      return
    }
    setBusy(true)
    const response = await fetch(
      `/api/plataforma/submissions/${reviewSubmissionId}/feedback`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: reviewComment,
          score: reviewScore.trim() ? Number(reviewScore) : null,
          status: reviewStatus,
        }),
      }
    )
    const payload = (await response.json().catch(() => null)) as
      | { ok: boolean; message?: string }
      | null
    setBusy(false)
    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo guardar feedback.')
      return
    }
    showSuccess('Feedback guardado.')
    setReviewSubmissionId(null)
    setReviewComment('')
    setReviewScore('')
    setReviewStatus('reviewed')
    await loadWorkspace()
  }

  async function openSubmissionFile(submissionId: string) {
    const response = await fetch(
      `/api/plataforma/submissions/file-url?submission_id=${submissionId}`
    )
    const payload = (await response.json().catch(() => null)) as
      | { ok: boolean; signed_url?: string; message?: string }
      | null
    if (!response.ok || !payload?.ok || !payload.signed_url) {
      showError(payload?.message ?? 'No se pudo abrir archivo.')
      return
    }
    window.open(payload.signed_url, '_blank', 'noopener,noreferrer')
  }

  if (loading || !workspace) {
    return (
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="py-8 text-sm text-slate-300">
          Cargando workspace del equipo...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>{workspace.team.name}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">
          {workspace.team.edition?.program?.title ?? 'Programa'} ·{' '}
          {workspace.team.edition?.edition_name ?? 'Edición'}
        </CardContent>
      </Card>

      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>Crear tarea para el equipo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Milestone</Label>
              <Select value={milestoneId} onValueChange={setMilestoneId}>
                <SelectTrigger className="border-slate-800 bg-slate-950">
                  <SelectValue placeholder="Selecciona hito" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecciona</SelectItem>
                  {workspace.milestones.map((milestone) => (
                    <SelectItem key={milestone.id} value={milestone.id}>
                      {milestone.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Modo de entrega</Label>
              <Select
                value={submissionMode}
                onValueChange={(value) =>
                  setSubmissionMode(value as 'team' | 'individual')
                }
              >
                <SelectTrigger className="border-slate-800 bg-slate-950">
                  <SelectValue placeholder="Modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">Equipo</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="border-slate-800 bg-slate-950"
            placeholder="Título de tarea"
          />
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="border-slate-800 bg-slate-950"
            placeholder="Descripción"
          />
          <Textarea
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            className="border-slate-800 bg-slate-950"
            placeholder="Instrucciones"
          />

          <div className="grid gap-3 md:grid-cols-3">
            <Input
              type="datetime-local"
              value={deadlineAt}
              onChange={(event) => setDeadlineAt(event.target.value)}
              className="border-slate-800 bg-slate-950"
            />
            <Input
              value={maxAttempts}
              onChange={(event) => setMaxAttempts(event.target.value)}
              className="border-slate-800 bg-slate-950"
              placeholder="Máx intentos"
              inputMode="numeric"
            />
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as 'draft' | 'published')}
            >
              <SelectTrigger className="border-slate-800 bg-slate-950">
                <SelectValue placeholder="Estado inicial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="published">Publicada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button disabled={busy} onClick={() => void createTask()}>
              Crear tarea
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>Tareas y entregas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {workspace.assignments.length === 0 ? (
            <div className="text-sm text-slate-400">
              No hay tareas asignadas todavía.
            </div>
          ) : (
            workspace.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-lg border border-slate-800 bg-slate-950 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-100">
                      {assignment.task_template?.title ?? 'Tarea'}
                    </div>
                    <div className="text-xs text-slate-400">
                      Modo: {assignment.submission_mode} · Estado:{' '}
                      {assignment.status} · Deadline: {formatDate(assignment.deadline_at)}
                    </div>
                  </div>
                  <Badge className="border border-slate-700 bg-slate-800 text-slate-100">
                    {assignment.submissions.length} entregas
                  </Badge>
                </div>

                <div className="mt-3 space-y-2">
                  {assignment.submissions.length === 0 ? (
                    <div className="text-xs text-slate-500">
                      Sin entregas para esta tarea.
                    </div>
                  ) : (
                    assignment.submissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs text-slate-300">
                            Intento #{submission.attempt_number} ·{' '}
                            {formatDate(submission.submitted_at)} ·{' '}
                            {submission.status}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {submission.link_url ? (
                              <Button size="sm" variant="secondary" asChild>
                                <a
                                  href={submission.link_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Link <ExternalLink className="ml-1 h-3 w-3" />
                                </a>
                              </Button>
                            ) : null}
                            {submission.file_path ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => void openSubmissionFile(submission.id)}
                              >
                                Archivo <ExternalLink className="ml-1 h-3 w-3" />
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              onClick={() => setReviewSubmissionId(submission.id)}
                            >
                              <MessageSquareText className="mr-1 h-3 w-3" />
                              Revisar
                            </Button>
                          </div>
                        </div>

                        {submission.latest_feedback?.comment ? (
                          <div className="mt-2 text-xs text-slate-400">
                            Último feedback: {submission.latest_feedback.comment}
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(reviewSubmissionId)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewSubmissionId(null)
            setReviewComment('')
            setReviewScore('')
            setReviewStatus('reviewed')
          }
        }}
      >
        <DialogContent className="border border-slate-800 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle>Revisión de entrega</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-xs text-slate-400">
              Entrega:{' '}
              {selectedSubmission
                ? `${selectedSubmission.id.slice(0, 8)}...`
                : '—'}
            </div>
            <Select
              value={reviewStatus}
              onValueChange={(value) =>
                setReviewStatus(
                  value as
                    | 'changes_requested'
                    | 'approved'
                    | 'rejected'
                    | 'reviewed'
                )
              }
            >
              <SelectTrigger className="border-slate-800 bg-slate-950">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reviewed">Revisado</SelectItem>
                <SelectItem value="changes_requested">Cambios solicitados</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="rejected">Rechazado</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={reviewScore}
              onChange={(event) => setReviewScore(event.target.value)}
              placeholder="Puntaje (opcional)"
              className="border-slate-800 bg-slate-950"
              inputMode="decimal"
            />
            <Textarea
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              className="border-slate-800 bg-slate-950"
              placeholder="Comentario de devolución"
            />
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              className="border border-slate-700 bg-slate-800"
              onClick={() => setReviewSubmissionId(null)}
            >
              Cancelar
            </Button>
            <Button disabled={busy} onClick={() => void submitReview()}>
              Guardar feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

