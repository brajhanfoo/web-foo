'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

import type { AppRole } from './users-table'

type RoleFilter = AppRole | 'all'

export function UsersToolbar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  totalCount,
  filteredCount,
}: {
  search: string
  onSearchChange: (value: string) => void
  roleFilter: RoleFilter
  onRoleFilterChange: (value: RoleFilter) => void
  totalCount: number
  filteredCount: number
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full min-w-[220px] max-w-xs">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por nombre o email…"
            name="users_search"
            aria-label="Buscar usuarios"
            autoComplete="off"
            className="bg-black/30 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        <Select value={roleFilter} onValueChange={onRoleFilterChange}>
          <SelectTrigger
            className="w-[180px] bg-black/30 border-white/10 text-white"
            aria-label="Filtrar por rol"
          >
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="talent">Talent</SelectItem>
            <SelectItem value="super_admin">Super admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Badge className="bg-white/10 text-white border border-white/10">
        {filteredCount} de {totalCount}
      </Badge>
    </div>
  )
}
