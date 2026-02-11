'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserCheck, UserX } from 'lucide-react'

export type AppRole = 'talent' | 'super_admin'

export type UserRow = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  role: AppRole
  is_active: boolean
  profile_status: string | null
  created_at: string
}

function formatDate(value: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function displayName(user: UserRow): string {
  const name = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
  return name || user.email || 'Usuario'
}

export function UsersTable({
  rows,
  loading,
  busyIds,
  currentUserId,
  roleOptions,
  onRoleChange,
  onToggleActive,
}: {
  rows: UserRow[]
  loading: boolean
  busyIds: Record<string, boolean>
  currentUserId: string | null
  roleOptions: AppRole[]
  onRoleChange: (user: UserRow, role: AppRole) => void
  onToggleActive: (user: UserRow) => void
}) {
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
        Cargando usuarios…
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
        No hay usuarios para mostrar.
      </div>
    )
  }

  return (
    <div
      className="rounded-lg border border-slate-800 overflow-hidden"
      style={{ contentVisibility: 'auto' }}
    >
      <div className="grid grid-cols-12 gap-0 border-b border-slate-800 bg-slate-900/60 text-xs text-slate-300 font-medium">
        <div className="col-span-4 px-3 py-2">Usuario</div>
        <div className="col-span-3 px-3 py-2">Rol</div>
        <div className="col-span-2 px-3 py-2">Estado</div>
        <div className="col-span-2 px-3 py-2">Registro</div>
        <div className="col-span-1 px-3 py-2 text-right">Acciones</div>
      </div>

      {rows.map((user) => {
        const isBusy = Boolean(busyIds[user.id])
        const isSelf = currentUserId === user.id
        const canEdit = !isSelf && !isBusy
        const active = Boolean(user.is_active)

        return (
          <div
            key={user.id}
            className="grid grid-cols-12 items-center border-b border-slate-800 last:border-b-0 bg-[#0B0D12]"
          >
            <div className="col-span-4 px-3 py-3 min-w-0">
              <div className="font-medium text-slate-100 truncate">
                {displayName(user)}
              </div>
              <div className="text-xs text-slate-400 truncate">
                {user.email ?? '—'}
              </div>
              {isSelf ? (
                <div className="text-[11px] text-emerald-300/80 mt-1">
                  Tu usuario
                </div>
              ) : null}
            </div>

            <div className="col-span-3 px-3 py-3 min-w-0">
              <Select
                value={user.role}
                onValueChange={(value) => onRoleChange(user, value as AppRole)}
                disabled={!canEdit}
              >
                <SelectTrigger
                  className="h-9 bg-slate-900 border-slate-800 text-slate-100"
                  aria-label={`Cambiar rol de ${displayName(user)}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role === 'super_admin' ? 'Super admin' : 'Talent'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 px-3 py-3">
              <Badge
                className={[
                  'border',
                  active
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-900 text-slate-300 border-slate-800',
                ].join(' ')}
              >
                {active ? 'Activo' : 'Desactivado'}
              </Badge>
            </div>

            <div className="col-span-2 px-3 py-3 text-sm text-slate-300 min-w-0">
              {formatDate(user.created_at)}
            </div>

            <div className="col-span-1 px-3 py-3 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
                disabled={!canEdit}
                onClick={() => onToggleActive(user)}
                title={active ? 'Desactivar' : 'Activar'}
                aria-label={active ? 'Desactivar usuario' : 'Activar usuario'}
              >
                {active ? (
                  <UserX className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <UserCheck className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="sr-only">
                  {active ? 'Desactivar' : 'Activar'}
                </span>
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
