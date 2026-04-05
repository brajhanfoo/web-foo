'use client'

import Link from 'next/link'
import { MoreHorizontal, RotateCcw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  formatDateTimeInTimeZone,
  PLATFORM_TIMEZONE,
} from '@/lib/platform/timezone'

import type { DocenteRow } from './types'
const PRIMARY_CTA_CLASS = 'bg-[#00CCA4] text-slate-950 hover:bg-[#00b997]'

function buildFullName(docente: DocenteRow): string {
  const fullName =
    `${docente.first_name ?? ''} ${docente.last_name ?? ''}`.trim() || ''
  return fullName || docente.email || 'Docente'
}

function formatDate(value: string | null): string {
  return formatDateTimeInTimeZone(value, PLATFORM_TIMEZONE)
}

export function DocentesTable({
  rows,
  loading,
  busyIds,
  areaNameById,
  onResetPassword,
  onToggleActive,
}: {
  rows: DocenteRow[]
  loading: boolean
  busyIds: Record<string, boolean>
  areaNameById: Map<string, string>
  onResetPassword: (docente: DocenteRow) => void
  onToggleActive: (docente: DocenteRow) => void
}) {
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
        Cargando docentes...
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
        No hay docentes para mostrar.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="bg-slate-900/60 text-slate-300">
            <tr className="border-b border-slate-800">
              <th className="px-3 py-2 text-left font-medium">Docente</th>
              <th className="px-3 py-2 text-left font-medium">Email</th>
              <th className="px-3 py-2 text-left font-medium">Área</th>
              <th className="px-3 py-2 text-left font-medium">Estado</th>
              <th className="px-3 py-2 text-center font-medium">Equipos</th>
              <th className="px-3 py-2 text-left font-medium">Último acceso</th>
              <th className="px-3 py-2 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((docente) => {
              const busy = Boolean(busyIds[docente.id])
              const areaName = docente.professional_area_id
                ? areaNameById.get(docente.professional_area_id)
                : null

              return (
                <tr
                  key={docente.id}
                  className="border-b border-slate-800 bg-[#0B0D12] align-top last:border-b-0"
                >
                  <td className="px-3 py-3">
                    <div className="font-medium text-slate-100">
                      {buildFullName(docente)}
                    </div>
                    {docente.password_reset_required ? (
                      <Badge className="mt-1 border-amber-500/40 bg-amber-500/10 text-amber-200">
                        Cambio de contraseña pendiente
                      </Badge>
                    ) : null}
                  </td>

                  <td className="px-3 py-3 text-slate-300">{docente.email ?? '--'}</td>

                  <td className="px-3 py-3 text-slate-300">{areaName ?? 'Sin área'}</td>

                  <td className="px-3 py-3">
                    <Badge
                      className={
                        docente.is_active
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                          : 'border-slate-700 bg-slate-800 text-slate-300'
                      }
                    >
                      {docente.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>

                  <td className="px-3 py-3 text-center text-slate-200 font-medium">
                    {docente.active_assignments_count}
                  </td>

                  <td className="px-3 py-3 text-slate-300">
                    {formatDate(docente.last_login_at)}
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        asChild
                        size="sm"
                        disabled={busy}
                        className={PRIMARY_CTA_CLASS}
                      >
                        <Link href={`/plataforma/admin/docentes/${docente.id}`}>
                          Ver detalle
                        </Link>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                            disabled={busy}
                            aria-label="Más acciones"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem
                            onSelect={() => onResetPassword(docente)}
                            disabled={busy}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Reset password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => onToggleActive(docente)}
                            disabled={busy}
                            className={
                              docente.is_active
                                ? 'text-rose-300 focus:text-rose-200'
                                : 'text-emerald-300 focus:text-emerald-200'
                            }
                          >
                            {docente.is_active ? 'Desactivar docente' : 'Reactivar docente'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
