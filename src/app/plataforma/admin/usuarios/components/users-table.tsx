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
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm text-white/60">
        Cargando usuarios…
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 text-sm text-white/60">
        No hay usuarios para mostrar.
      </div>
    )
  }

  return (
    <div
      className="rounded-lg border border-white/10 overflow-hidden"
      style={{ contentVisibility: 'auto' }}
    >
      <div className="grid grid-cols-12 gap-0 border-b border-white/10 bg-black/60 text-xs text-white/60 font-medium">
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
            className="grid grid-cols-12 items-center border-b border-white/10 last:border-b-0 bg-[#0B0D12]"
          >
            <div className="col-span-4 px-3 py-3 min-w-0">
              <div className="font-medium text-white truncate">
                {displayName(user)}
              </div>
              <div className="text-xs text-white/50 truncate">
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
                  className="h-9 bg-black/30 border-white/10 text-white"
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
                    : 'bg-white/5 text-white/60 border-white/10',
                ].join(' ')}
              >
                {active ? 'Activo' : 'Desactivado'}
              </Badge>
            </div>

            <div className="col-span-2 px-3 py-3 text-sm text-white/60 min-w-0">
              {formatDate(user.created_at)}
            </div>

            <div className="col-span-1 px-3 py-3 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="border-white/10 bg-black/30 text-white/80 hover:bg-white/10"
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
