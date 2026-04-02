'use client'

import { useEffect, useRef, useState } from 'react'

import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { Badge } from '@/components/ui/badge'
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

function fullName(first: string | null, last: string | null): string {
  return `${first ?? ''} ${last ?? ''}`.trim() || 'Sin nombre'
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
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 hover:bg-slate-700"
          >
            Reintentar
          </button>
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
            {payload.totals.total} estudiantes
          </Badge>
          <Badge className="border border-amber-500/40 bg-amber-500/10 text-amber-200">
            {payload.totals.inactive} inactivos (&gt;= {payload.threshold_days}{' '}
            dÃ­as)
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
                <Badge
                  className={
                    row.is_inactive
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                      : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  }
                >
                  {row.inactive_for_days ?? 0} dÃ­as
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
