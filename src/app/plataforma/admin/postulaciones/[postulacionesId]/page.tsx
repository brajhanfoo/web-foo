'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  Linkedin,
  MapPin,
  MessageCircle,
  Phone,
  UserCircle2,
} from 'lucide-react'

/* ----------------------------- Types (strict) ----------------------------- */

type ApplicationStatus =
  | 'received'
  | 'admitted'
  | 'payment_pending'
  | 'enrolled'
  | 'rejected'

type ProgramSummary = {
  id: string
  title: string | null
  slug: string | null
}

type EditionSummary = {
  id: string
  // OJO: en tu schema es edition_name (no "title")
  edition_name: string | null
}

type ApplicantProfileSummary = {
  id: string
  first_name: string | null
  last_name: string | null
  country_residence: string | null
  whatsapp_e164: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  english_level: string | null
  role: string | null
}

type ParsedAnswers = Record<string, unknown>

type ApplicationBase = {
  id: string
  applicant_profile_id: string
  program_id: string
  edition_id: string | null
  status: ApplicationStatus
  applied_role: string | null
  cv_url: string | null
  answers: ParsedAnswers
  created_at: string
  updated_at: string
  form_id: string | null
}

type ApplicationRow = ApplicationBase & {
  program?: ProgramSummary | null
  edition?: EditionSummary | null
  applicant_profile?: ApplicantProfileSummary | null
}

type StatusStep = {
  index: number
  key: 'received' | 'admitted' | 'payment_pending' | 'enrolled'
  label: string
}

const STATUS_STEPS: StatusStep[] = [
  { index: 1, key: 'received', label: 'Recibido' },
  { index: 2, key: 'admitted', label: 'Admitido' },
  { index: 3, key: 'payment_pending', label: 'Pago pendiente' },
  { index: 4, key: 'enrolled', label: 'Matriculado' },
]

/* ----------------------------- Helpers (safe) ----------------------------- */

function getStringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function getBooleanValue(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function formatDateTimeIsoLike(timestamp: string): string {
  const normalized = timestamp.replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return timestamp
  return date.toLocaleString()
}

function buildWhatsAppLink(whatsappE164: string): string {
  const digits = whatsappE164.replace(/[^\d]/g, '')
  return `https://wa.me/${digits}`
}

function statusToStepIndex(status: ApplicationStatus): number {
  if (status === 'received') return 1
  if (status === 'admitted') return 2
  if (status === 'payment_pending') return 3
  if (status === 'enrolled') return 4
  return 1
}

function statusBadgeLabel(status: ApplicationStatus): string {
  if (status === 'received') return 'Recibida'
  if (status === 'admitted') return 'Admitida'
  if (status === 'payment_pending') return 'Pago pendiente'
  if (status === 'enrolled') return 'Matriculada'
  if (status === 'rejected') return 'Rechazada'
  return status
}

function buildFullName(profile: ApplicantProfileSummary | null): string | null {
  if (!profile) return null
  const parts = [profile.first_name ?? '', profile.last_name ?? '']
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.length ? parts.join(' ') : null
}

function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return (
    value === 'received' ||
    value === 'admitted' ||
    value === 'payment_pending' ||
    value === 'enrolled' ||
    value === 'rejected'
  )
}

function normalizeParam(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return null
}

/* --------------------------------- UI --------------------------------- */

export default function ApplicationDetailClient() {
  const router = useRouter()
  const rawParams = useParams() as Record<string, string | string[] | undefined>

  const postulacionId = useMemo(() => {
    return normalizeParam(rawParams?.postulacionesId)
  }, [rawParams?.postulacionesId])

  const { showError, showSuccess } = useToastEnhanced()

  const [isLoading, setIsLoading] = useState(true)
  const [application, setApplication] = useState<ApplicationRow | null>(null)

  const [isAdmitLoading, setIsAdmitLoading] = useState(false)
  const [isEnrollLoading, setIsEnrollLoading] = useState(false)
  const [paymentLink, setPaymentLink] = useState<string>('')

  const [debugBox, setDebugBox] = useState<{
    phase: string
    message: string
    details?: any
  } | null>(null)

  const parsedAnswers = useMemo<ParsedAnswers>(() => {
    return application?.answers ?? {}
  }, [application?.answers])

  const appliedRoleFromAnswers =
    getStringValue(parsedAnswers['rol_postulado']) ??
    application?.applied_role ??
    null

  const motivationText =
    getStringValue(parsedAnswers['motivacion']) ??
    getStringValue(parsedAnswers['mativacion']) ??
    null

  const experienceText = getStringValue(parsedAnswers['experiencia'])
  const technologiesText = getStringValue(parsedAnswers['tecnologias'])

  const shiftMorning = getBooleanValue(parsedAnswers['turno_maniana'])
  const shiftAfternoon = getBooleanValue(parsedAnswers['turno_tarde'])
  const shiftNight = getBooleanValue(parsedAnswers['turno_noche'])

  const acceptTerms = getBooleanValue(parsedAnswers['acepto_terminos'])
  const acceptAvailability = getBooleanValue(
    parsedAnswers['acepto_disponibilidad']
  )
  const acceptQuorum = getBooleanValue(parsedAnswers['acepto_quorum'])

  const currentStep = statusToStepIndex(application?.status ?? 'received')

  // ✅ Sin ensureSession: si la sesión aún no rehidrató, vas a ver "no data" y el debug te lo deja claro.
  // Como ya ajustaste RLS/FKs, la data debería volver consistente.
  useEffect(() => {
    let isCancelled = false

    async function run() {
      setDebugBox(null)

      if (!postulacionId) {
        setIsLoading(false)
        setApplication(null)
        setDebugBox({
          phase: 'params',
          message:
            'No se detectó postulacionesId en la URL. Revisá el folder [postulacionesId] y el Link/href que navega acá.',
          details: { rawParams },
        })
        return
      }

      setIsLoading(true)

      try {
        const { data, error } = await supabase
          .from('applications')
          .select(
            `
            id,
            applicant_profile_id,
            program_id,
            edition_id,
            status,
            applied_role,
            cv_url,
            answers,
            created_at,
            updated_at,
            form_id,
            program:programs(id,title,slug),
            edition:program_editions(id,edition_name),
            applicant_profile:profiles(
              id,
              first_name,
              last_name,
              country_residence,
              whatsapp_e164,
              linkedin_url,
              portfolio_url,
              english_level,
              role
            )
          `
          )
          .eq('id', postulacionId)
          .maybeSingle()

        if (isCancelled) return

        if (error) {
          setApplication(null)
          setDebugBox({
            phase: 'applications.embed.select',
            message: error.message,
            details: error,
          })
          try {
            showError('No se pudo cargar la postulación', error.message)
          } catch {}
          return
        }

        if (!data) {
          // Si vuelve null, típicamente: (a) sesión aún no rehidratada en refresh o (b) RLS.
          // Con las RLS nuevas debería ser raro; si pasa, mirá auth.getSession() en consola.
          setApplication(null)
          setDebugBox({
            phase: 'applications.embed.select',
            message:
              'No data (null). Si esto pasa solo al refrescar, suele ser sesión aún no rehidratada o RLS bloqueando.',
            details: { postulacionId },
          })
          try {
            showError(
              'No se encontró la postulación',
              'El registro no existe o no tienes permisos (RLS).'
            )
          } catch {}
          return
        }

        const next: ApplicationRow = {
          id: String(data.id),
          applicant_profile_id: String(data.applicant_profile_id),
          program_id: String(data.program_id),
          edition_id: data.edition_id ? String(data.edition_id) : null,
          status: isApplicationStatus(data.status) ? data.status : 'received',
          applied_role: data.applied_role ?? null,
          cv_url: data.cv_url ?? null,
          answers: (data.answers ?? {}) as ParsedAnswers,
          created_at: String(data.created_at),
          updated_at: String(data.updated_at),
          form_id: data.form_id ? String(data.form_id) : null,
          program: data.program
            ? {
                id: String((data.program as any).id),
                title: (data.program as any).title ?? null,
                slug: (data.program as any).slug ?? null,
              }
            : null,
          edition: data.edition
            ? {
                id: String((data.edition as any).id),
                edition_name: (data.edition as any).edition_name ?? null,
              }
            : null,
          applicant_profile: data.applicant_profile
            ? {
                id: String((data.applicant_profile as any).id),
                first_name: (data.applicant_profile as any).first_name ?? null,
                last_name: (data.applicant_profile as any).last_name ?? null,
                country_residence:
                  (data.applicant_profile as any).country_residence ?? null,
                whatsapp_e164:
                  (data.applicant_profile as any).whatsapp_e164 ?? null,
                linkedin_url:
                  (data.applicant_profile as any).linkedin_url ?? null,
                portfolio_url:
                  (data.applicant_profile as any).portfolio_url ?? null,
                english_level:
                  (data.applicant_profile as any).english_level ?? null,
                role: (data.applicant_profile as any).role ?? null,
              }
            : null,
        }

        setApplication(next)
      } catch (e: any) {
        setApplication(null)
        setDebugBox({
          phase: 'catch',
          message: e?.message ?? 'Unknown error',
          details: e,
        })
        try {
          showError('Error inesperado', e?.message ?? 'Unknown error')
        } catch {}
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    void run()
    return () => {
      isCancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postulacionId])

  async function updateApplicationStatus(nextStatus: ApplicationStatus) {
    if (!application?.id) return

    const { error } = await supabase
      .from('applications')
      .update({ status: nextStatus })
      .eq('id', application.id)

    if (error) {
      try {
        showError('No se pudo actualizar el estado', error.message)
      } catch {}
      setDebugBox({
        phase: 'applications.update',
        message: error.message,
        details: error,
      })
      return
    }

    setApplication((previous) =>
      previous ? { ...previous, status: nextStatus } : previous
    )

    try {
      showSuccess(
        'Estado actualizado',
        `La postulación ahora está: ${statusBadgeLabel(nextStatus)}.`
      )
    } catch {}

    router.refresh()
  }

  async function handleAdmit() {
    if (!application) return
    setIsAdmitLoading(true)
    try {
      await updateApplicationStatus('admitted')
    } finally {
      setIsAdmitLoading(false)
    }
  }

  async function handleConfirmEnrollment() {
    if (!application) return
    setIsEnrollLoading(true)
    try {
      await updateApplicationStatus('enrolled')
    } finally {
      setIsEnrollLoading(false)
    }
  }

  const applicant = application?.applicant_profile ?? null
  const applicantFullName = buildFullName(applicant) ?? 'Postulante'

  const headerTitle = application?.program?.title ?? 'Postulación'
  const headerSubtitle = `Estado: ${statusBadgeLabel(
    application?.status ?? 'received'
  )}`

  return (
    <div className="w-full">
      {/* DEBUG BOX */}
      {debugBox ? (
        <div className="mb-4 rounded-md border p-3 text-sm">
          <div className="font-semibold">Debug</div>
          <div className="text-muted-foreground">Fase: {debugBox.phase}</div>
          <div className="mt-1 break-words">{debugBox.message}</div>
          <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
            {JSON.stringify(debugBox.details ?? {}, null, 2)}
          </pre>
        </div>
      ) : null}

      <div className="mb-6">
        <Stepper currentStep={currentStep} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* LEFT */}
        <div className="lg:col-span-3">
          <Card className="bg-card/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <UserCircle2 className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {applicantFullName}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {applicant?.whatsapp_e164 ??
                      application?.applicant_profile_id ??
                      '—'}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {applicant?.whatsapp_e164 ? (
                  <Button
                    asChild
                    size="sm"
                    variant="secondary"
                    className="gap-2"
                  >
                    <a
                      href={buildWhatsAppLink(applicant.whatsapp_e164)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                ) : null}

                {application?.cv_url ? (
                  <Button
                    asChild
                    size="sm"
                    variant="secondary"
                    className="gap-2"
                  >
                    <a
                      href={application.cv_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileText className="h-4 w-4" />
                      CV
                    </a>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    CV
                  </Button>
                )}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                {appliedRoleFromAnswers ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Rol postulado</span>
                    <Badge variant="secondary" className="truncate max-w-[60%]">
                      {appliedRoleFromAnswers}
                    </Badge>
                  </div>
                ) : null}

                {applicant?.english_level ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Inglés</span>
                    <Badge variant="outline">{applicant.english_level}</Badge>
                  </div>
                ) : null}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                {applicant?.country_residence ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-foreground">
                      {applicant.country_residence}
                    </span>
                  </div>
                ) : null}

                {applicant?.whatsapp_e164 ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="text-foreground">
                      {applicant.whatsapp_e164}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {applicant?.linkedin_url ? (
                  <Button asChild size="sm" variant="outline" className="gap-2">
                    <a
                      href={applicant.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                      <ExternalLink className="h-3 w-3 opacity-70" />
                    </a>
                  </Button>
                ) : null}

                {applicant?.portfolio_url ? (
                  <Button asChild size="sm" variant="outline" className="gap-2">
                    <a
                      href={applicant.portfolio_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Portafolio
                    </a>
                  </Button>
                ) : null}
              </div>

              <Separator />

              <div className="text-xs text-muted-foreground">
                Creada:{' '}
                <span className="text-foreground">
                  {application
                    ? formatDateTimeIsoLike(application.created_at)
                    : '—'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MIDDLE */}
        <div className="lg:col-span-6">
          <Card className="bg-card/60">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate">{headerTitle}</CardTitle>
                  <div className="text-xs text-muted-foreground mt-1">
                    {headerSubtitle}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {application?.status ?? '—'}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="text-sm text-muted-foreground">
                  Cargando ficha…
                </div>
              ) : application ? (
                <>
                  <Section
                    title="Datos de postulación"
                    items={[
                      {
                        label: 'Programa',
                        value:
                          application.program?.title ?? application.program_id,
                      },
                      {
                        label: 'Edición',
                        value:
                          application.edition?.edition_name ??
                          application.edition_id ??
                          '—',
                      },
                      {
                        label: 'Rol aplicado',
                        value:
                          application.applied_role ??
                          appliedRoleFromAnswers ??
                          '—',
                      },
                    ]}
                  />

                  <Separator />

                  <Section
                    title="Experiencia práctica en el rol"
                    description={experienceText ?? '—'}
                  />

                  <Separator />

                  <Section
                    title="Tecnologías y herramientas"
                    description={technologiesText ?? '—'}
                  />

                  <Separator />

                  <Section
                    title="Objetivo / motivación"
                    description={motivationText ?? '—'}
                  />

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Disponibilidad</div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={shiftMorning ? 'secondary' : 'outline'}>
                        Mañana
                      </Badge>
                      <Badge variant={shiftAfternoon ? 'secondary' : 'outline'}>
                        Tarde
                      </Badge>
                      <Badge variant={shiftNight ? 'secondary' : 'outline'}>
                        Noche
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Aceptaciones</div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      <MiniCheck label="Términos" value={acceptTerms} />
                      <MiniCheck
                        label="Disponibilidad"
                        value={acceptAvailability}
                      />
                      <MiniCheck label="Quórum" value={acceptQuorum} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No se pudo cargar la postulación.
                  <div className="mt-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/plataforma/admin/postulaciones">Volver</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-3">
          <Card className="bg-card/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Panel de operaciones</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold">Fase 1: Admisión</div>
                  <Badge variant="outline">
                    {application?.status === 'admitted' ||
                    application?.status === 'payment_pending' ||
                    application?.status === 'enrolled'
                      ? 'OK'
                      : 'Pendiente'}
                  </Badge>
                </div>

                <div className="mt-3">
                  <Button
                    className="w-full"
                    onClick={handleAdmit}
                    disabled={
                      !application ||
                      isAdmitLoading ||
                      application.status !== 'received'
                    }
                  >
                    {isAdmitLoading ? 'Admitiendo…' : 'Admitir'}
                  </Button>

                  <div className="mt-2 text-xs text-muted-foreground">
                    Se habilita cuando el estado está en{' '}
                    <span className="text-foreground">received</span>.
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold">Fase 2: Matrícula</div>
                  <Badge variant="outline">
                    {application?.status === 'enrolled' ? 'OK' : 'Pendiente'}
                  </Badge>
                </div>

                <div className="mt-3 space-y-3">
                  <div className="space-y-2">
                    <Label
                      htmlFor="payment_link"
                      className="text-xs text-muted-foreground"
                    >
                      Link de pago (opcional)
                    </Label>
                    <Input
                      id="payment_link"
                      value={paymentLink}
                      onChange={(event) => setPaymentLink(event.target.value)}
                      placeholder="https://…"
                    />
                    <div className="text-xs text-muted-foreground">
                      (Luego lo conectamos con Payphone/Stripe y guardamos esto
                      en BD.)
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    variant={
                      application?.status === 'enrolled'
                        ? 'secondary'
                        : 'default'
                    }
                    onClick={handleConfirmEnrollment}
                    disabled={
                      !application ||
                      isEnrollLoading ||
                      !(
                        application.status === 'admitted' ||
                        application.status === 'payment_pending'
                      )
                    }
                  >
                    {isEnrollLoading ? 'Confirmando…' : 'Confirmar matrícula'}
                  </Button>

                  <div className="text-xs text-muted-foreground">
                    Se habilita cuando el estado está en{' '}
                    <span className="text-foreground">admitted</span> o{' '}
                    <span className="text-foreground">payment_pending</span>.
                  </div>
                </div>
              </div>

              <Separator />

              <div className="text-xs text-muted-foreground">
                ID:{' '}
                <span className="text-foreground break-all">
                  {application?.id ?? '—'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

/* -------------------------- Small presentational -------------------------- */

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-4 md:gap-8">
        {STATUS_STEPS.map((step) => {
          const isDone = currentStep > step.index
          const isActive = currentStep === step.index

          return (
            <div key={step.key} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 " />
                ) : isActive ? (
                  <div className="h-5 w-5 rounded-full border flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-foreground" />
                  </div>
                ) : (
                  <Circle className="h-5 w-5 opacity-40 text-green-400" />
                )}

                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] text-muted-foreground">
                    {step.index}.
                  </span>
                  <span
                    className={`text-xs ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>

              {step.index !== STATUS_STEPS.length ? (
                <div className="hidden md:block w-10 h-px bg-border" />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Section({
  title,
  description,
  items,
}: {
  title: string
  description?: string
  items?: { label: string; value: string }[]
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">{title}</div>

      {items?.length ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {items.map((item) => (
            <div key={item.label} className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="text-sm mt-1 break-words">{item.value}</div>
            </div>
          ))}
        </div>
      ) : null}

      {description ? (
        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
          {description}
        </div>
      ) : null}
    </div>
  )
}

function MiniCheck({ label, value }: { label: string; value: boolean | null }) {
  const isAccepted = value === true
  const isUnknown = value === null

  return (
    <div className="rounded-md border p-3 flex items-center justify-between">
      <span className="text-sm">{label}</span>
      {isUnknown ? (
        <Badge variant="outline">—</Badge>
      ) : isAccepted ? (
        <Badge variant="secondary">Sí</Badge>
      ) : (
        <Badge variant="outline">No</Badge>
      )}
    </div>
  )
}
