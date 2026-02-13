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
  CreditCard,
} from 'lucide-react'
import { PayphoneCheckoutModal } from '@/components/payments/payphone-checkout-modal'
import type { ApplicationFormRow } from '@/types/program-editions'
import type {
  EditionRow,
  ProgramPaymentMode,
  ProgramRow,
  ProgramStatus,
} from '@/types/programs'

type PaymentRow = {
  id: string
  program_id: string
  edition_id: string | null
  status: 'initiated' | 'pending' | 'paid' | 'failed' | 'canceled'
  purpose: 'pre_enrollment' | 'tuition'
}

type ApplicationRow = {
  program_id: string
  edition_id: string | null
}

type ProgramCardVM = ProgramRow & {
  edition: EditionRow | null
  form: ApplicationFormRow | null
  status: ProgramStatus
}

function safeString(value: unknown): string {
  if (typeof value === 'string') return value
  return ''
}

function resolvePaymentMode(program: ProgramRow): ProgramPaymentMode {
  if (program.payment_mode) return program.payment_mode
  return program.requires_payment_pre ? 'pre' : 'none'
}

function paymentKey(programId: string, editionId: string | null): string {
  return `${programId}:${editionId ?? 'none'}`
}

function parsePriceToCents(priceUsd: string | number | null): number | null {
  if (priceUsd === null || priceUsd === undefined) return null
  const parsed = Number(priceUsd)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed * 100)
}

const USD_FORMATTER = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'code',
  maximumFractionDigits: 2,
})

const DATE_FORMATTER = new Intl.DateTimeFormat('es-EC', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatUsd(priceUsd: string | number | null): string | null {
  if (priceUsd === null || priceUsd === undefined) return null
  const parsed = Number(priceUsd)
  if (!Number.isFinite(parsed)) return null
  if (parsed <= 0) return 'Gratis'
  return USD_FORMATTER.format(parsed)
}

function parseIsoDateOnlyToDM(value: string): string {
  // Espera "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ssZ"
  const s = value.trim()
  if (!s) return ''
  const d = s.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return ''
  const date = new Date(`${d}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return ''
  return DATE_FORMATTER.format(date)
}

function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const dateOnly = trimmed.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null
  return dateOnly
}

function getTodayDateOnly(now: Date): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
  const [paidPreMap, setPaidPreMap] = useState<Record<string, boolean>>({})
  const [appliedMap, setAppliedMap] = useState<Record<string, boolean>>({})
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutProgram, setCheckoutProgram] = useState<ProgramCardVM | null>(
    null
  )

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

  useEffect(() => {
    if (!userId) {
      setPaidPreMap({})
      return
    }
    if (!items.length) {
      setPaidPreMap({})
      return
    }
    void loadPaidPrePayments(items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, items])
  useEffect(() => {
    if (!userId) {
      setAppliedMap({})
      return
    }
    if (!items.length) {
      setAppliedMap({})
      return
    }
    void loadAppliedPrograms(items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, items])

  async function loadAll(): Promise<void> {
    setLoading(true)

    const programsResponse = await supabase
      .from('programs')
      .select(
        'id, slug, title, description, is_published, payment_mode, requires_payment_pre, price_usd, created_at'
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
    const now = new Date()
    const todayDate = getTodayDateOnly(now)

    // mejor edición por programa (prioridad: ends_at vigente, luego latest)
    const latestEditionByProgram = new Map<string, EditionRow>()
    const bestEditionByProgram = new Map<string, EditionRow>()
    for (const ed of editions) {
      if (!latestEditionByProgram.has(ed.program_id)) {
        latestEditionByProgram.set(ed.program_id, ed)
      }
      const endsAtDate = toDateOnly(ed.ends_at)
      if (
        endsAtDate &&
        todayDate <= endsAtDate &&
        !bestEditionByProgram.has(ed.program_id)
      ) {
        bestEditionByProgram.set(ed.program_id, ed)
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
    const vm: ProgramCardVM[] = programs.map((p) => {
      const edition =
        bestEditionByProgram.get(p.id) ??
        latestEditionByProgram.get(p.id) ??
        null
      const editionForm = edition
        ? (latestFormByEdition.get(edition.id) ?? null)
        : null
      const form = editionForm ?? latestFormByProgram.get(p.id) ?? null

      const startsAtDate = edition ? toDateOnly(edition.starts_at) : null
      const endsAtDate = edition ? toDateOnly(edition.ends_at) : null
      const hasEnded = Boolean(endsAtDate && todayDate > endsAtDate)
      const startsAllowed = !startsAtDate || todayDate <= startsAtDate

      const editionOpen = edition ? edition.is_open && startsAllowed : false
      const formOpen = form ? isFormOpen(form, now) : false
      const open = Boolean(edition) && !hasEnded && editionOpen && formOpen

      // Si no cumple condiciones -> cerrado
      return { ...p, edition, form, status: open ? 'open' : 'closed' }
    })

    setItems(vm)
    setLoading(false)
  }

  async function loadPaidPrePayments(programs: ProgramCardVM[]): Promise<void> {
    const prePrograms = programs.filter((p) => resolvePaymentMode(p) === 'pre')
    if (!prePrograms.length || !userId) {
      setPaidPreMap({})
      return
    }

    const programIds = prePrograms.map((p) => p.id)

    const { data, error } = await supabase
      .from('payments')
      .select('id, program_id, edition_id, status, purpose')
      .eq('user_id', userId)
      .in('program_id', programIds)
      .eq('purpose', 'pre_enrollment')
      .eq('status', 'paid')

    if (error) {
      toast.showError('No se pudieron cargar tus pagos.')
      setPaidPreMap({})
      return
    }

    const rows = (data ?? []) as PaymentRow[]
    const nextMap: Record<string, boolean> = {}
    for (const row of rows) {
      nextMap[paymentKey(row.program_id, row.edition_id ?? null)] = true
    }
    setPaidPreMap(nextMap)
  }
  async function loadAppliedPrograms(programs: ProgramCardVM[]): Promise<void> {
    if (!userId) {
      setAppliedMap({})
      return
    }

    const programIds = programs.map((p) => p.id)

    const { data, error } = await supabase
      .from('applications')
      .select('program_id, edition_id')
      .eq('applicant_profile_id', userId)
      .in('program_id', programIds)

    if (error) {
      toast.showError('No se pudieron cargar tus postulaciones.')
      setAppliedMap({})
      return
    }

    const rows = (data ?? []) as ApplicationRow[]
    const nextMap: Record<string, boolean> = {}

    for (const row of rows) {
      nextMap[paymentKey(row.program_id, row.edition_id ?? null)] = true
    }

    setAppliedMap(nextMap)
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

    router.push(`/plataforma/talento/explorar/${programSlug}/postular`)
  }

  function hasPaidPre(programId: string, editionId: string | null): boolean {
    const exact = paymentKey(programId, editionId)
    if (paidPreMap[exact]) return true
    const fallback = paymentKey(programId, null)
    return Boolean(paidPreMap[fallback])
  }

  function hasApplied(programId: string, editionId: string | null): boolean {
    const exact = paymentKey(programId, editionId)
    if (appliedMap[exact]) return true
    const fallback = paymentKey(programId, null)
    return Boolean(appliedMap[fallback])
  }
  function openCheckoutFor(program: ProgramCardVM): void {
    if (!userId) {
      toast.showError('Inicia sesión para pagar.')
      router.push('/ingresar')
      return
    }

    const amountCents = parsePriceToCents(program.price_usd)
    if (!amountCents || amountCents <= 0) {
      toast.showError('Este programa no tiene un precio configurado.')
      return
    }

    setCheckoutProgram(program)
    setCheckoutOpen(true)
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

  const todayDate = getTodayDateOnly(new Date())

  return (
    <div className="min-h-dvh bg-black px-6 py-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-amber-50 text-balance">
            Programas
          </h1>
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
              const paymentMode = resolvePaymentMode(p)
              const priceLabel = formatUsd(p.price_usd)
              const paidPre = hasPaidPre(p.id, p.edition?.id ?? null)
              const applied = hasApplied(p.id, p.edition?.id ?? null)
              const endsAtDate = p.edition
                ? toDateOnly(p.edition.ends_at)
                : null
              const hasEnded = Boolean(endsAtDate && todayDate > endsAtDate)
              const hasEdition = Boolean(p.edition)
              const isOpen = p.status === 'open' && !hasEnded
              const badgeStatus: ProgramStatus = isOpen ? 'open' : 'closed'
              const canShowApplied = applied && hasEdition && !hasEnded

              const badge = isOpen ? (
                <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {statusLabel(badgeStatus)}
                </Badge>
              ) : (
                <Badge className="bg-white/5 text-white/70 border border-white/10 gap-2">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  {statusLabel(badgeStatus)}
                </Badge>
              )

              const editionLine = p.edition?.edition_name?.trim()
                ? p.edition.edition_name
                : null

              const startLine = p.edition?.starts_at
                ? parseIsoDateOnlyToDM(p.edition.starts_at)
                : ''
              const endLine = p.edition?.ends_at
                ? parseIsoDateOnlyToDM(p.edition.ends_at)
                : ''
              const startText = startLine ? `Inicio: ${startLine}` : ''
              const endText = endLine ? `Fin: ${endLine}` : ''
              const rangeText =
                startText && endText
                  ? `${startText} · ${endText}`
                  : startText || endText

              const action = isOpen ? (
                paymentMode === 'pre' && !paidPre ? (
                  <Button
                    className="w-full bg-[#BDBE0B] text-black hover:bg-[#BDBE0B]/90 cursor-pointer"
                    onClick={() => openCheckoutFor(p)}
                  >
                    <span className="flex-1 text-center">
                      PAGAR E INSCRIBIRME
                    </span>
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-[#00CCA4] text-black hover:bg-[#00CCA4]/90 cursor-pointer"
                    onClick={() => void goToPostulationOrRedirect(p.slug)}
                  >
                    <span className="flex-1 text-center">
                      INICIAR POSTULACIÓN
                    </span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )
              ) : null

              const appliedAction = (
                <Button
                  className="w-full bg-white/10 text-white hover:bg-white/20"
                  asChild
                >
                  <Link
                    href="/plataforma/talento/mis-postulaciones"
                    className="flex w-full items-center justify-between"
                  >
                    <span className="flex-1 text-center">
                      VER EN MIS POSTULACIONES
                    </span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              )
              const primaryAction = canShowApplied ? appliedAction : action

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
                              isOpen ? 'text-[#BDBE0B]' : 'text-emerald-300',
                            ].join(' ')}
                            aria-hidden="true"
                          />
                        ) : (
                          <Users
                            className={[
                              'h-5 w-5',
                              isOpen ? 'text-[#BDBE0B]' : 'text-[#9CA3AF]',
                            ].join(' ')}
                            aria-hidden="true"
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
                          {rangeText ? (
                            <span className="text-white/60">· {rangeText}</span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                          <span className="text-white/60">Sin edición</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Calendar
                          className="h-4 w-4 text-white/50"
                          aria-hidden="true"
                        />
                        <span className="text-white/60">
                          {paymentMode === 'pre'
                            ? 'Pago previo requerido'
                            : paymentMode === 'post'
                              ? 'Pago posterior'
                              : 'Sin pago'}
                        </span>
                      </div>

                      {priceLabel ? (
                        <div className="flex items-center gap-2">
                          <CreditCard
                            className="h-4 w-4 text-white/50"
                            aria-hidden="true"
                          />
                          <span className="text-white/60">{priceLabel}</span>
                        </div>
                      ) : null}

                      <Link
                        href={`/programas/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-white/70 hover:text-white"
                      >
                        <ArrowRight
                          className="h-4 w-4 rotate-[-45deg]"
                          aria-hidden="true"
                        />
                        <span className="underline underline-offset-4">
                          Ver detalles del programa
                        </span>
                      </Link>
                    </div>

                    {primaryAction}
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

        {checkoutProgram ? (
          <PayphoneCheckoutModal
            open={checkoutOpen}
            onOpenChange={(open) => {
              if (!open) setCheckoutOpen(false)
            }}
            programId={checkoutProgram.id}
            editionId={checkoutProgram.edition?.id ?? null}
            purpose="pre_enrollment"
            amountCents={parsePriceToCents(checkoutProgram.price_usd) ?? 0}
            onPaid={() => {
              const key = paymentKey(
                checkoutProgram.id,
                checkoutProgram.edition?.id ?? null
              )
              setPaidPreMap((previous) => ({ ...previous, [key]: true }))
              setCheckoutOpen(false)
              void goToPostulationOrRedirect(checkoutProgram.slug)
            }}
          />
        ) : null}

        {/* Help bar (abajo como en la imagen) */}
        <Card className="bg-black border-white/10 text-amber-50">
          <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-9 w-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <HelpCircle
                  className="h-5 w-5 text-emerald-300"
                  aria-hidden="true"
                />
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
                className="border-white/10 bg-transparent text-white/80 hover:bg-white/5 hover:text-white"
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
