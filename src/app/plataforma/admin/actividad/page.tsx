'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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

type EditionStat = {
  edition_id: string
  edition_name: string
  program_id: string | null
  total_students: number
  inactive_students: number
}

type StudentActivity = {
  application_id: string
  profile_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  team_id: string | null
  team_name: string | null
  program_id: string | null
  program_title: string | null
  edition_id: string | null
  edition_name: string | null
  inactive_for_days: number | null
  is_inactive: boolean
}

type InactiveStudent = StudentActivity

type DocenteActivity = {
  row_id: string
  profile_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  inactive_for_days: number | null
  is_inactive: boolean
  program_id: string | null
  program_title: string | null
  edition_id: string | null
  edition_name: string | null
  team_id: string | null
  team_name: string | null
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
  by_edition: EditionStat[]
  students: StudentActivity[]
  inactive_students: InactiveStudent[]
  docentes: DocenteActivity[]
}

type UnifiedActivityRow = {
  row_id: string
  profile_id: string
  role_type: 'student' | 'docente'
  full_name: string
  email: string | null
  is_inactive: boolean
  inactive_for_days: number | null
  program_id: string | null
  program_title: string | null
  edition_id: string | null
  edition_name: string | null
}

type RoleFilter = 'all' | 'student' | 'docente'
type StateFilter = 'all' | 'active' | 'inactive'
type SortBy = 'name' | 'status' | 'program' | 'role'
type SortDirection = 'asc' | 'desc'

const PRIMARY_CTA_CLASS = 'bg-[#00CCA4] text-slate-950 hover:bg-[#00b997]'

function fullName(firstName: string | null, lastName: string | null): string {
  return `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Sin nombre'
}

function countLabel(
  value: number,
  singular: string,
  plural: string = `${singular}s`
): string {
  return `${value} ${value === 1 ? singular : plural}`
}

function inactiveDurationLabel(days: number | null): string {
  const normalized = Math.max(1, days ?? 1)
  return `Inactivo durante ${normalized} ${normalized === 1 ? 'día' : 'días'}`
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, 'es', { sensitivity: 'base' })
}

export default function AdminActivityPage() {
  const { showError } = useToastEnhanced()
  const showErrorRef = useRef(showError)
  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState<ActivityPayload | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [programId, setProgramId] = useState('all')
  const [editionId, setEditionId] = useState('all')

  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [stateFilter, setStateFilter] = useState<StateFilter>('all')
  const [searchText, setSearchText] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  useEffect(() => {
    showErrorRef.current = showError
  }, [showError])

  async function loadData() {
    setLoading(true)
    setErrorMessage(null)

    const response = await fetch('/api/plataforma/admin/activity', {
      cache: 'no-store',
    })
    const nextPayload = (await response.json().catch(() => null)) as
      | ActivityPayload
      | { ok: false; message?: string }
      | null

    if (!response.ok || !nextPayload || !nextPayload.ok) {
      const message =
        nextPayload && 'message' in nextPayload
          ? nextPayload.message
          : 'No se pudo cargar actividad.'
      setPayload(null)
      setErrorMessage(message ?? 'No se pudo cargar actividad.')
      showErrorRef.current(message ?? 'No se pudo cargar actividad.')
      setLoading(false)
      return
    }

    setPayload(nextPayload)
    setErrorMessage(null)
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [])

  const programs = useMemo(() => {
    const rows = payload?.by_program ?? []
    return [...rows].sort((a, b) =>
      compareText(a.program_title, b.program_title)
    )
  }, [payload?.by_program])

  const editions = useMemo(() => {
    const rows = payload?.by_edition ?? []
    const filtered =
      programId === 'all'
        ? rows
        : rows.filter((row) => row.program_id === programId)
    return [...filtered].sort((a, b) =>
      compareText(a.edition_name, b.edition_name)
    )
  }, [payload?.by_edition, programId])

  useEffect(() => {
    if (!payload) return
    if (programId !== 'all') {
      const exists = programs.some((row) => row.program_id === programId)
      if (!exists) setProgramId('all')
    }
    if (editionId !== 'all') {
      const exists = editions.some((row) => row.edition_id === editionId)
      if (!exists) setEditionId('all')
    }
  }, [payload, programId, editionId, programs, editions])

  const unifiedRows = useMemo(() => {
    if (!payload) return [] as UnifiedActivityRow[]

    const studentRows: UnifiedActivityRow[] = payload.students.map((row) => ({
      row_id: `student:${row.application_id}`,
      profile_id: row.profile_id,
      role_type: 'student',
      full_name: fullName(row.first_name, row.last_name),
      email: row.email,
      is_inactive: row.is_inactive,
      inactive_for_days: row.inactive_for_days,
      program_id: row.program_id,
      program_title: row.program_title,
      edition_id: row.edition_id,
      edition_name: row.edition_name,
    }))

    const docenteRows: UnifiedActivityRow[] = payload.docentes.map((row) => ({
      row_id: `docente:${row.row_id}`,
      profile_id: row.profile_id,
      role_type: 'docente',
      full_name: fullName(row.first_name, row.last_name),
      email: row.email,
      is_inactive: row.is_inactive,
      inactive_for_days: row.inactive_for_days,
      program_id: row.program_id,
      program_title: row.program_title,
      edition_id: row.edition_id,
      edition_name: row.edition_name,
    }))

    return [...studentRows, ...docenteRows]
  }, [payload])

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase()

    const rows = unifiedRows.filter((row) => {
      if (roleFilter !== 'all' && row.role_type !== roleFilter) return false
      if (stateFilter === 'active' && row.is_inactive) return false
      if (stateFilter === 'inactive' && !row.is_inactive) return false
      if (programId !== 'all' && row.program_id !== programId) return false
      if (editionId !== 'all' && row.edition_id !== editionId) return false

      if (!normalizedSearch) return true
      const haystack =
        `${row.full_name} ${row.email ?? ''} ${row.program_title ?? ''} ${row.edition_name ?? ''}`.toLowerCase()
      return haystack.includes(normalizedSearch)
    })

    const sorted = [...rows].sort((left, right) => {
      if (sortBy === 'status') {
        const leftValue = left.is_inactive ? 1 : 0
        const rightValue = right.is_inactive ? 1 : 0
        return leftValue - rightValue
      }

      if (sortBy === 'program') {
        const programDiff = compareText(
          left.program_title ?? 'Sin programa',
          right.program_title ?? 'Sin programa'
        )
        if (programDiff !== 0) return programDiff
        return compareText(
          left.edition_name ?? 'Sin edición',
          right.edition_name ?? 'Sin edición'
        )
      }

      if (sortBy === 'role') {
        const roleDiff = compareText(
          left.role_type === 'student' ? 'Estudiante' : 'Docente',
          right.role_type === 'student' ? 'Estudiante' : 'Docente'
        )
        if (roleDiff !== 0) return roleDiff
      }

      return compareText(left.full_name, right.full_name)
    })

    if (sortDirection === 'desc') sorted.reverse()
    return sorted
  }, [
    unifiedRows,
    roleFilter,
    stateFilter,
    programId,
    editionId,
    searchText,
    sortBy,
    sortDirection,
  ])

  const visibleTotals = useMemo(() => {
    const studentIds = new Set<string>()
    const inactiveStudentIds = new Set<string>()
    const docenteIds = new Set<string>()
    const inactiveDocenteIds = new Set<string>()

    for (const row of filteredRows) {
      if (row.role_type === 'student') {
        studentIds.add(row.profile_id)
        if (row.is_inactive) inactiveStudentIds.add(row.profile_id)
      } else {
        docenteIds.add(row.profile_id)
        if (row.is_inactive) inactiveDocenteIds.add(row.profile_id)
      }
    }

    return {
      students: studentIds.size,
      inactive_students: inactiveStudentIds.size,
      docentes: docenteIds.size,
      inactive_docentes: inactiveDocenteIds.size,
    }
  }, [filteredRows])

  if (loading) {
    return (
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="py-8 text-sm text-slate-300">
          Cargando actividad...
        </CardContent>
      </Card>
    )
  }

  if (!payload) {
    return (
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="space-y-4 py-8">
          <div className="text-sm text-slate-300">
            {errorMessage ?? 'No se pudo cargar actividad.'}
          </div>
          <Button className={PRIMARY_CTA_CLASS} onClick={() => void loadData()}>
            Reintentar
          </Button>
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
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Card className="border border-slate-800 bg-slate-950 text-slate-100">
              <CardContent className="pt-5">
                <div className="text-xs text-slate-400">Estudiantes</div>
                <div className="text-2xl font-semibold">
                  {countLabel(
                    visibleTotals.students,
                    'estudiante',
                    'estudiantes'
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="border border-slate-800 bg-slate-950 text-slate-100">
              <CardContent className="pt-5">
                <div className="text-xs text-slate-400">Inactivos</div>
                <div className="text-2xl font-semibold">
                  {countLabel(
                    visibleTotals.inactive_students,
                    'inactivo',
                    'inactivos'
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="border border-slate-800 bg-slate-950 text-slate-100">
              <CardContent className="pt-5">
                <div className="text-xs text-slate-400">Docentes</div>
                <div className="text-2xl font-semibold">
                  {countLabel(visibleTotals.docentes, 'docente', 'docentes')}
                </div>
              </CardContent>
            </Card>
            <Card className="border border-slate-800 bg-slate-950 text-slate-100">
              <CardContent className="pt-5">
                <div className="text-xs text-slate-400">Docentes inactivos</div>
                <div className="text-2xl font-semibold">
                  {countLabel(
                    visibleTotals.inactive_docentes,
                    'docente',
                    'docentes'
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>Tabla operativa de actividad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="border-slate-800 bg-slate-950"
              placeholder="Buscar por nombre o correo"
            />

            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger className="border-slate-800 bg-slate-950">
                <SelectValue placeholder="Programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los programas</SelectItem>
                {programs.map((row) => (
                  <SelectItem key={row.program_id} value={row.program_id}>
                    {row.program_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={editionId} onValueChange={setEditionId}>
              <SelectTrigger className="border-slate-800 bg-slate-950">
                <SelectValue placeholder="Edición" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ediciones</SelectItem>
                {editions.map((row) => (
                  <SelectItem key={row.edition_id} value={row.edition_id}>
                    {row.edition_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as RoleFilter)}
            >
              <SelectTrigger className="border-slate-800 bg-slate-950">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="student">Estudiantes</SelectItem>
                <SelectItem value="docente">Docentes</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={stateFilter}
              onValueChange={(value) => setStateFilter(value as StateFilter)}
            >
              <SelectTrigger className="border-slate-800 bg-slate-950">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortBy)}
            >
              <SelectTrigger className="border-slate-800 bg-slate-950">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nombre</SelectItem>
                <SelectItem value="status">Estado</SelectItem>
                <SelectItem value="program">Programa</SelectItem>
                <SelectItem value="role">Tipo</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortDirection}
              onValueChange={(value) =>
                setSortDirection(value as SortDirection)
              }
            >
              <SelectTrigger className="border-slate-800 bg-slate-950">
                <SelectValue placeholder="Dirección" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascendente</SelectItem>
                <SelectItem value="desc">Descendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredRows.length === 0 ? (
            <div className="rounded-md border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
              No hay registros para los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-800">
              <table className="min-w-[760px] w-full text-sm">
                <thead className="bg-slate-900/70 text-slate-300">
                  <tr className="border-b border-slate-800">
                    <th className="px-3 py-2 text-left font-medium">
                      Nombre y apellido
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Correo</th>
                    <th className="px-3 py-2 text-left font-medium">Estado</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Programa
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Rol / Tipo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr
                      key={row.row_id}
                      className="border-b border-slate-800 bg-slate-950/60 align-top last:border-b-0"
                    >
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-100">
                          {row.full_name}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-300">
                        {row.email ?? '--'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <Badge
                            className={
                              row.is_inactive
                                ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                            }
                          >
                            {row.is_inactive ? 'Inactivo' : 'Activo'}
                          </Badge>
                          {row.is_inactive ? (
                            <span className="text-xs text-amber-200">
                              {inactiveDurationLabel(row.inactive_for_days)}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-200">
                        <div className="font-medium">
                          {row.program_title ?? 'Sin programa'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {row.edition_name ?? 'Sin edición'}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge className="border border-slate-700 bg-slate-800 text-slate-100">
                          {row.role_type === 'student'
                            ? 'Estudiante'
                            : 'Docente'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

