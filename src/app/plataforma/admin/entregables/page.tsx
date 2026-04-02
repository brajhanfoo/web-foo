'use client'

import { useEffect, useMemo, useState } from 'react'
import { PlusCircle } from 'lucide-react'

import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

type TeamRef = {
  id: string
  name: string
  edition?: { edition_name?: string; program?: { title?: string } | null } | null
}

type MilestoneRef = {
  id: string
  team_id: string
  title: string
  starts_at: string | null
  position: number | null
}

type Assignment = {
  id: string
  milestone_id: string
  team_id: string
  submission_mode: 'team' | 'individual'
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

export default function AdminEntregablesPage() {
  const { showError, showSuccess } = useToastEnhanced()
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [teams, setTeams] = useState<TeamRef[]>([])
  const [milestones, setMilestones] = useState<MilestoneRef[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])

  const [teamId, setTeamId] = useState<string>('none')
  const [milestoneId, setMilestoneId] = useState<string>('none')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [submissionMode, setSubmissionMode] = useState<'team' | 'individual'>(
    'team'
  )
  const [gradingMode, setGradingMode] = useState<'score_100' | 'pass_fail' | 'none'>(
    'score_100'
  )
  const [deadlineAt, setDeadlineAt] = useState('')
  const [allowResubmission, setAllowResubmission] = useState(false)
  const [resubDeadlineAt, setResubDeadlineAt] = useState('')
  const [maxAttempts, setMaxAttempts] = useState('1')
  const [initialStatus, setInitialStatus] = useState<
    'draft' | 'published' | 'closed' | 'archived'
  >('draft')

  async function loadReferences(nextTeamId?: string) {
    const effectiveTeam = nextTeamId ?? teamId
    const query =
      effectiveTeam && effectiveTeam !== 'none' ? `?team_id=${effectiveTeam}` : ''
    const response = await fetch(`/api/plataforma/tasks/references${query}`, {
      cache: 'no-store',
    })
    const payload = (await response.json().catch(() => null)) as
      | {
          ok: boolean
          teams?: TeamRef[]
          milestones?: MilestoneRef[]
          message?: string
        }
      | null
    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudieron cargar referencias.')
      return
    }
    setTeams(payload.teams ?? [])
    setMilestones(payload.milestones ?? [])
  }

  async function loadAssignments(nextTeamId?: string) {
    const effectiveTeam = nextTeamId ?? teamId
    if (!effectiveTeam || effectiveTeam === 'none') {
      setAssignments([])
      return
    }
    const response = await fetch(
      `/api/plataforma/tasks/assignments?team_id=${effectiveTeam}`,
      {
        cache: 'no-store',
      }
    )
    const payload = (await response.json().catch(() => null)) as
      | { ok: boolean; assignments?: Assignment[]; message?: string }
      | null
    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudieron cargar tareas.')
      return
    }
    setAssignments((payload.assignments ?? []) as Assignment[])
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      await loadReferences('none')
      setLoading(false)
    }
    void run()
  }, [])

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === teamId) ?? null,
    [teams, teamId]
  )

  async function handleTeamChange(nextTeamId: string) {
    setTeamId(nextTeamId)
    setMilestoneId('none')
    await loadReferences(nextTeamId)
    await loadAssignments(nextTeamId)
  }

  async function createAssignment() {
    if (teamId === 'none' || milestoneId === 'none' || !title.trim()) {
      showError('Selecciona equipo/hito e ingresa título.')
      return
    }
    setBusy(true)
    const response = await fetch('/api/plataforma/tasks/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_id: teamId,
        milestone_id: milestoneId,
        title,
        description,
        instructions,
        submission_mode: submissionMode,
        grading_mode: gradingMode,
        deadline_at: deadlineAt || null,
        allow_resubmission: allowResubmission,
        resubmission_deadline_at: allowResubmission ? resubDeadlineAt || null : null,
        max_attempts: Number(maxAttempts),
        status: initialStatus,
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
    setAllowResubmission(false)
    setResubDeadlineAt('')
    setMaxAttempts('1')
    setInitialStatus('draft')
    await loadAssignments(teamId)
  }

  async function updateAssignmentStatus(
    assignmentId: string,
    status: 'draft' | 'published' | 'closed' | 'archived'
  ) {
    setBusy(true)
    const response = await fetch('/api/plataforma/tasks/assignments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignment_id: assignmentId, status }),
    })
    const payload = (await response.json().catch(() => null)) as
      | { ok: boolean; message?: string }
      | null
    setBusy(false)
    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo actualizar estado.')
      return
    }
    showSuccess('Estado actualizado.')
    await loadAssignments(teamId)
  }

  async function enableResubmission(assignmentId: string) {
    setBusy(true)
    const response = await fetch('/api/plataforma/tasks/assignments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignment_id: assignmentId,
        allow_resubmission: true,
        resubmission_deadline_at: resubDeadlineAt || null,
      }),
    })
    const payload = (await response.json().catch(() => null)) as
      | { ok: boolean; message?: string }
      | null
    setBusy(false)
    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo habilitar reentrega.')
      return
    }
    showSuccess('Reentrega habilitada.')
    await loadAssignments(teamId)
  }

  if (loading) {
    return (
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="py-8 text-sm text-slate-300">
          Cargando entregables...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>Entregables</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">
          Crea y publica tareas por milestone sin cambiar el flujo existente.
        </CardContent>
      </Card>

      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>Nueva tarea asignada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Equipo</Label>
              <Select value={teamId} onValueChange={(value) => void handleTeamChange(value)}>
                <SelectTrigger className="border-slate-800 bg-slate-950">
                  <SelectValue placeholder="Selecciona equipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecciona</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTeam?.edition ? (
                <div className="text-xs text-slate-500">
                  {selectedTeam.edition.program?.title ?? 'Programa'} ·{' '}
                  {selectedTeam.edition.edition_name ?? 'Edición'}
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Milestone</Label>
              <Select value={milestoneId} onValueChange={setMilestoneId}>
                <SelectTrigger className="border-slate-800 bg-slate-950">
                  <SelectValue placeholder="Selecciona hito" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecciona</SelectItem>
                  {milestones.map((milestone) => (
                    <SelectItem key={milestone.id} value={milestone.id}>
                      {milestone.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="border-slate-800 bg-slate-950"
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha límite</Label>
              <Input
                type="datetime-local"
                value={deadlineAt}
                onChange={(event) => setDeadlineAt(event.target.value)}
                className="border-slate-800 bg-slate-950"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="border-slate-800 bg-slate-950"
            />
          </div>
          <div className="space-y-2">
            <Label>Instrucciones</Label>
            <Textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              className="border-slate-800 bg-slate-950"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <Select
              value={submissionMode}
              onValueChange={(value) =>
                setSubmissionMode(value as 'team' | 'individual')
              }
            >
              <SelectTrigger className="border-slate-800 bg-slate-950">
                <SelectValue placeholder="Modo entrega" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team">Entrega por equipo</SelectItem>
                <SelectItem value="individual">Entrega individual</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={gradingMode}
              onValueChange={(value) =>
                setGradingMode(value as 'score_100' | 'pass_fail' | 'none')
              }
            >
              <SelectTrigger className="border-slate-800 bg-slate-950">
                <SelectValue placeholder="Evaluación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score_100">Puntaje 0-100</SelectItem>
                <SelectItem value="pass_fail">Pass / Fail</SelectItem>
                <SelectItem value="none">Sin nota</SelectItem>
              </SelectContent>
            </Select>

            <Input
              value={maxAttempts}
              onChange={(event) => setMaxAttempts(event.target.value)}
              className="border-slate-800 bg-slate-950"
              placeholder="Max intentos"
              inputMode="numeric"
            />

            <Select
              value={String(allowResubmission)}
              onValueChange={(value) => setAllowResubmission(value === 'true')}
            >
              <SelectTrigger className="border-slate-800 bg-slate-950">
                <SelectValue placeholder="Reentrega" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Sin reentrega</SelectItem>
                <SelectItem value="true">Permitir reentrega</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={initialStatus}
              onValueChange={(value) =>
                setInitialStatus(
                  value as 'draft' | 'published' | 'closed' | 'archived'
                )
              }
            >
              <SelectTrigger className="border-slate-800 bg-slate-950">
                <SelectValue placeholder="Estado inicial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="published">Publicada</SelectItem>
                <SelectItem value="closed">Cerrada</SelectItem>
                <SelectItem value="archived">Archivada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {allowResubmission ? (
            <div className="space-y-2">
              <Label>Fecha límite de reentrega</Label>
              <Input
                type="datetime-local"
                value={resubDeadlineAt}
                onChange={(event) => setResubDeadlineAt(event.target.value)}
                className="border-slate-800 bg-slate-950"
              />
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button disabled={busy} onClick={() => void createAssignment()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear tarea
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>Tareas del equipo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {teamId === 'none' ? (
            <div className="text-sm text-slate-400">
              Selecciona un equipo para ver tareas.
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-sm text-slate-400">No hay tareas asignadas.</div>
          ) : (
            assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-lg border border-slate-800 bg-slate-950 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-100">
                      {assignment.task_template?.title ?? 'Sin título'}
                    </div>
                    <div className="text-xs text-slate-400">
                      Hito: {assignment.milestone?.title ?? '—'}
                    </div>
                    <div className="text-xs text-slate-500">
                      Modo: {assignment.submission_mode} · Deadline:{' '}
                      {formatDate(assignment.deadline_at)}
                    </div>
                  </div>
                  <Badge className="border border-slate-700 bg-slate-800 text-slate-100">
                    {assignment.status}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {assignment.status !== 'published' ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        void updateAssignmentStatus(assignment.id, 'published')
                      }
                    >
                      Publicar
                    </Button>
                  ) : null}
                  {assignment.status !== 'closed' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700 bg-slate-900 text-slate-100"
                      onClick={() =>
                        void updateAssignmentStatus(assignment.id, 'closed')
                      }
                    >
                      Cerrar
                    </Button>
                  ) : null}
                  {!assignment.allow_resubmission ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                      onClick={() => void enableResubmission(assignment.id)}
                    >
                      Habilitar reentrega
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

