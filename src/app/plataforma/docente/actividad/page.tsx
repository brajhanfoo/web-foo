'use client'

import { useEffect, useRef, useState } from 'react'

import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type StudentActivity = {
  profile_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  team_id: string
  team_name: string | null
  inactive_for_days: number | null
  is_inactive: boolean
}

type ActivityPayload = {
  ok: boolean
  threshold_days: number
  totals: { total: number; inactive: number }
  students: StudentActivity[]
}
const PRIMARY_CTA_CLASS = 'bg-[#00CCA4] text-slate-950 hover:bg-[#00b997]'

function fullName(first: string | null, last: string | null): string {
  return `${first ?? ''} ${last ?? ''}`.trim() || 'Sin nombre'
}

function countLabel(
  count: number,
  singular: string,
  plural: string = `${singular}s`
): string {
  return `${count} ${count === 1 ? singular : plural}`
}

function inactiveDurationLabel(days: number | null): string {
  const safeDays = Math.max(1, days ?? 1)
  return `Inactivo durante ${safeDays} ${safeDays === 1 ? 'día' : 'días'}`
}

export default function DocenteActivityPage() {
  const { showError } = useToastEnhanced()
  const showErrorRef = useRef(showError)
  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState<ActivityPayload | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    showErrorRef.current = showError
  }, [showError])

  async function loadData() {
    setLoading(true)
    setErrorMessage(null)
    const response = await fetch('/api/plataforma/docente/activity', {
      cache: 'no-store',
    })
    const data = (await response.json().catch(() => null)) as
      | ActivityPayload
      | { ok: false; message?: string }
      | null

    if (!response.ok || !data || !data.ok) {
      const message =
        data && 'message' in data
          ? data.message
          : 'No se pudo cargar actividad.'
      setPayload(null)
      setErrorMessage(message ?? 'No se pudo cargar actividad.')
      showErrorRef.current(message ?? 'No se pudo cargar actividad.')
      setLoading(false)
      return
    }

    setPayload(data)
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [])

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
          <Button
            type="button"
            size="sm"
            onClick={() => void loadData()}
            className={PRIMARY_CTA_CLASS}
          >
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
          <CardTitle>Actividad de estudiantes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <Badge className="border border-slate-700 bg-slate-800 text-slate-100">
            {countLabel(payload.totals.total, 'estudiante', 'estudiantes')}
          </Badge>
          <Badge className="border border-amber-500/40 bg-amber-500/10 text-amber-200">
            {countLabel(payload.totals.inactive, 'inactivo', 'inactivos')}
          </Badge>
        </CardContent>
      </Card>

      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>Detalle por estudiante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {payload.students.length === 0 ? (
            <div className="text-sm text-slate-400">
              No hay estudiantes en tus equipos.
            </div>
          ) : (
            payload.students.map((row) => (
              <div
                key={row.profile_id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-100">
                    {fullName(row.first_name, row.last_name)}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {row.email}
                  </div>
                  <div className="text-xs text-slate-500">
                    {row.team_name ?? 'Equipo'}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-1 sm:items-end">
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
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
