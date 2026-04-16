'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Plus, RotateCcw } from 'lucide-react'

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
import {
  formatDateTimeInTimeZone,
  PLATFORM_TIMEZONE,
} from '@/lib/platform/timezone'

import type {
  AssignmentRow,
  DocenteDetail,
  EditionRef,
  ProfessionalArea,
  ProgramRef,
  TeamRef,
} from '../components/types'

type DetailPayload = {
  ok: boolean
  message?: string
  docente?: DocenteDetail
  professional_areas?: ProfessionalArea[]
  assignments?: AssignmentRow[]
  teams?: TeamRef[]
  editions?: EditionRef[]
  programs?: ProgramRef[]
}

type EditForm = {
  first_name: string
  last_name: string
  professional_area_id: string
}

type AssignForm = {
  program_id: string
  edition_id: string
  team_id: string
  staff_role: string
}

const DEFAULT_EDIT_FORM: EditForm = {
  first_name: '',
  last_name: '',
  professional_area_id: 'none',
}

const DEFAULT_ASSIGN_FORM: AssignForm = {
  program_id: 'none',
  edition_id: 'none',
  team_id: 'none',
  staff_role: '',
}
const PRIMARY_CTA_CLASS = 'bg-[#00CCA4] text-slate-950 hover:bg-[#00b997]'

function safeText(value: string | null | undefined): string {
  return (value ?? '').trim()
}

function displayName(docente: DocenteDetail | null): string {
  if (!docente) return 'Docente'
  const fullName =
    `${docente.first_name ?? ''} ${docente.last_name ?? ''}`.trim() || ''
  return fullName || docente.email || 'Docente'
}

function formatDate(value: string | null | undefined): string {
  return formatDateTimeInTimeZone(value, PLATFORM_TIMEZONE)
}

export default function AdminDocenteDetailPage() {
  const params = useParams<{ id: string }>()
  const docenteId = params.id

  const { showError, showSuccess, showWarning } = useToastEnhanced()

  const [loading, setLoading] = useState(true)
  const [docente, setDocente] = useState<DocenteDetail | null>(null)
  const [areas, setAreas] = useState<ProfessionalArea[]>([])
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [teams, setTeams] = useState<TeamRef[]>([])
  const [editions, setEditions] = useState<EditionRef[]>([])
  const [programs, setPrograms] = useState<ProgramRef[]>([])

  const [editOpen, setEditOpen] = useState(false)
  const [editBusy, setEditBusy] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>(DEFAULT_EDIT_FORM)

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignBusy, setAssignBusy] = useState(false)
  const [assignForm, setAssignForm] = useState<AssignForm>(DEFAULT_ASSIGN_FORM)

  const [actionsBusy, setActionsBusy] = useState(false)
  const [removeCandidate, setRemoveCandidate] = useState<AssignmentRow | null>(
    null
  )
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false)

  async function loadDetail() {
    if (!docenteId) return
    setLoading(true)

    const response = await fetch(
      `/api/plataforma/admin/docentes/${docenteId}`,
      {
        cache: 'no-store',
      }
    )

    const payload = (await response
      .json()
      .catch(() => null)) as DetailPayload | null

    if (!response.ok || !payload?.ok || !payload.docente) {
      showError(payload?.message ?? 'No se pudo cargar el detalle del docente.')
      setDocente(null)
      setAreas([])
      setAssignments([])
      setTeams([])
      setEditions([])
      setPrograms([])
      setLoading(false)
      return
    }

    setDocente(payload.docente)
    setAreas(payload.professional_areas ?? [])
    setAssignments(payload.assignments ?? [])
    setTeams(payload.teams ?? [])
    setEditions(payload.editions ?? [])
    setPrograms(payload.programs ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void loadDetail()
  }, [docenteId])

  const areaNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const area of areas) {
      map.set(area.id, area.name)
    }
    return map
  }, [areas])

  const teamsById = useMemo(() => {
    const map = new Map<string, TeamRef>()
    for (const team of teams) {
      map.set(team.id, team)
    }
    return map
  }, [teams])

  const editionsById = useMemo(() => {
    const map = new Map<string, EditionRef>()
    for (const edition of editions) {
      map.set(edition.id, edition)
    }
    return map
  }, [editions])

  const programsById = useMemo(() => {
    const map = new Map<string, ProgramRef>()
    for (const program of programs) {
      map.set(program.id, program)
    }
    return map
  }, [programs])

  const activeAssignmentsCount = useMemo(
    () => assignments.filter((assignment) => assignment.is_active).length,
    [assignments]
  )

  const availablePrograms = useMemo(() => programs, [programs])

  const availableEditions = useMemo(() => {
    if (!assignForm.program_id || assignForm.program_id === 'none') return []

    return editions.filter(
      (edition) => edition.program_id === assignForm.program_id
    )
  }, [editions, assignForm.program_id])

  const availableTeams = useMemo(() => {
    if (!assignForm.edition_id || assignForm.edition_id === 'none') return []
    return teams.filter((team) => team.edition_id === assignForm.edition_id)
  }, [teams, assignForm.edition_id])

  useEffect(() => {
    if (assignForm.program_id === 'none') {
      if (assignForm.edition_id === 'none' && assignForm.team_id === 'none') {
        return
      }
      setAssignForm((previous) => ({
        ...previous,
        edition_id: 'none',
        team_id: 'none',
      }))
      return
    }

    if (assignForm.edition_id !== 'none') {
      const exists = availableEditions.some(
        (edition) => edition.id === assignForm.edition_id
      )
      if (exists) return
    }

    const nextEditionId = availableEditions[0]?.id ?? 'none'
    setAssignForm((previous) => ({
      ...previous,
      edition_id: nextEditionId,
      team_id: 'none',
    }))
  }, [availableEditions, assignForm.program_id, assignForm.edition_id])

  useEffect(() => {
    if (assignForm.edition_id === 'none') {
      if (assignForm.team_id === 'none') {
        return
      }
      setAssignForm((previous) => ({
        ...previous,
        team_id: 'none',
      }))
      return
    }

    const exists = availableTeams.some((team) => team.id === assignForm.team_id)
    if (exists) return

    setAssignForm((previous) => ({
      ...previous,
      team_id: availableTeams[0]?.id ?? 'none',
    }))
  }, [availableTeams, assignForm.edition_id, assignForm.team_id])

  async function saveDocenteData() {
    if (!docente) return

    const firstName = safeText(editForm.first_name)
    const lastName = safeText(editForm.last_name)

    if (!firstName || !lastName) {
      showWarning('Nombres y apellidos son obligatorios.')
      return
    }

    setEditBusy(true)

    const response = await fetch(
      `/api/plataforma/admin/docentes/${docente.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          professional_area_id:
            editForm.professional_area_id === 'none'
              ? null
              : editForm.professional_area_id,
        }),
      }
    )

    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      message?: string
    } | null

    setEditBusy(false)

    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo actualizar el docente.')
      return
    }

    showSuccess('Datos del docente actualizados.')
    setEditOpen(false)
    await loadDetail()
  }

  async function resetDocentePassword() {
    if (!docente) return

    setActionsBusy(true)

    const response = await fetch(
      `/api/plataforma/admin/docentes/${docente.id}/reset-password`,
      {
        method: 'POST',
      }
    )

    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      temporary_password?: string
      message?: string
    } | null

    setActionsBusy(false)

    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo resetear contraseña.')
      return
    }

    showSuccess('Contraseña temporal regenerada.')
    if (payload.temporary_password) {
      showWarning(
        `Nueva temporal: ${payload.temporary_password}`,
        'Compártela por un canal seguro.'
      )
    }

    await loadDetail()
  }

  async function toggleDocenteActive() {
    if (!docente) return

    setActionsBusy(true)

    const response = await fetch(
      `/api/plataforma/admin/docentes/${docente.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !docente.is_active,
        }),
      }
    )

    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      message?: string
    } | null

    setActionsBusy(false)

    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo actualizar el estado.')
      return
    }

    showSuccess(
      docente.is_active ? 'Docente desactivado.' : 'Docente reactivado.'
    )
    setToggleConfirmOpen(false)
    await loadDetail()
  }

  async function assignDocenteToTeam() {
    if (!docente) return

    if (
      assignForm.program_id === 'none' ||
      assignForm.edition_id === 'none' ||
      assignForm.team_id === 'none'
    ) {
      showWarning('Selecciona programa, edición y equipo.')
      return
    }

    setAssignBusy(true)

    const response = await fetch('/api/plataforma/admin/docente-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        docente_profile_id: docente.id,
        team_id: assignForm.team_id,
        staff_role: safeText(assignForm.staff_role) || null,
      }),
    })

    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      message?: string
      conflicts?: Array<{
        conflict_team_name?: string
        day_of_week?: number
        start_time?: string
        end_time?: string
      }>
    } | null

    setAssignBusy(false)

    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo crear la asignación.')
      return
    }

    showSuccess('Docente asignado al equipo.')

    if (payload.conflicts?.length) {
      const resumen = payload.conflicts
        .slice(0, 2)
        .map(
          (conflict) =>
            `${conflict.conflict_team_name ?? 'Equipo'} ${
              conflict.start_time ?? ''
            }-${conflict.end_time ?? ''}`
        )
        .join(' | ')

      showWarning(
        'Asignación creada con advertencia de solapamiento de horario.',
        resumen
      )
    }

    setAssignOpen(false)
    setAssignForm(DEFAULT_ASSIGN_FORM)
    await loadDetail()
  }

  async function removeAssignment(assignment: AssignmentRow) {
    setActionsBusy(true)

    const response = await fetch('/api/plataforma/admin/docente-assignments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignment_id: assignment.id }),
    })

    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      message?: string
    } | null

    setActionsBusy(false)

    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo quitar la asignación.')
      return
    }

    showSuccess('Asignación removida.')
    setRemoveCandidate(null)
    await loadDetail()
  }

  if (loading) {
    return (
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="py-8 text-sm text-slate-300">
          Cargando detalle del docente...
        </CardContent>
      </Card>
    )
  }

  if (!docente) {
    return (
      <div className="space-y-4">
        <Button
          asChild
          variant="outline"
          className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
        >
          <Link href="/plataforma/admin/docentes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a docentes
          </Link>
        </Button>

        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardContent className="py-8 text-sm text-slate-300">
            Docente no encontrado.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-3">
          <Button
            asChild
            variant="outline"
            className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
          >
            <Link href="/plataforma/admin/docentes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a docentes
            </Link>
          </Button>

          <div>
            <h1 className="text-xl font-semibold text-slate-100">
              {displayName(docente)}
            </h1>
            <p className="text-sm text-slate-400">{docente.email ?? '--'}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={
                docente.is_active
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-slate-700 bg-slate-800 text-slate-300'
              }
            >
              {docente.is_active ? 'Activo' : 'Inactivo'}
            </Badge>
            <Badge className="border-slate-700 bg-slate-800 text-slate-200">
              {docente.professional_area_id
                ? (areaNameById.get(docente.professional_area_id) ?? 'Sin área')
                : 'Sin área'}
            </Badge>
            {docente.password_reset_required ? (
              <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-200">
                Cambio de contraseña pendiente
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex w-full flex-wrap justify-start gap-2 sm:w-auto sm:justify-end">
          <Button
            onClick={() => setAssignOpen(true)}
            className={PRIMARY_CTA_CLASS}
          >
            <Plus className="mr-2 h-4 w-4" />
            Asignar a equipo
          </Button>
          <Button
            variant="outline"
            className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
            onClick={() => {
              setEditForm({
                first_name: docente.first_name ?? '',
                last_name: docente.last_name ?? '',
                professional_area_id: docente.professional_area_id ?? 'none',
              })
              setEditOpen(true)
            }}
          >
            Editar datos
          </Button>
          <Button
            variant="outline"
            className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
            onClick={() => void resetDocentePassword()}
            disabled={actionsBusy}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset password
          </Button>
          <Button
            variant={docente.is_active ? 'destructive' : 'outline'}
            className={
              docente.is_active
                ? ''
                : 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800'
            }
            onClick={() => setToggleConfirmOpen(true)}
            disabled={actionsBusy}
          >
            {docente.is_active ? 'Desactivar' : 'Reactivar'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Equipos activos
            </CardDescription>
            <CardTitle className="text-2xl">{activeAssignmentsCount}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Último acceso
            </CardDescription>
            <CardTitle className="text-base font-medium">
              {formatDate(docente.last_login_at)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Alta</CardDescription>
            <CardTitle className="text-base font-medium">
              {formatDate(docente.created_at)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>Equipos asignados</CardTitle>
          <CardDescription className="text-slate-400">
            Gestión de asignaciones docente-equipo desde esta vista contextual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!assignments.length ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
              Este docente todavía no tiene asignaciones.
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-[920px] w-full text-sm">
                  <thead className="bg-slate-900/60 text-slate-300">
                    <tr className="border-b border-slate-800">
                      <th className="px-3 py-2 text-left font-medium">
                        Programa
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Edición
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Equipo
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Rol staff
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Estado
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Creada
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => {
                      const team = teamsById.get(assignment.team_id)
                      const edition = editionsById.get(assignment.edition_id)
                      const program = programsById.get(assignment.program_id)

                      return (
                        <tr
                          key={assignment.id}
                          className="border-b border-slate-800 bg-[#0B0D12] align-top last:border-b-0"
                        >
                          <td className="px-3 py-3 text-slate-200">
                            {program?.title ?? 'Programa'}
                          </td>
                          <td className="px-3 py-3 text-slate-300">
                            {edition?.edition_name ?? 'Edición'}
                          </td>
                          <td className="px-3 py-3 text-slate-300">
                            {team?.name ?? assignment.team?.name ?? 'Equipo'}
                          </td>
                          <td className="px-3 py-3 text-slate-300">
                            {assignment.staff_role || '--'}
                          </td>
                          <td className="px-3 py-3">
                            <Badge
                              className={
                                assignment.is_active
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                                  : 'border-slate-700 bg-slate-800 text-slate-300'
                              }
                            >
                              {assignment.is_active ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-slate-300">
                            {formatDate(assignment.created_at)}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setRemoveCandidate(assignment)}
                              disabled={actionsBusy}
                            >
                              Quitar
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setEditForm(DEFAULT_EDIT_FORM)
        }}
      >
        <DialogContent className="border border-slate-800 bg-[#0F1117] text-slate-100 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar docente</DialogTitle>
            <DialogDescription className="text-slate-400">
              Actualiza datos generales del perfil docente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombres</Label>
              <Input
                value={editForm.first_name}
                onChange={(event) =>
                  setEditForm((previous) => ({
                    ...previous,
                    first_name: event.target.value,
                  }))
                }
                className="border-slate-800 bg-slate-950"
              />
            </div>

            <div className="space-y-2">
              <Label>Apellidos</Label>
              <Input
                value={editForm.last_name}
                onChange={(event) =>
                  setEditForm((previous) => ({
                    ...previous,
                    last_name: event.target.value,
                  }))
                }
                className="border-slate-800 bg-slate-950"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Área profesional</Label>
              <Select
                value={editForm.professional_area_id}
                onValueChange={(value) =>
                  setEditForm((previous) => ({
                    ...previous,
                    professional_area_id: value,
                  }))
                }
              >
                <SelectTrigger className="border-slate-800 bg-slate-950">
                  <SelectValue placeholder="Selecciona área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin área</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
              onClick={() => setEditOpen(false)}
              disabled={editBusy}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void saveDocenteData()}
              disabled={editBusy}
              className={PRIMARY_CTA_CLASS}
            >
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={assignOpen}
        onOpenChange={(open) => {
          setAssignOpen(open)
          if (!open) {
            setAssignForm(DEFAULT_ASSIGN_FORM)
            return
          }

          const firstProgram = availablePrograms[0]?.id ?? 'none'
          setAssignForm({
            ...DEFAULT_ASSIGN_FORM,
            program_id: firstProgram,
          })
        }}
      >
        <DialogContent className="border border-slate-800 bg-[#0F1117] text-slate-100 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Asignar a equipo</DialogTitle>
            <DialogDescription className="text-slate-400">
              Define programa, edición y equipo para crear la asignación del
              docente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Programa</Label>
              <Select
                value={assignForm.program_id}
                onValueChange={(value) =>
                  setAssignForm((previous) => ({
                    ...previous,
                    program_id: value,
                  }))
                }
              >
                <SelectTrigger className="border-slate-800 bg-slate-950">
                  <SelectValue placeholder="Selecciona programa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecciona</SelectItem>
                  {availablePrograms.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Edición</Label>
              <Select
                value={assignForm.edition_id}
                onValueChange={(value) =>
                  setAssignForm((previous) => ({
                    ...previous,
                    edition_id: value,
                    team_id: 'none',
                  }))
                }
              >
                <SelectTrigger className="border-slate-800 bg-slate-950">
                  <SelectValue placeholder="Selecciona edición" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecciona</SelectItem>
                  {availableEditions.map((edition) => (
                    <SelectItem key={edition.id} value={edition.id}>
                      {edition.edition_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Equipo</Label>
              <Select
                value={assignForm.team_id}
                onValueChange={(value) =>
                  setAssignForm((previous) => ({
                    ...previous,
                    team_id: value,
                  }))
                }
              >
                <SelectTrigger className="border-slate-800 bg-slate-950">
                  <SelectValue placeholder="Selecciona equipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecciona</SelectItem>
                  {availableTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label>Rol de staff (opcional)</Label>
              <Input
                value={assignForm.staff_role}
                onChange={(event) =>
                  setAssignForm((previous) => ({
                    ...previous,
                    staff_role: event.target.value,
                  }))
                }
                placeholder="Ej: Mentor técnico"
                className="border-slate-800 bg-slate-950"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
              onClick={() => setAssignOpen(false)}
              disabled={assignBusy}
            >
              Cancelar
            </Button>
            <Button
              disabled={assignBusy}
              onClick={() => void assignDocenteToTeam()}
              className={PRIMARY_CTA_CLASS}
            >
              Asignar docente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removeCandidate)}
        onOpenChange={(open) => {
          if (!open) setRemoveCandidate(null)
        }}
        title="¿Quitar asignación?"
        description="El docente dejará de estar asignado a ese equipo."
        confirmLabel="Quitar"
        confirmVariant="destructive"
        confirmDisabled={!removeCandidate}
        onConfirm={() => {
          if (!removeCandidate) return
          void removeAssignment(removeCandidate)
        }}
      />

      <ConfirmDialog
        open={toggleConfirmOpen}
        onOpenChange={setToggleConfirmOpen}
        title={
          docente.is_active ? '¿Desactivar docente?' : '¿Reactivar docente?'
        }
        description={
          docente.is_active
            ? 'El docente no podrá ingresar hasta que se reactive.'
            : 'El docente recuperará el acceso a la plataforma.'
        }
        confirmLabel={docente.is_active ? 'Desactivar' : 'Reactivar'}
        confirmVariant={docente.is_active ? 'destructive' : 'default'}
        confirmDisabled={actionsBusy}
        onConfirm={() => {
          void toggleDocenteActive()
        }}
      />
    </div>
  )
}
