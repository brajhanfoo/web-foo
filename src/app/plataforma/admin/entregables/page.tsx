'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BookMarked } from 'lucide-react'

import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type TeamRef = {
  id: string
  name: string
  edition?: {
    id?: string
    edition_name?: string
    program?: { id?: string; title?: string } | null
  } | null
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

export default function AdminEntregablesPage() {
  const { showError } = useToastEnhanced()
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<TeamRef[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      const response = await fetch('/api/plataforma/tasks/references', {
        cache: 'no-store',
      })
      const payload = (await response.json().catch(() => null)) as
        | { ok: true; teams?: TeamRef[] }
        | { ok: false; message?: string }
        | null

      if (!response.ok || !payload || !payload.ok) {
        const message =
          payload && 'message' in payload
            ? payload.message
            : 'No se pudo cargar equipos.'
        showError(message ?? 'No se pudo cargar equipos.')
        setTeams([])
        setLoading(false)
        return
      }

      setTeams(payload.teams ?? [])
      setLoading(false)
    }

    void run()
  }, [])

  const filteredTeams = useMemo(() => {
    const q = normalize(query)
    if (!q) return teams

    return teams.filter((team) => {
      const programTitle = normalize(team.edition?.program?.title)
      const editionName = normalize(team.edition?.edition_name)
      const teamName = normalize(team.name)
      return (
        teamName.includes(q) ||
        editionName.includes(q) ||
        programTitle.includes(q)
      )
    })
  }, [teams, query])

  if (loading) {
    return (
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="py-8 text-sm text-slate-300">
          Cargando entregables...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-emerald-300" /> Entregables
            contextuales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <p>
            La creacion y gestion de tareas ahora vive dentro del flujo oficial:
            programa / edicion / equipo / hito / tarea.
          </p>
          <p>
            Usa esta vista solo como indice administrativo para navegar rapido
            al equipo correcto.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/plataforma/admin/programas">Ir a Programas</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>Equipos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="border-slate-800 bg-slate-950"
            placeholder="Filtrar por programa, edicion o equipo"
          />

          {filteredTeams.length === 0 ? (
            <div className="text-sm text-slate-400">
              No hay equipos para mostrar.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTeams.map((team) => {
                const programId = team.edition?.program?.id ?? ''
                const editionId = team.edition?.id ?? ''
                const canOpen = Boolean(programId && editionId)

                return (
                  <div
                    key={team.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-100">
                        {team.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {team.edition?.program?.title ?? 'Programa'} ·{' '}
                        {team.edition?.edition_name ?? 'Edicion'}
                      </div>
                    </div>

                    {canOpen ? (
                      <Button asChild size="sm">
                        <Link
                          href={`/plataforma/admin/programas/${programId}/ediciones/${editionId}/equipos/${team.id}`}
                        >
                          Abrir equipo <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button size="sm" disabled>
                        Contexto incompleto
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
