'use client'

import { useEffect, useMemo, useState } from 'react'

import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type TeamStat = {
  team_id: string
  team_name: string
  total_students: number
  inactive_students: number
}

type ProgramStat = {
  program_id: string
  program_title: string
  total_students: number
  inactive_students: number
}

type InactiveStudent = {
  profile_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  team_id: string | null
  team_name: string | null
  program_id: string | null
  program_title: string | null
  inactive_for_days: number | null
}

type DocenteActivity = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  inactive_for_days: number | null
  is_inactive: boolean
}

type ActivityPayload = {
  ok: boolean
  inactive_days_threshold: number
  totals: {
    students: number
    inactive_students: number
    docentes: number
    inactive_docentes: number
  }
  by_team: TeamStat[]
  by_program: ProgramStat[]
  inactive_students: InactiveStudent[]
  docentes: DocenteActivity[]
}

function fullName(firstName: string | null, lastName: string | null): string {
  return `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Sin nombre'
}

export default function AdminActivityPage() {
  const { showError } = useToastEnhanced()
  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState<ActivityPayload | null>(null)
  const [programId, setProgramId] = useState('all')
  const [teamId, setTeamId] = useState('all')
  const [inactiveDays, setInactiveDays] = useState('7')

  async function loadData() {
    setLoading(true)
    const params = new URLSearchParams()
    if (programId !== 'all') params.set('program_id', programId)
    if (teamId !== 'all') params.set('team_id', teamId)
    params.set('inactive_days', inactiveDays)

    const response = await fetch(
      `/api/plataforma/admin/activity?${params.toString()}`,
      { cache: 'no-store' }
    )
    const nextPayload = (await response.json().catch(() => null)) as
      | ActivityPayload
      | { ok: false; message?: string }
      | null

    if (!response.ok || !nextPayload || !nextPayload.ok) {
      const message =
        nextPayload && 'message' in nextPayload
          ? nextPayload.message
          : 'No se pudo cargar actividad.'
      showError(message ?? 'No se pudo cargar actividad.')
      setLoading(false)
      return
    }

    setPayload(nextPayload)
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [])

  const programs = useMemo(() => {
    const map = new Map<string, string>()
    for (const row of payload?.by_program ?? []) {
      map.set(row.program_id, row.program_title)
    }
    return Array.from(map.entries())
  }, [payload?.by_program])

  const teams = useMemo(() => {
    const map = new Map<string, string>()
    for (const row of payload?.by_team ?? []) {
      map.set(row.team_id, row.team_name)
    }
    return Array.from(map.entries())
  }, [payload?.by_team])

  if (loading || !payload) {
    return (
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="py-8 text-sm text-slate-300">
          Cargando actividad...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>Actividad e Inactividad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger className="border-slate-800 bg-slate-950">
                <SelectValue placeholder="Programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los programas</SelectItem>
                {programs.map(([id, title]) => (
                  <SelectItem key={id} value={id}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger className="border-slate-800 bg-slate-950">
                <SelectValue placeholder="Equipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los equipos</SelectItem>
                {teams.map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={inactiveDays} onValueChange={setInactiveDays}>
              <SelectTrigger className="border-slate-800 bg-slate-950">
                <SelectValue placeholder="Días" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 días</SelectItem>
                <SelectItem value="5">5 días</SelectItem>
                <SelectItem value="7">7 días</SelectItem>
                <SelectItem value="14">14 días</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => void loadData()}>Aplicar filtros</Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Card className="border border-slate-800 bg-slate-950 text-slate-100">
              <CardContent className="pt-5">
                <div className="text-xs text-slate-400">Estudiantes</div>
                <div className="text-2xl font-semibold">
                  {payload.totals.students}
                </div>
              </CardContent>
            </Card>
            <Card className="border border-slate-800 bg-slate-950 text-slate-100">
              <CardContent className="pt-5">
                <div className="text-xs text-slate-400">Inactivos</div>
                <div className="text-2xl font-semibold">
                  {payload.totals.inactive_students}
                </div>
              </CardContent>
            </Card>
            <Card className="border border-slate-800 bg-slate-950 text-slate-100">
              <CardContent className="pt-5">
                <div className="text-xs text-slate-400">Docentes</div>
                <div className="text-2xl font-semibold">
                  {payload.totals.docentes}
                </div>
              </CardContent>
            </Card>
            <Card className="border border-slate-800 bg-slate-950 text-slate-100">
              <CardContent className="pt-5">
                <div className="text-xs text-slate-400">Docentes inactivos</div>
                <div className="text-2xl font-semibold">
                  {payload.totals.inactive_docentes}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle>Inactividad por equipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {payload.by_team.length === 0 ? (
              <div className="text-sm text-slate-400">Sin datos.</div>
            ) : (
              payload.by_team.map((row) => (
                <div
                  key={row.team_id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2"
                >
                  <div className="text-sm">{row.team_name}</div>
                  <Badge className="border border-slate-700 bg-slate-800 text-slate-100">
                    {row.inactive_students}/{row.total_students} inactivos
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle>Inactividad por programa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {payload.by_program.length === 0 ? (
              <div className="text-sm text-slate-400">Sin datos.</div>
            ) : (
              payload.by_program.map((row) => (
                <div
                  key={row.program_id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2"
                >
                  <div className="text-sm">{row.program_title}</div>
                  <Badge className="border border-slate-700 bg-slate-800 text-slate-100">
                    {row.inactive_students}/{row.total_students} inactivos
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle>Estudiantes inactivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {payload.inactive_students.length === 0 ? (
              <div className="text-sm text-slate-400">
                No hay estudiantes inactivos para el umbral seleccionado.
              </div>
            ) : (
              payload.inactive_students.map((row) => (
                <div
                  key={row.profile_id}
                  className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2"
                >
                  <div className="text-sm font-medium text-slate-100">
                    {fullName(row.first_name, row.last_name)}
                  </div>
                  <div className="text-xs text-slate-400">{row.email}</div>
                  <div className="text-xs text-slate-500">
                    {row.program_title ?? 'Programa'} ·{' '}
                    {row.team_name ?? 'Sin equipo'} ·{' '}
                    {row.inactive_for_days ?? 0} días inactivo
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle>Actividad de docentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {payload.docentes.length === 0 ? (
              <div className="text-sm text-slate-400">No hay docentes.</div>
            ) : (
              payload.docentes.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-100">
                      {fullName(row.first_name, row.last_name)}
                    </div>
                    <div className="text-xs text-slate-400">{row.email}</div>
                  </div>
                  <Badge
                    className={
                      row.is_inactive
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    }
                  >
                    {row.inactive_for_days ?? 0} días
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
