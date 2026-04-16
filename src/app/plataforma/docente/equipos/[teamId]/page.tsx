'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { CalendarClock, ListChecks, Users } from 'lucide-react'

import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { participantRoleLabel } from '@/lib/platform/roles'
import {
  formatDateTimeInTimeZone,
  PLATFORM_TIMEZONE_LABEL,
} from '@/lib/platform/timezone'

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

type AssignmentRow = {
  id: string
  milestone_id: string
  submission_mode: 'team' | 'individual'
  allowed_submission_type: 'link' | 'file' | 'both'
  deadline_at: string | null
  max_attempts: number
  status: 'draft' | 'published' | 'closed' | 'archived'
  task_template: {
    id: string
    title: string
    description: string | null
    instructions: string | null
  } | null
}

type WorkspacePayload = {
  ok: boolean
  viewer: {
    id: string
    role: string
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

const PRIMARY_CTA_CLASS = 'bg-[#00CCA4] text-slate-950 hover:bg-[#00b997]'

const DEFAULT_TASK_FORM = {
  milestone_id: 'none',
  title: '',
  description: '',
  instructions: '',
  submission_mode: 'team' as 'team' | 'individual',
  allowed_submission_type: 'both' as 'link' | 'file' | 'both',
  deadline_at: '',
  max_attempts: '1',
  allow_resubmission: false,
  resubmission_deadline_at: '',
  status: 'draft' as 'draft' | 'published',
}

function profileName(profile: PublicProfile | null): string {
  const fullName =
    `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || ''
  return fullName || profile?.email || 'Sin nombre'
}

function formatDate(value: string | null): string {
  return formatDateTimeInTimeZone(value)
}

function submissionModeLabel(mode: 'team' | 'individual'): string {
  if (mode === 'team') return 'Una sola entrega por equipo'
  return 'Cada integrante entrega por separado'
}

function submissionTypeLabel(type: 'link' | 'file' | 'both'): string {
  if (type === 'link') return 'Solo enlace'
  if (type === 'file') return 'Solo archivo'
  return 'Enlace y archivo'
}

export default function DocenteTeamWorkspacePage() {
  const params = useParams<{ teamId?: string }>()
  const teamId = String(params.teamId ?? '').trim()
  const { showError, showSuccess } = useToastEnhanced()

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null)

  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [taskForm, setTaskForm] =
    useState<typeof DEFAULT_TASK_FORM>(DEFAULT_TASK_FORM)

  const [selectedMember, setSelectedMember] = useState<TeamMemberRow | null>(
    null
  )

  async function loadWorkspace() {
    setLoading(true)
    const response = await fetch(
      `/api/plataforma/docente/teams/${teamId}/workspace`,
      {
        cache: 'no-store',
      }
    )

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

  const assignmentsByMilestone = useMemo(() => {
    const map = new Map<string, AssignmentRow[]>()
    for (const assignment of workspace?.assignments ?? []) {
      const bucket = map.get(assignment.milestone_id) ?? []
      bucket.push(assignment)
      map.set(assignment.milestone_id, bucket)
    }
    return map
  }, [workspace?.assignments])

  async function createTask() {
    if (!workspace) return

    if (taskForm.milestone_id === 'none' || !taskForm.title.trim()) {
      showError('Selecciona hito y completa el título de la tarea.')
      return
    }

    const maxAttempts = Number(taskForm.max_attempts)
    if (!Number.isFinite(maxAttempts) || maxAttempts < 1) {
      showError('La cantidad de intentos debe ser un número mayor o igual a 1.')
      return
    }

    setBusy(true)

    const response = await fetch('/api/plataforma/tasks/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_id: workspace.team.id,
        milestone_id: taskForm.milestone_id,
        title: taskForm.title,
        description: taskForm.description,
        instructions: taskForm.instructions,
        submission_mode: taskForm.submission_mode,
        allowed_submission_type: taskForm.allowed_submission_type,
        deadline_at: taskForm.deadline_at || null,
        allow_resubmission: taskForm.allow_resubmission,
        resubmission_deadline_at: taskForm.allow_resubmission
          ? taskForm.resubmission_deadline_at || null
          : null,
        max_attempts: Math.floor(maxAttempts),
        status: taskForm.status,
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
    setCreateTaskOpen(false)
    setTaskForm(DEFAULT_TASK_FORM)
    await loadWorkspace()
  }

  function openCreateTaskModal(preselectedMilestoneId?: string) {
    setTaskForm((previous) => ({
      ...DEFAULT_TASK_FORM,
      milestone_id: preselectedMilestoneId ?? previous.milestone_id,
    }))
    setCreateTaskOpen(true)
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
        <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <CardTitle>{workspace.team.name}</CardTitle>
            <div className="text-sm text-slate-300">
              {workspace.team.edition?.program?.title ?? 'Programa'} ·{' '}
              {workspace.team.edition?.edition_name ?? 'Edición'}
            </div>
            <div className="text-xs text-slate-400">
              Zona horaria oficial: {PLATFORM_TIMEZONE_LABEL}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge className="border border-slate-700 bg-slate-800 text-slate-100">
                <Users className="mr-1 h-3 w-3" />
                {workspace.members.length} miembros
              </Badge>
              <Badge className="border border-slate-700 bg-slate-800 text-slate-100">
                {workspace.docentes.length} docentes asignados
              </Badge>
              <Badge className="border border-slate-700 bg-slate-800 text-slate-100">
                {workspace.milestones.length} hitos
              </Badge>
            </div>
          </div>

          <div className="flex w-full flex-wrap justify-start gap-2 md:w-auto md:justify-end">
            <Button
              className={PRIMARY_CTA_CLASS}
              onClick={() => openCreateTaskModal()}
              disabled={workspace.milestones.length === 0}
            >
              Crear tarea
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
            >
              <Link href={`/plataforma/docente/equipos/${teamId}/tareas`}>
                Ver tareas del equipo
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>Miembros del equipo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {workspace.members.length === 0 ? (
            <div className="text-sm text-slate-400">
              No hay integrantes enrolados en este equipo.
            </div>
          ) : (
            workspace.members.map((member) => (
              <div
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-950 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-100">
                    {profileName(member.applicant)}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {member.applicant?.email ?? '--'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="border border-slate-700 bg-slate-800 text-slate-100">
                    {participantRoleLabel(member.assigned_role)}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
                    onClick={() => setSelectedMember(member)}
                  >
                    Ver detalle
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>Hitos del equipo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {workspace.milestones.length === 0 ? (
            <div className="text-sm text-slate-400">
              Este equipo aún no tiene hitos configurados.
            </div>
          ) : (
            workspace.milestones.map((milestone) => {
              const milestoneTasks =
                assignmentsByMilestone.get(milestone.id) ?? []

              return (
                <div
                  key={milestone.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-950 px-3 py-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="truncate text-sm font-semibold text-slate-100">
                      {milestone.title}
                    </div>
                    <div className="text-xs text-slate-400">
                      Posición: {milestone.position ?? '--'} · Inicio:{' '}
                      {formatDate(milestone.starts_at)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {milestoneTasks.length} tarea(s) asociadas
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
                      onClick={() => openCreateTaskModal(milestone.id)}
                    >
                      Crear tarea
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="text-slate-200 hover:bg-slate-800"
                    >
                      <Link
                        href={`/plataforma/docente/equipos/${teamId}/tareas?milestone_id=${milestone.id}`}
                      >
                        Ver tareas del hito
                      </Link>
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Dialog
        open={createTaskOpen}
        onOpenChange={(open) => {
          setCreateTaskOpen(open)
          if (!open) {
            setTaskForm(DEFAULT_TASK_FORM)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border border-slate-800 bg-slate-900 text-slate-100 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear tarea</DialogTitle>
            <DialogDescription className="text-slate-400">
              Define hito, modalidad de entrega y reglas de revisión para esta
              tarea.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Hito</Label>
                <Select
                  value={taskForm.milestone_id}
                  onValueChange={(value) =>
                    setTaskForm((previous) => ({
                      ...previous,
                      milestone_id: value,
                    }))
                  }
                >
                  <SelectTrigger className="border-slate-800 bg-slate-950">
                    <SelectValue placeholder="Selecciona un hito" />
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
                <Label>Estado inicial</Label>
                <Select
                  value={taskForm.status}
                  onValueChange={(value) =>
                    setTaskForm((previous) => ({
                      ...previous,
                      status: value as 'draft' | 'published',
                    }))
                  }
                >
                  <SelectTrigger className="border-slate-800 bg-slate-950">
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="published">Publicada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Modo de entrega</Label>
                <Select
                  value={taskForm.submission_mode}
                  onValueChange={(value) =>
                    setTaskForm((previous) => ({
                      ...previous,
                      submission_mode: value as 'team' | 'individual',
                    }))
                  }
                >
                  <SelectTrigger className="border-slate-800 bg-slate-950">
                    <SelectValue placeholder="Selecciona modalidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team">
                      Una sola entrega por equipo
                    </SelectItem>
                    <SelectItem value="individual">
                      Cada integrante entrega por separado
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de entrega</Label>
                <Select
                  value={taskForm.allowed_submission_type}
                  onValueChange={(value) =>
                    setTaskForm((previous) => ({
                      ...previous,
                      allowed_submission_type: value as
                        | 'link'
                        | 'file'
                        | 'both',
                    }))
                  }
                >
                  <SelectTrigger className="border-slate-800 bg-slate-950">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Solo enlace</SelectItem>
                    <SelectItem value="file">Solo archivo</SelectItem>
                    <SelectItem value="both">Enlace y archivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400">
              Modalidad seleccionada:{' '}
              {submissionModeLabel(taskForm.submission_mode)} ·{' '}
              {submissionTypeLabel(taskForm.allowed_submission_type)}
            </div>

            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={taskForm.title}
                onChange={(event) =>
                  setTaskForm((previous) => ({
                    ...previous,
                    title: event.target.value,
                  }))
                }
                className="border-slate-800 bg-slate-950"
                placeholder="Ej: Entrevista de descubrimiento"
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={taskForm.description}
                onChange={(event) =>
                  setTaskForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                className="border-slate-800 bg-slate-950"
                placeholder="Resumen breve de la tarea"
              />
            </div>

            <div className="space-y-2">
              <Label>Instrucciones</Label>
              <Textarea
                value={taskForm.instructions}
                onChange={(event) =>
                  setTaskForm((previous) => ({
                    ...previous,
                    instructions: event.target.value,
                  }))
                }
                className="border-slate-800 bg-slate-950"
                placeholder="Instrucciones detalladas para la entrega"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="datetime-local"
                  value={taskForm.deadline_at}
                  onChange={(event) =>
                    setTaskForm((previous) => ({
                      ...previous,
                      deadline_at: event.target.value,
                    }))
                  }
                  className="border-slate-800 bg-slate-950"
                  aria-label="Deadline en hora local"
                />
              </div>

              <div className="space-y-2">
                <Label>Intentos máximos</Label>
                <Input
                  value={taskForm.max_attempts}
                  onChange={(event) =>
                    setTaskForm((previous) => ({
                      ...previous,
                      max_attempts: event.target.value,
                    }))
                  }
                  className="border-slate-800 bg-slate-950"
                  inputMode="numeric"
                  placeholder="1"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-md border border-slate-800 bg-slate-950 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-sm text-slate-100">
                    Permitir reentrega
                  </div>
                  <div className="text-xs text-slate-400">
                    Si se activa, puedes definir una fecha límite adicional.
                  </div>
                </div>
                <Switch
                  checked={taskForm.allow_resubmission}
                  onCheckedChange={(checked) =>
                    setTaskForm((previous) => ({
                      ...previous,
                      allow_resubmission: checked,
                      resubmission_deadline_at: checked
                        ? previous.resubmission_deadline_at
                        : '',
                    }))
                  }
                />
              </div>

              {taskForm.allow_resubmission ? (
                <div className="space-y-2">
                  <Label>Deadline de reentrega</Label>
                  <Input
                    type="datetime-local"
                    value={taskForm.resubmission_deadline_at}
                    onChange={(event) =>
                      setTaskForm((previous) => ({
                        ...previous,
                        resubmission_deadline_at: event.target.value,
                      }))
                    }
                    className="border-slate-800 bg-slate-900"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
              onClick={() => setCreateTaskOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className={PRIMARY_CTA_CLASS}
              disabled={busy || workspace.milestones.length === 0}
              onClick={() => void createTask()}
            >
              Crear tarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedMember)}
        onOpenChange={(open) => {
          if (!open) setSelectedMember(null)
        }}
      >
        <DialogContent className="border border-slate-800 bg-slate-900 text-slate-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del integrante</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm text-slate-300">
            <div>
              <div className="text-xs text-slate-400">Nombre</div>
              <div>{profileName(selectedMember?.applicant ?? null)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Email</div>
              <div>{selectedMember?.applicant?.email ?? '--'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Rol asignado</div>
              <div>
                {participantRoleLabel(selectedMember?.assigned_role, '--')}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Estado</div>
              <div>Enrolado</div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
              onClick={() => setSelectedMember(null)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
