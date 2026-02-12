'use client'

import Link from 'next/link'
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
  email_confirmed_at: string | null
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
        const isActive = Boolean(user.is_active)
        const isVerified = Boolean(user.email_confirmed_at)
        const statusLabel = !isVerified
          ? 'No verificado'
          : isActive
            ? 'Activo'
            : 'Desactivado'
        const statusClasses = !isVerified
          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
          : isActive
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : 'bg-slate-900 text-slate-300 border-slate-800'

        return (
          <div
            key={user.id}
            className="relative grid grid-cols-12 items-center border-b border-slate-800 last:border-b-0 bg-[#0B0D12] transition-colors hover:bg-slate-950/60"
          >
            <Link
              href={`/plataforma/admin/usuarios/${user.id}`}
              className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              aria-label={`Ver detalle de ${displayName(user)}`}
            >
              <span className="sr-only">{`Ver detalle de ${displayName(user)}`}</span>
            </Link>
            <div className="col-span-4 px-3 py-3 min-w-0">
              <div className="font-medium text-slate-100 truncate">
                {displayName(user)}
              </div>
              <div className="text-xs text-slate-400 truncate">
                {user.email ?? '—'}
              </div>
              <div className="mt-1 text-[11px] text-emerald-300/80">
                Ver detalle
              </div>
              {isSelf ? (
                <div className="text-[11px] text-emerald-300/80 mt-1">
                  Tu usuario
                </div>
              ) : null}
            </div>

            <div className="col-span-3 px-3 py-3 min-w-0 relative z-20">
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
                className={['border', statusClasses].join(' ')}
              >
                {statusLabel}
              </Badge>
            </div>

            <div className="col-span-2 px-3 py-3 text-sm text-slate-300 min-w-0">
              {formatDate(user.created_at)}
            </div>

            <div className="col-span-1 px-3 py-3 flex justify-end relative z-20">
              <Button
                size="sm"
                variant="outline"
                className="border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
                disabled={!canEdit}
                onClick={() => onToggleActive(user)}
                title={isActive ? 'Desactivar' : 'Activar'}
                aria-label={isActive ? 'Desactivar usuario' : 'Activar usuario'}
              >
                {isActive ? (
                  <UserX className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <UserCheck className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="sr-only">
                  {isActive ? 'Desactivar' : 'Activar'}
                </span>
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
