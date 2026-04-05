'use client'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { ProfessionalArea } from './types'

export type DocenteStatusFilter = 'all' | 'active' | 'inactive'

export function DocentesToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  areaFilter,
  onAreaFilterChange,
  areas,
  totalCount,
  filteredCount,
}: {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: DocenteStatusFilter
  onStatusFilterChange: (value: DocenteStatusFilter) => void
  areaFilter: string
  onAreaFilterChange: (value: string) => void
  areas: ProfessionalArea[]
  totalCount: number
  filteredCount: number
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <div className="w-full min-w-0 max-w-sm">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por docente o email..."
            aria-label="Buscar docentes"
            autoComplete="off"
            className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-400"
          />
        </div>

        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger
            className="w-full bg-slate-900 border-slate-800 text-slate-100 sm:w-[180px]"
            aria-label="Filtrar por estado"
          >
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={areaFilter} onValueChange={onAreaFilterChange}>
          <SelectTrigger
            className="w-full bg-slate-900 border-slate-800 text-slate-100 sm:w-[220px]"
            aria-label="Filtrar por área"
          >
            <SelectValue placeholder="Área profesional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las áreas</SelectItem>
            <SelectItem value="none">Sin área</SelectItem>
            {areas.map((area) => (
              <SelectItem key={area.id} value={area.id}>
                {area.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Badge className="bg-slate-800 text-slate-100 border border-slate-800">
        {filteredCount} de {totalCount}
      </Badge>
    </div>
  )
}
