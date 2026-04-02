'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Users } from 'lucide-react'

import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type TeamRow = {
  id: string
  name: string
  task_count: number
  edition?: {
    edition_name?: string
    program?: { title?: string } | null
  } | null
}

export default function DocenteHomePage() {
  const { showError } = useToastEnhanced()
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<TeamRow[]>([])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      const response = await fetch('/api/plataforma/docente/teams', {
        cache: 'no-store',
      })
      const payload = (await response.json().catch(() => null)) as {
        ok: boolean
        teams?: TeamRow[]
        message?: string
      } | null
      if (!response.ok || !payload?.ok) {
        showError(payload?.message ?? 'No se pudieron cargar equipos.')
        setLoading(false)
        return
      }
      setTeams(payload.teams ?? [])
      setLoading(false)
    }
    void run()
  }, [])

  if (loading) {
    return (
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="py-8 text-sm text-slate-300">
          Cargando equipos...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>Equipos asignados</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">
          Revisa tareas, entregas, feedback y actividad de los equipos que te
          fueron asignados.
        </CardContent>
      </Card>

      {teams.length === 0 ? (
        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardContent className="py-8 text-sm text-slate-300">
            No tienes equipos asignados por ahora.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="border border-slate-800 bg-slate-900 text-slate-100"
            >
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{team.name}</CardTitle>
                  <Badge className="border border-slate-700 bg-slate-800 text-slate-100">
                    {team.task_count} tareas
                  </Badge>
                </div>
                <div className="text-xs text-slate-400">
                  {team.edition?.program?.title ?? 'Programa'} ·{' '}
                  {team.edition?.edition_name ?? 'Edición'}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-300" />
                  <span className="text-sm text-slate-300">
                    Workspace de seguimiento
                  </span>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button asChild>
                    <Link href={`/plataforma/docente/equipos/${team.id}`}>
                      Abrir equipo <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
