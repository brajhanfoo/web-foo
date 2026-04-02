'use client'

import { useEffect, useMemo, useState } from 'react'
import { RotateCcw, Save, UserPlus } from 'lucide-react'

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

type ProfessionalArea = {
  id: string
  code: string
  name: string
  is_active: boolean
}

type DocenteRow = {
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

type AssignmentRow = {
  id: string
  docente_profile_id: string
  program_id: string
  edition_id: string
  team_id: string
  staff_role: string | null
  is_active: boolean
  created_at: string
}

type TeamRef = {
  id: string
  name: string
  edition_id: string
  edition: {
    id?: string
    edition_name?: string
    program_id?: string
    program?: { id?: string; title?: string } | null
  } | null
}

type ScheduleSlot = {
  id: string
  team_id: string
  day_of_week: number
  start_time: string
  end_time: string
  timezone: string
  is_active: boolean
}

const DAY_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
}

function buildFullName(docente: DocenteRow): string {
  const fullName =
    `${docente.first_name ?? ''} ${docente.last_name ?? ''}`.trim() || ''
  return fullName || docente.email || 'Docente'
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

export default function AdminDocentesPage() {
  const { showError, showSuccess, showWarning } = useToastEnhanced()

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [docentes, setDocentes] = useState<DocenteRow[]>([])
  const [areas, setAreas] = useState<ProfessionalArea[]>([])
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [teams, setTeams] = useState<TeamRef[]>([])

  const [createEmail, setCreateEmail] = useState('')
  const [createFirstName, setCreateFirstName] = useState('')
  const [createLastName, setCreateLastName] = useState('')
  const [createAreaId, setCreateAreaId] = useState<string>('none')
  const [createTempPassword, setCreateTempPassword] = useState('')

  const [selectedDocente, setSelectedDocente] = useState<string>('none')
  const [selectedTeam, setSelectedTeam] = useState<string>('none')
  const [staffRole, setStaffRole] = useState('')

  const [scheduleTeamId, setScheduleTeamId] = useState<string>('none')
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([])
  const [dayOfWeek, setDayOfWeek] = useState<string>('1')
  const [startTime, setStartTime] = useState('19:00')
  const [endTime, setEndTime] = useState('21:00')
  const [timezone, setTimezone] = useState('America/Guayaquil')

  async function loadData() {
    setLoading(true)
    const response = await fetch('/api/plataforma/admin/docentes', {
      cache: 'no-store',
    })
    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      docentes?: DocenteRow[]
      professional_areas?: ProfessionalArea[]
      assignments?: AssignmentRow[]
      teams?: TeamRef[]
      message?: string
    } | null

    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo cargar docentes.')
      setLoading(false)
      return
    }

    setDocentes(payload.docentes ?? [])
    setAreas(payload.professional_areas ?? [])
    setAssignments(payload.assignments ?? [])
    setTeams((payload.teams ?? []) as TeamRef[])
    setLoading(false)
  }

  async function loadTeamSchedule(teamId: string) {
    if (!teamId || teamId === 'none') {
      setScheduleSlots([])
      return
    }
    const response = await fetch(
      `/api/plataforma/admin/team-schedule-slots?team_id=${teamId}`,
      {
        cache: 'no-store',
      }
    )
    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      slots?: ScheduleSlot[]
      message?: string
    } | null
    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo cargar horarios.')
      return
    }
    setScheduleSlots(payload.slots ?? [])
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    void loadTeamSchedule(scheduleTeamId)
  }, [scheduleTeamId])

  const docenteLookup = useMemo(() => {
    const map = new Map<string, DocenteRow>()
    for (const docente of docentes) map.set(docente.id, docente)
    return map
  }, [docentes])

  const teamLookup = useMemo(() => {
    const map = new Map<string, TeamRef>()
    for (const team of teams) map.set(team.id, team)
    return map
  }, [teams])

  async function createDocente() {
    if (!createEmail || !createFirstName || !createLastName) {
      showWarning('Completa email, nombres y apellidos.')
      return
    }
    setBusy(true)
    const response = await fetch('/api/plataforma/admin/docentes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: createEmail,
        first_name: createFirstName,
        last_name: createLastName,
        professional_area_id: createAreaId === 'none' ? null : createAreaId,
        temporary_password: createTempPassword || undefined,
      }),
    })
    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      message?: string
      temporary_password?: string
    } | null
    setBusy(false)
    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo crear docente.')
      return
    }
    showSuccess('Docente creado.')
    if (payload.temporary_password) {
      showWarning(
        `Contraseña temporal: ${payload.temporary_password}`,
        'Compártela por canal seguro.'
      )
    }
    setCreateEmail('')
    setCreateFirstName('')
    setCreateLastName('')
    setCreateAreaId('none')
    setCreateTempPassword('')
    await loadData()
  }

  async function saveDocente(docente: DocenteRow) {
    setBusy(true)
    const response = await fetch(
      `/api/plataforma/admin/docentes/${docente.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: docente.first_name,
          last_name: docente.last_name,
          professional_area_id: docente.professional_area_id,
          is_active: docente.is_active,
        }),
      }
    )
    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      message?: string
    } | null
    setBusy(false)
    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo guardar docente.')
      return
    }
    showSuccess('Docente actualizado.')
    await loadData()
  }

  async function resetDocentePassword(docenteId: string) {
    setBusy(true)
    const response = await fetch(
      `/api/plataforma/admin/docentes/${docenteId}/reset-password`,
      {
        method: 'POST',
      }
    )
    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      temporary_password?: string
      message?: string
    } | null
    setBusy(false)
    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo resetear contraseña.')
      return
    }
    showSuccess('Contraseña temporal regenerada.')
    if (payload.temporary_password) {
      showWarning(
        `Nueva temporal: ${payload.temporary_password}`,
        'Compártela por canal seguro.'
      )
    }
    await loadData()
  }

  async function createAssignment() {
    if (selectedDocente === 'none' || selectedTeam === 'none') {
      showWarning('Selecciona docente y equipo.')
      return
    }

    setBusy(true)
    const response = await fetch('/api/plataforma/admin/docente-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        docente_profile_id: selectedDocente,
        team_id: selectedTeam,
        staff_role: staffRole || null,
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
      showError(payload?.message ?? 'No se pudo crear asignación.')
      return
    }

    if (payload.conflicts?.length) {
      showWarning(
        'Asignación creada con advertencia de solapamiento de horario.',
        payload.conflicts
          .slice(0, 2)
          .map(
            (conflict) =>
              `${conflict.conflict_team_name ?? 'Equipo'} ${DAY_LABELS[conflict.day_of_week ?? 0] ?? ''} ${conflict.start_time ?? ''}-${conflict.end_time ?? ''}`
          )
          .join(' | ')
      )
    } else {
      showSuccess('Asignación docente-equipo creada.')
    }

    setSelectedDocente('none')
    setSelectedTeam('none')
    setStaffRole('')
    await loadData()
  }

  async function deleteAssignment(assignmentId: string) {
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
      showError(payload?.message ?? 'No se pudo eliminar asignación.')
      return
    }
    showSuccess('Asignación eliminada.')
    await loadData()
  }

  async function addScheduleSlot() {
    if (scheduleTeamId === 'none') {
      showWarning('Selecciona un equipo para configurar horarios.')
      return
    }
    const response = await fetch('/api/plataforma/admin/team-schedule-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_id: scheduleTeamId,
        day_of_week: Number(dayOfWeek),
        start_time: startTime,
        end_time: endTime,
        timezone,
      }),
    })
    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      message?: string
    } | null
    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo crear horario.')
      return
    }
    showSuccess('Horario agregado.')
    await loadTeamSchedule(scheduleTeamId)
  }

  async function deleteScheduleSlot(slotId: string) {
    const response = await fetch('/api/plataforma/admin/team-schedule-slots', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: slotId }),
    })
    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      message?: string
    } | null
    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo eliminar horario.')
      return
    }
    showSuccess('Horario eliminado.')
    await loadTeamSchedule(scheduleTeamId)
  }

  if (loading) {
    return (
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="py-8 text-sm text-slate-300">
          Cargando módulo de docentes...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>Docentes y Asignaciones</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">
          Gestiona docentes, asignaciones por equipo y horarios para advertir
          solapamientos.
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle>Crear docente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={createEmail}
                  onChange={(event) => setCreateEmail(event.target.value)}
                  className="border-slate-800 bg-slate-950"
                  placeholder="docente@dominio.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Área</Label>
                <Select value={createAreaId} onValueChange={setCreateAreaId}>
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
              <div className="space-y-2">
                <Label>Nombres</Label>
                <Input
                  value={createFirstName}
                  onChange={(event) => setCreateFirstName(event.target.value)}
                  className="border-slate-800 bg-slate-950"
                />
              </div>
              <div className="space-y-2">
                <Label>Apellidos</Label>
                <Input
                  value={createLastName}
                  onChange={(event) => setCreateLastName(event.target.value)}
                  className="border-slate-800 bg-slate-950"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contraseña temporal (opcional)</Label>
              <Input
                value={createTempPassword}
                onChange={(event) => setCreateTempPassword(event.target.value)}
                className="border-slate-800 bg-slate-950"
                placeholder="si queda vacío se genera automáticamente"
              />
            </div>

            <div className="flex justify-end">
              <Button disabled={busy} onClick={() => void createDocente()}>
                <UserPlus className="mr-2 h-4 w-4" />
                Crear docente
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle>Asignar docente a equipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Docente</Label>
                <Select
                  value={selectedDocente}
                  onValueChange={setSelectedDocente}
                >
                  <SelectTrigger className="border-slate-800 bg-slate-950">
                    <SelectValue placeholder="Selecciona docente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecciona</SelectItem>
                    {docentes.map((docente) => (
                      <SelectItem key={docente.id} value={docente.id}>
                        {buildFullName(docente)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Equipo</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
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
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rol staff (opcional)</Label>
              <Input
                value={staffRole}
                onChange={(event) => setStaffRole(event.target.value)}
                className="border-slate-800 bg-slate-950"
                placeholder="Mentor principal, apoyo, etc."
              />
            </div>

            <div className="flex justify-end">
              <Button disabled={busy} onClick={() => void createAssignment()}>
                <Save className="mr-2 h-4 w-4" />
                Crear asignación
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>Staff docente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {docentes.length === 0 ? (
              <div className="text-sm text-slate-300">No hay docentes.</div>
            ) : (
              docentes.map((docente) => (
                <div
                  key={docente.id}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-3"
                >
                  <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_auto]">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-slate-100">
                          {buildFullName(docente)}
                        </div>
                        <Badge
                          className={
                            docente.is_active
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                              : 'border-slate-700 bg-slate-800 text-slate-300'
                          }
                        >
                          {docente.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                        {docente.password_reset_required ? (
                          <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-200">
                            Reset obligatorio
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-xs text-slate-400">
                        {docente.email}
                      </div>
                      <div className="text-xs text-slate-400">
                        Equipos activos: {docente.active_assignments_count} ·
                        Último login: {formatDate(docente.last_login_at)}
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={docente.first_name ?? ''}
                        onChange={(event) =>
                          setDocentes((prev) =>
                            prev.map((row) =>
                              row.id === docente.id
                                ? { ...row, first_name: event.target.value }
                                : row
                            )
                          )
                        }
                        className="border-slate-800 bg-slate-900"
                        placeholder="Nombres"
                      />
                      <Input
                        value={docente.last_name ?? ''}
                        onChange={(event) =>
                          setDocentes((prev) =>
                            prev.map((row) =>
                              row.id === docente.id
                                ? { ...row, last_name: event.target.value }
                                : row
                            )
                          )
                        }
                        className="border-slate-800 bg-slate-900"
                        placeholder="Apellidos"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-700 bg-slate-900"
                        onClick={() =>
                          setDocentes((prev) =>
                            prev.map((row) =>
                              row.id === docente.id
                                ? { ...row, is_active: !row.is_active }
                                : row
                            )
                          )
                        }
                      >
                        {docente.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => void saveDocente(docente)}
                        disabled={busy}
                      >
                        Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                        onClick={() => void resetDocentePassword(docente.id)}
                        disabled={busy}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset pass
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle>Asignaciones activas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!assignments.length ? (
              <div className="text-sm text-slate-300">
                No hay asignaciones creadas.
              </div>
            ) : (
              assignments.map((assignment) => {
                const docente = docenteLookup.get(assignment.docente_profile_id)
                const team = teamLookup.get(assignment.team_id)
                const edition = team?.edition
                const programTitle = edition?.program?.title ?? 'Programa'
                const editionName = edition?.edition_name ?? 'Edición'
                return (
                  <div
                    key={assignment.id}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-100">
                          {buildFullName(
                            docente ?? {
                              id: '',
                              email: null,
                              first_name: null,
                              last_name: null,
                              is_active: true,
                              role: 'docente',
                              professional_area_id: null,
                              password_reset_required: false,
                              created_at: '',
                              last_login_at: null,
                              active_assignments_count: 0,
                            }
                          )}
                        </div>
                        <div className="truncate text-xs text-slate-400">
                          {programTitle} · {editionName} ·{' '}
                          {team?.name ?? 'Equipo'}
                        </div>
                        {assignment.staff_role ? (
                          <div className="text-xs text-slate-500">
                            Rol: {assignment.staff_role}
                          </div>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void deleteAssignment(assignment.id)}
                        disabled={busy}
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle>Horarios de equipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Equipo</Label>
              <Select value={scheduleTeamId} onValueChange={setScheduleTeamId}>
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
            </div>

            <div className="grid gap-2 md:grid-cols-4">
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger className="border-slate-800 bg-slate-950">
                  <SelectValue placeholder="Día" />
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
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="border-slate-800 bg-slate-950"
              />
              <Input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="border-slate-800 bg-slate-950"
              />
              <Input
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className="border-slate-800 bg-slate-950"
                placeholder="Timezone"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => void addScheduleSlot()}>
                Agregar horario
              </Button>
            </div>

            <div className="space-y-2">
              {scheduleSlots.length === 0 ? (
                <div className="text-sm text-slate-400">
                  Sin horarios para el equipo seleccionado.
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
      </div>
    </div>
  )
}
