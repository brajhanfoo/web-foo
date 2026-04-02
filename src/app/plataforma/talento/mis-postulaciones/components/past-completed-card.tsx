// src/app/plataforma/talento/mis-postulaciones/components/past-completed-card.tsx

'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, ExternalLink, ArrowRight } from 'lucide-react'

export function PastCompletedCard(props: {
  programTitle: string
  editionLabel: string
  finishedLabel: string
}) {
  return (
    <Card className="border bg-background/10 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {props.programTitle} <span className="mx-2 opacity-40">|</span>{' '}
            {props.editionLabel}
          </div>
          <div className="text-xs text-muted-foreground">
            {props.finishedLabel}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border bg-background/10">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Estado: FINALIZADO</div>
            <div className="text-xs text-muted-foreground">
              Has completado este programa exitosamente. Puedes acceder a tus
              credenciales.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" className="gap-2" asChild>
            <Link href="#">
              Ver certificado <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="#">
              Ir al aula <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
