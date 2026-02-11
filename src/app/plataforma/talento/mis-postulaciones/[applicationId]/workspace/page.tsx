// src/app/plataforma/talento/mis-postulaciones/[applicationId]/workspace/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ExternalLink,
  Folder,
  GraduationCap,
  MessageSquare,
  Users,
  Video,
} from 'lucide-react'

type WorkspaceTeamRow = {
  id: string
  name: string
  drive_url: string | null
  classroom_url: string | null
  slack_url: string | null
}

type WorkspaceMilestoneRow = {
  id: string
  title: string
  meet_url: string | null
  drive_url: string | null
  starts_at: string | null
  position: number | null
  created_at: string
}

type WorkspacePayload = {
  application: {
    id: string
    program_id: string
    edition_id: string | null
    status: string
    team_id: string | null
    certificate_bucket_id: string | null
    certificate_object_path: string | null
  }
  program: { title: string | null }
  edition: {
    edition_name: string | null
    starts_at: string | null
    ends_at: string | null
  }
  team: WorkspaceTeamRow | null
  milestones: WorkspaceMilestoneRow[]
}

type WorkspaceApiResponse =
  | { ok: true; data: WorkspacePayload }
  | { ok: false; message: string }

type WorkspaceState =
  | { kind: 'loading' }
  | { kind: 'unauthorized'; message: string }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: WorkspacePayload }

function formatDateDMY(value: string | null | undefined): string {
  const raw = (value ?? '').trim()
  if (!raw) return ''
  const clean = raw.split('T')[0] ?? ''
  const parts = clean.split('-')
  if (parts.length !== 3) return ''
  const [year, month, day] = parts
  if (!year || !month || !day) return ''
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
}

function buildEditionRange(edition: WorkspacePayload['edition'] | null) {
  if (!edition) return ''
  const startLine = formatDateDMY(edition.starts_at)
  const endLine = formatDateDMY(edition.ends_at)
  const startText = startLine ? `Inicio: ${startLine}` : ''
  const endText = endLine ? `Fin: ${endLine}` : ''
  if (startText && endText) return `${startText} - ${endText}`
  return startText || endText
}

export default function WorkspacePage() {
  const params = useParams<{ applicationId?: string }>()
  const router = useRouter()
  const { showError } = useToastEnhanced()
  const showErrorRef = useRef(showError)

  const [state, setState] = useState<WorkspaceState>({ kind: 'loading' })
  const [certificateBusy, setCertificateBusy] = useState(false)

  useEffect(() => {
    showErrorRef.current = showError
  }, [showError])

  const applicationId = useMemo(() => {
    const raw = params.applicationId
    return typeof raw === 'string' ? raw : ''
  }, [params.applicationId])

  useEffect(() => {
    if (!applicationId) {
      setState({ kind: 'error', message: 'Falta el identificador.' })
      return
    }

    let cancelled = false

    const run = async () => {
      setState({ kind: 'loading' })
      try {
        const response = await fetch(
          `/api/plataforma/talento/workspace/${applicationId}`
        )
        const payload = (await response.json()) as WorkspaceApiResponse

        if (!response.ok || !payload.ok) {
          const message =
            typeof payload === 'object' && payload && 'message' in payload
              ? payload.message
              : 'No se pudo cargar el workspace'

          if (response.status === 401 || response.status === 403) {
            if (!cancelled) {
              setState({ kind: 'unauthorized', message })
            }
            return
          }

          if (!cancelled) {
            showErrorRef.current('No se pudo cargar el workspace', message)
            setState({ kind: 'error', message })
          }
          return
        }

        if (!cancelled) {
          setState({ kind: 'ready', data: payload.data })
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error inesperado'
        if (!cancelled) {
          showErrorRef.current('No se pudo cargar el workspace', message)
          setState({ kind: 'error', message })
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [applicationId])

  const editionRange = useMemo(() => {
    if (state.kind !== 'ready') return ''
    return buildEditionRange(state.data.edition)
  }, [state])

  const showCertificate = useMemo(() => {
    if (state.kind !== 'ready') return false
    return Boolean(state.data.application.certificate_object_path)
  }, [state])

  const handleCertificateOpen = async () => {
    if (state.kind !== 'ready') return
    if (!state.data.application.certificate_object_path) return

    setCertificateBusy(true)

    try {
      const response = await fetch(
        `/api/plataforma/edition-artifacts/get-signed-url?application_id=${state.data.application.id}&kind=certificate`
      )
      const payload = (await response.json()) as {
        signed_url?: string
        message?: string
      }

      if (!response.ok || !payload.signed_url) {
        throw new Error(payload.message ?? 'No se pudo obtener el enlace')
      }

      window.open(payload.signed_url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error inesperado'
      showErrorRef.current('No se pudo abrir el certificado', message)
    } finally {
      setCertificateBusy(false)
    }
  }

  if (state.kind === 'loading') {
    return (
      <Card className="border bg-background/10">
        <CardContent className="py-10 text-sm text-white/70">
          Cargando espacio de trabajo...
        </CardContent>
      </Card>
    )
  }

  if (state.kind === 'unauthorized') {
    return (
      <Card className="border bg-background/10">
        <CardContent className="py-8 space-y-3">
          <div className="text-sm text-white/70">
            {state.message || 'No autorizado.'}
          </div>
          <Button
            variant="secondary"
            className="bg-white/10 hover:bg-white/15 border border-white/10 text-white"
            onClick={() =>
              router.push('/plataforma/talento/mis-postulaciones')
            }
          >
            Ir a mis postulaciones
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (state.kind === 'error') {
    return (
      <Card className="border bg-background/10">
        <CardContent className="py-8 space-y-3">
          <div className="text-sm text-white/70">
            {state.message || 'No se pudo cargar el contenido.'}
          </div>
          <Button
            variant="secondary"
            className="bg-white/10 hover:bg-white/15 border border-white/10 text-white"
            onClick={() => router.refresh()}
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { data } = state
  const programTitle = data.program.title ?? 'Programa'
  const editionName = data.edition.edition_name ?? 'Edicion'

  const teamLinks = [
    {
      key: 'drive',
      label: 'Drive',
      href: data.team?.drive_url ?? null,
      icon: <Folder className="h-4 w-4" />,
    },
    {
      key: 'classroom',
      label: 'Classroom',
      href: data.team?.classroom_url ?? null,
      icon: <GraduationCap className="h-4 w-4" />,
    },
    {
      key: 'slack',
      label: 'Slack',
      href: data.team?.slack_url ?? null,
      icon: <MessageSquare className="h-4 w-4" />,
    },
  ].filter((link) => Boolean(link.href))

  return (
    <div className="space-y-6 text-white">
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-[0.2em] text-white/40">
          Espacio de trabajo
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="text-2xl font-semibold text-white break-words">
              {programTitle}
            </div>
            <div className="text-sm text-white/70 break-words">
              Edicion: {editionName}
            </div>
            {editionRange ? (
              <div className="text-sm text-white/70">
                {editionRange}
              </div>
            ) : null}
          </div>
          <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
            Matricula confirmada
          </Badge>
        </div>
      </div>

      <div
        className={[
          'grid gap-4',
          showCertificate ? 'md:grid-cols-2' : 'md:grid-cols-1',
        ].join(' ')}
      >
        <Card className="border bg-background/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Mi equipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.team ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border bg-background/10">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {data.team.name}
                    </div>
                    <div className="text-xs text-white/60">
                      Equipo asignado
                    </div>
                  </div>
                </div>

                {teamLinks.length ? (
                  <div className="flex flex-wrap gap-2">
                    {teamLinks.map((link) => (
                      <Button
                        key={link.key}
                        variant="secondary"
                        className="gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white"
                        asChild
                      >
                        <Link
                          href={link.href ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.label} {link.icon}
                        </Link>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-white/70">
                    No hay enlaces disponibles todavia.
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-white/70">
                Aun no tienes equipo asignado.
              </div>
            )}
          </CardContent>
        </Card>

        {showCertificate ? (
          <Card className="border bg-background/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">Certificado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl border bg-background/10">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    Certificado disponible
                  </div>
                  <div className="text-xs text-white/70">
                    Descarga tu constancia de participacion.
                  </div>
                </div>
              </div>
              <Button
                className="gap-2 bg-emerald-700 hover:bg-emerald-600 text-white"
                disabled={certificateBusy}
                onClick={() => void handleCertificateOpen()}
              >
                Ver certificado <ExternalLink className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card className="border bg-background/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">
            Hitos de la edicion
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data.milestones.length ? (
            <div className="text-sm text-white/70">
              No hay hitos todavia.
            </div>
          ) : (
            <div
              className="rounded-lg border border-white/10 overflow-hidden"
              style={{ contentVisibility: 'auto' }}
            >
              <div className="hidden md:grid grid-cols-12 gap-0 border-b border-white/10 bg-white/5 text-xs text-white/60 font-medium">
                <div className="col-span-6 px-3 py-2">Hito</div>
                <div className="col-span-3 px-3 py-2">Fecha</div>
                <div className="col-span-3 px-3 py-2 text-right">Acciones</div>
              </div>

              {data.milestones.map((milestone) => {
                const dateLabel = milestone.starts_at
                  ? formatDateDMY(milestone.starts_at)
                  : '-'

                return (
                  <div
                    key={milestone.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-0 border-b border-white/10 last:border-b-0 bg-black/20 px-3 py-3"
                  >
                    <div className="md:col-span-6">
                      <div className="text-sm font-semibold text-white">
                        {milestone.title}
                      </div>
                    </div>
                    <div className="md:col-span-3 text-sm text-white/60">
                      {dateLabel}
                    </div>
                    <div className="md:col-span-3">
                      <div className="flex flex-wrap justify-start md:justify-end gap-2">
                        {milestone.meet_url ? (
                          <Button
                            size="icon"
                            variant="secondary"
                            className="bg-white/10 hover:bg-white/15 border border-white/10 text-white"
                            asChild
                          >
                            <Link
                              href={milestone.meet_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Abrir meet"
                              title="Abrir meet"
                            >
                              <Video className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">Abrir meet</span>
                            </Link>
                          </Button>
                        ) : null}
                        {milestone.drive_url ? (
                          <Button
                            size="icon"
                            variant="secondary"
                            className="bg-white/10 hover:bg-white/15 border border-white/10 text-white"
                            asChild
                          >
                            <Link
                              href={milestone.drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Abrir drive"
                              title="Abrir drive"
                            >
                              <Folder className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">Abrir drive</span>
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
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
