// src/app/plataforma/talento/mis-postulaciones/components/mis-postulaciones-view.tsx

'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

import type { PastCompletedItem, ViewState } from '../types'
import { CurrentApplicationHero } from './current-application-hero'
import { PastCompletedCard } from './past-completed-card'

export function MisPostulacionesView(props: {
  state: ViewState
  pastCompleted: PastCompletedItem[]
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6">
        <div className="text-2xl font-semibold">Mis Postulaciones</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Revisa el estado de tu postulación actual y tus participaciones
          anteriores.
        </div>
      </div>

      {props.state.kind === 'loading' ? (
        <Card className="border bg-background/10">
          <CardContent className="py-10 text-sm text-muted-foreground">
            Cargando tus postulaciones…
          </CardContent>
        </Card>
      ) : null}

      {props.state.kind === 'signed_out' ? (
        <Card className="border bg-background/10">
          <CardContent className="py-10">
            <div className="text-sm text-muted-foreground">
              No tienes una sesión activa. Inicia sesión para ver tus
              postulaciones.
            </div>
          </CardContent>
        </Card>
      ) : null}

      {props.state.kind === 'empty' ? (
        <Card className="border bg-background/10">
          <CardContent className="py-10">
            <div className="text-sm text-muted-foreground">
              Aún no tienes postulaciones registradas.
            </div>
            <div className="mt-4">
              <Button className="gap-2" asChild>
                <Link href="/plataforma">
                  Explorar programas <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {props.state.kind === 'ready' ? (
        <div className="space-y-6">
          {props.state.active.length ? (
            <div className="space-y-4">
              {props.state.active.length > 1 ? (
                <div className="text-sm font-semibold">
                  Postulaciones activas
                </div>
              ) : null}
              <div className="space-y-4">
                {props.state.active.map((app) => (
                  <CurrentApplicationHero key={app.id} app={app} />
                ))}
              </div>
            </div>
          ) : null}

          {props.pastCompleted.length ? (
            <div className="pt-2">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold">
                  Simulaciones anteriores
                </div>
                <Badge variant="secondary" className="gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Historial
                </Badge>
              </div>

              <div className="space-y-3">
                {props.pastCompleted.map((p) => (
                  <PastCompletedCard
                    key={p.id}
                    programTitle={p.programTitle}
                    editionLabel={p.editionLabel}
                    finishedLabel={p.finishedLabel}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
