'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { useAuthStore } from '@/stores/auth-stores'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import {
  Rocket,
  Users,
  ArrowRight,
  Lock,
  Calendar,
  HelpCircle,
} from 'lucide-react'

type ProgramRow = {
  id: string
  slug: string
  title: string
  description: string | null
  is_published: boolean
  requires_payment_pre: boolean
  created_at: string
}

type EditionRow = {
  id: string
  program_id: string
  edition_name: string
  starts_at: string | null
  ends_at: string | null
  is_open: boolean
  created_at: string
}

type ApplicationFormRow = {
  id: string
  program_id: string
  edition_id: string | null
  version_num: number
  schema_json: unknown
  is_active: boolean
  opens_at: string | null
  closes_at: string | null
  created_at: string
}

type ProgramStatus = 'open' | 'closed' | 'soon'

type ProgramCardVM = ProgramRow & {
  edition: EditionRow | null
  form: ApplicationFormRow | null
  status: ProgramStatus
}

function safeString(value: unknown): string {
  if (typeof value === 'string') return value
  return ''
}

function parseIsoDateOnlyToDM(value: string): string {
  // Espera "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ssZ"
  const s = value.trim()
  if (!s) return ''
  const d = s.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return ''
  const year = d.slice(0, 4)
  const month = d.slice(5, 7)
  const day = d.slice(8, 10)
  return `${day}/${month}/${year}`
}

function isFormOpen(form: ApplicationFormRow, now: Date): boolean {
  if (!form.is_active) return false

  const opensAt = form.opens_at ? new Date(form.opens_at) : null
  const closesAt = form.closes_at ? new Date(form.closes_at) : null

  if (opensAt && now < opensAt) return false
  if (closesAt && now > closesAt) return false

  return true
}

function pickProgramIcon(slug: string): 'rocket' | 'users' {
  const s = slug.trim().toLowerCase()
  if (s.includes('academy')) return 'rocket'
  if (s.includes('project')) return 'users'
  return 'rocket'
}

function statusLabel(status: ProgramStatus): string {
  if (status === 'open') return 'ABIERTO'
  if (status === 'soon') return 'PRÓXIMAMENTE'
  return 'CERRADO'
}

export default function ProgramsPage() {
  const router = useRouter()
  const toast = useToastEnhanced()
  const { bootAuth, userId, profile } = useAuthStore()

  const didBootReference = useRef<boolean>(false)
  const didLoadReference = useRef<boolean>(false)

  const [loading, setLoading] = useState<boolean>(true)
  const [items, setItems] = useState<ProgramCardVM[]>([])

  useEffect(() => {
    if (didBootReference.current) return
    didBootReference.current = true
    void bootAuth()
  }, [bootAuth])

  useEffect(() => {
    if (didLoadReference.current) return
    didLoadReference.current = true
    void loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadAll(): Promise<void> {
    setLoading(true)

    const programsResponse = await supabase
      .from('programs')
      .select(
        'id, slug, title, description, is_published, requires_payment_pre, created_at'
      )
      .order('created_at', { ascending: true })

    if (programsResponse.error) {
      toast.showError(
        `No se pudieron cargar programas. ${safeString(programsResponse.error.message)}`
      )
      setItems([])
      setLoading(false)
      return
    }

    const programs = (programsResponse.data ?? []) as ProgramRow[]
    if (programs.length === 0) {
      setItems([])
      setLoading(false)
      return
    }

    const programIds = programs.map((p) => p.id)

    const [editionsResponse, formsResponse] = await Promise.all([
      supabase
        .from('program_editions')
        .select(
          'id, program_id, edition_name, starts_at, ends_at, is_open, created_at'
        )
        .in('program_id', programIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('application_forms')
        .select(
          'id, program_id, edition_id, version_num, schema_json, is_active, opens_at, closes_at, created_at'
        )
        .in('program_id', programIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    ])

    if (editionsResponse.error) {
      toast.showError('No se pudieron cargar ediciones.')
    }
    if (formsResponse.error) {
      toast.showError('No se pudieron cargar formularios.')
    }

    const editions = (editionsResponse.data ?? []) as EditionRow[]
    const forms = (formsResponse.data ?? []) as ApplicationFormRow[]

    // última edición por programa (por created_at desc)
    const latestEditionByProgram = new Map<string, EditionRow>()
    const latestOpenEditionByProgram = new Map<string, EditionRow>()
    for (const ed of editions) {
      if (!latestEditionByProgram.has(ed.program_id)) {
        latestEditionByProgram.set(ed.program_id, ed)
      }
      if (ed.is_open && !latestOpenEditionByProgram.has(ed.program_id)) {
        latestOpenEditionByProgram.set(ed.program_id, ed)
      }
    }

    // último form activo por programa/edición (por created_at desc)
    const latestFormByProgram = new Map<string, ApplicationFormRow>()
    const latestFormByEdition = new Map<string, ApplicationFormRow>()
    for (const f of forms) {
      if (f.edition_id) {
        if (!latestFormByEdition.has(f.edition_id)) {
          latestFormByEdition.set(f.edition_id, f)
        }
        continue
      }
      if (!latestFormByProgram.has(f.program_id)) {
        latestFormByProgram.set(f.program_id, f)
      }
    }

    const now = new Date()
    const vm: ProgramCardVM[] = programs.map((p) => {
      const edition =
        latestOpenEditionByProgram.get(p.id) ??
        latestEditionByProgram.get(p.id) ??
        null
      const editionForm = edition
        ? (latestFormByEdition.get(edition.id) ?? null)
        : null
      const form = editionForm ?? latestFormByProgram.get(p.id) ?? null

      // Si no está publicado: lo tratamos como "soon"
      if (!p.is_published) {
        return { ...p, edition, form, status: 'soon' }
      }

      const editionOpen = edition ? edition.is_open : true
      const formOpen = form ? isFormOpen(form, now) : false
      const open = editionOpen && formOpen

      // Si está publicado pero no cumple condiciones -> cerrado
      return { ...p, edition, form, status: open ? 'open' : 'closed' }
    })

    setItems(vm)
    setLoading(false)
  }

  const helpTitle = useMemo<string>(
    () => '¿Tienes dudas sobre los programas?',
    []
  )
  const helpBody = useMemo<string>(
    () => 'Revisa nuestras preguntas frecuentes o contáctanos por soporte.',
    []
  )
  async function goToPostulationOrRedirect(programSlug: string): Promise<void> {
    // Asegura sesión lista (por si el usuario cae directo aquí)
    if (!userId) {
      toast.showError('Inicia sesión para postular.')
      router.push('/ingresar')
      return
    }

    if (!profile) {
      toast.showError('Primero completa tu perfil para postular.')
      router.push('/plataforma/talento/perfil')
      return
    }

    // Si tu enum se llama distinto, ajusta aquí el string
    if (profile.profile_status !== 'profile_complete') {
      toast.showError('Completa tu perfil antes de postular.')
      router.push('/plataforma/talento/perfil')
      return
    }

    router.push(`/plataforma/talento/programas/${programSlug}/postular`)
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-black px-6 py-8">
        <Card className="bg-black border-white/10 text-amber-50">
          <CardHeader>
            <CardTitle>Cargando programas…</CardTitle>
            <CardDescription className="text-white/60">
              Preparando la lista.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-black px-6 py-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-amber-50">Programas</h1>
          <p className="text-sm text-white/60">
            Elige un programa para ver detalles o iniciar tu postulación.
          </p>
        </div>

        <Separator className="bg-white/10" />

        {items.length === 0 ? (
          <Card className="bg-black border-white/10 text-amber-50">
            <CardHeader>
              <CardTitle>No hay programas</CardTitle>
              <CardDescription className="text-white/60">
                Creá un programa desde el panel admin.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {items.map((p) => {
              const iconKind = pickProgramIcon(p.slug)
              const isOpen = p.status === 'open'
              const isClosed = p.status === 'closed'

              const badge = isOpen ? (
                <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {statusLabel(p.status)}
                </Badge>
              ) : isClosed ? (
                <Badge className="bg-white/5 text-white/70 border border-white/10 gap-2">
                  <Lock className="h-3.5 w-3.5" />
                  {statusLabel(p.status)}
                </Badge>
              ) : (
                <Badge className="bg-white/5 text-white/70 border border-white/10">
                  {statusLabel(p.status)}
                </Badge>
              )

              const editionLine = p.edition?.edition_name?.trim()
                ? p.edition.edition_name
                : null

              const startLine = p.edition?.starts_at
                ? parseIsoDateOnlyToDM(p.edition.starts_at)
                : ''
              const startText = startLine ? `Inicio: ${startLine}` : ''

              const action = isOpen ? (
                <Button
                  className="w-full bg-[#00CCA4] text-black hover:bg-[#00CCA4]/90"
                  onClick={() => void goToPostulationOrRedirect(p.slug)}
                >
                  <span className="flex-1 text-center">
                    INICIAR POSTULACIÓN
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : isClosed ? (
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-white/10 bg-transparent text-white/80 hover:bg-white/5"
                >
                  <Link
                    href={`/programas/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-between"
                  >
                    <span className="flex-1 text-center">
                      VER DETALLES DEL PROGRAMA
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-white/10 bg-transparent text-white/60"
                  disabled
                >
                  <span className="flex-1 text-center">
                    UNIRME A LA LISTA DE ESPERA
                  </span>
                </Button>
              )

              return (
                <Card
                  key={p.id}
                  className={[
                    'relative overflow-hidden bg-black border text-amber-50 rounded-2xl',
                    isOpen
                      ? [
                          // borde base + glow suave
                          'border-emerald-500/40',
                          'shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_0_28px_rgba(16,185,129,0.12)]',
                        ].join(' ')
                      : 'border-white/10',
                  ].join(' ')}
                >
                  {/* Frosted border overlay (verde + amarillo) SOLO abierto */}
                  {isOpen ? (
                    <>
                      {/* “esmerilado” general */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-amber-400/10" />
                      {/* línea superior como highlight */}
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-400/70 via-amber-300/70 to-emerald-400/70" />
                      {/* borde “doble” sutil para que se vea más premium */}
                      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-emerald-400/20" />
                      <div className="pointer-events-none absolute inset-[1px] rounded-2xl ring-1 ring-amber-300/10" />
                    </>
                  ) : null}

                  <CardHeader className="space-y-3 relative">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={[
                          'h-16 w-16 rounded-lg flex items-center justify-center border',
                          isOpen
                            ? [
                                // contenedor esmerilado cuando abierto
                                'bg-gradient-to-br from-emerald-500/18 via-black/20 to-amber-400/18',
                                'border-amber-300/20',
                                'shadow-[0_0_18px_rgba(251,191,36,0.10)]',
                              ].join(' ')
                            : 'bg-black-500/15 border-white/10',
                        ].join(' ')}
                      >
                        {iconKind === 'rocket' ? (
                          <Rocket
                            className={[
                              'h-5 w-5',
                              // icono amarillo cuando abierto
                              isOpen ? 'text-amber-300' : 'text-emerald-300',
                            ].join(' ')}
                          />
                        ) : (
                          <Users
                            className={[
                              'h-5 w-5',
                              isOpen ? 'text-amber-300' : 'text-[#9CA3AF]',
                            ].join(' ')}
                          />
                        )}
                      </div>

                      <div className="pt-1 relative">{badge}</div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 relative">
                    <div className="space-y-2 text-sm text-white/70">
                      <div className="flex items-center gap-3">
                        <div className="space-y-0.5">
                          <CardTitle className="text-xl">{p.title}</CardTitle>
                          <CardDescription className="text-white/60">
                            {p.description ?? '—'}
                          </CardDescription>
                        </div>
                      </div>
                      {editionLine ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              'h-1.5 w-1.5 rounded-full',
                              isOpen ? 'bg-amber-300/80' : 'bg-emerald-300/80',
                            ].join(' ')}
                          />
                          <span className="font-medium text-white/80">
                            {editionLine}
                          </span>
                          {startText ? (
                            <span className="text-white/60">· {startText}</span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                          <span className="text-white/60">Sin edición</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-white/50" />
                        <span className="text-white/60">
                          {p.requires_payment_pre
                            ? 'Simulación Laboral Guiada'
                            : 'Networking especializado'}
                        </span>
                      </div>

                      <Link
                        href={`/programas/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-white/70 hover:text-white"
                      >
                        <ArrowRight className="h-4 w-4 rotate-[-45deg]" />
                        <span className="underline underline-offset-4">
                          Ver detalles del programa
                        </span>
                      </Link>
                    </div>

                    {action}
                  </CardContent>

                  {/* Glow lateral extra (verde+amarillo) solo abierto */}
                  {isOpen ? (
                    <div className="pointer-events-none absolute -right-16 -top-10 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />
                  ) : null}
                </Card>
              )
            })}
          </div>
        )}

        {/* Help bar (abajo como en la imagen) */}
        <Card className="bg-black border-white/10 text-amber-50">
          <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-9 w-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-emerald-300" />
              </div>
              <div className="space-y-0.5">
                <div className="font-medium">{helpTitle}</div>
                <div className="text-sm text-white/60">{helpBody}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <Button
                asChild
                variant="outline"
                className="border-white/10 bg-transparent text-white/80 hover:bg-white/5"
              >
                <Link href="/plataforma/ayuda">Centro de ayuda</Link>
              </Button>
              <Button
                asChild
                className="bg-emerald-500/15 text-emerald-200 border border-emerald-500/30 hover:bg-emerald-500/20"
              >
                <Link href="/plataforma/mentor">Habla con un mentor</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="h-2" />
      </div>
    </div>
  )
}
