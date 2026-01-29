'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-stores'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'

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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Lock,
  Send,
} from 'lucide-react'

type ProgramRow = {
  id: string
  slug: string
  title: string
  description: string | null
  is_published: boolean
  requires_payment_pre: boolean
}

type ApplicationFormRow = {
  id: string
  program_id: string
  version: string
  schema_json: unknown
  is_active: boolean
  opens_at: string | null
  closes_at: string | null
  created_at: string
}

type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'date'

type FormField = {
  id: string
  type: FieldType
  label: string
  name: string
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
}

type FormSchema = {
  version: string
  title: string
  description?: string
  fields: FormField[]
}

function safeString(value: unknown): string {
  if (typeof value === 'string') return value
  return ''
}

function isFormOpen(form: ApplicationFormRow, now: Date): boolean {
  if (!form.is_active) return false
  const opensAt = form.opens_at ? new Date(form.opens_at) : null
  const closesAt = form.closes_at ? new Date(form.closes_at) : null
  if (opensAt && now < opensAt) return false
  if (closesAt && now > closesAt) return false
  return true
}

function parseSchema(schema: unknown): FormSchema | null {
  if (!schema || typeof schema !== 'object') return null
  const s = schema as any
  if (!s.title || !Array.isArray(s.fields)) return null
  return {
    version: typeof s.version === 'string' ? s.version : 'v1',
    title: String(s.title),
    description: typeof s.description === 'string' ? s.description : undefined,
    fields: s.fields as FormField[],
  }
}

// ---- roles “cards” como tu imagen
const ROLE_OPTIONS = [
  { key: 'ux_ui', title: 'UX/UI Designer', subtitle: 'Diseño de experiencias' },
  {
    key: 'frontend',
    title: 'Frontend Developer',
    subtitle: 'Interfaces dinámicas',
  },
  {
    key: 'backend',
    title: 'Backend Developer',
    subtitle: 'APIs y arquitectura',
  },
  { key: 'qa', title: 'QA Tester', subtitle: 'Calidad y aseguramiento' },
  { key: 'pm', title: 'Product Manager', subtitle: 'Visión y producto' },
  {
    key: 'analista',
    title: 'Analista Funcional',
    subtitle: 'Requisitos y procesos',
  },
  {
    key: 'project_manager',
    title: 'Project Manager',
    subtitle: 'Delivery y gestión',
  },
  { key: 'no_code', title: 'No-Code Developer', subtitle: 'MVPs rápidos' },
] as const

type StepId = 1 | 2 | 3

export default function ProgramPostularPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const toast = useToastEnhanced()
  const { isBooting, bootAuth, userId, profile } = useAuthStore()

  const slug = params.slug

  const didBootRef = useRef(false)
  const didLoadRef = useRef(false)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [program, setProgram] = useState<ProgramRow | null>(null)
  const [form, setForm] = useState<ApplicationFormRow | null>(null)
  const [schema, setSchema] = useState<FormSchema | null>(null)

  const [step, setStep] = useState<StepId>(1)

  // values (solo campos del schema)
  const [values, setValues] = useState<Record<string, any>>({})

  useEffect(() => {
    if (didBootRef.current) return
    didBootRef.current = true
    void bootAuth()
  }, [bootAuth])

  useEffect(() => {
    if (didLoadRef.current) return
    didLoadRef.current = true
    void loadProgramAndForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  async function loadProgramAndForm() {
    setLoading(true)

    const programRes = await supabase
      .from('programs')
      .select(
        'id, slug, title, description, is_published, requires_payment_pre'
      )
      .eq('slug', slug)
      .maybeSingle()

    if (programRes.error || !programRes.data) {
      toast.showError('Programa no encontrado.')
      setProgram(null)
      setForm(null)
      setSchema(null)
      setLoading(false)
      return
    }

    const p = programRes.data as ProgramRow
    setProgram(p)

    if (!p.is_published) {
      setForm(null)
      setSchema(null)
      setLoading(false)
      return
    }

    const formRes = await supabase
      .from('application_forms')
      .select(
        'id, program_id, version, schema_json, is_active, opens_at, closes_at, created_at'
      )
      .eq('program_id', p.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (formRes.error) {
      toast.showError('No se pudo cargar el formulario activo.')
      setForm(null)
      setSchema(null)
      setLoading(false)
      return
    }

    const f = (formRes.data ?? null) as ApplicationFormRow | null
    setForm(f)

    const parsed = f ? parseSchema(f.schema_json) : null
    setSchema(parsed)

    // init values (checkbox -> false, others -> '')
    if (parsed) {
      const init: Record<string, any> = {}
      for (const field of parsed.fields) {
        init[field.name] = field.type === 'checkbox' ? false : ''
      }
      setValues(init)
    } else {
      setValues({})
    }

    setLoading(false)
  }

  const status = useMemo(() => {
    if (!program) return 'not_found'
    if (!program.is_published) return 'unpublished'
    if (!form || !schema) return 'no_form'
    return isFormOpen(form, new Date()) ? 'open' : 'closed'
  }, [program, form, schema])

  function setValue(name: string, val: any) {
    setValues((prev) => ({ ...prev, [name]: val }))
  }

  const fieldByName = useMemo(() => {
    const map = new Map<string, FormField>()
    for (const f of schema?.fields ?? []) map.set(f.name, f)
    return map
  }, [schema])

  // helpers: tomamos solo los campos que nos interesan por step
  const roleField = fieldByName.get('rol_postulado') ?? null

  const motivationField =
    fieldByName.get('mativacion') ?? fieldByName.get('motivacion') ?? null
  const techField = fieldByName.get('tecnologias') ?? null
  const expField = fieldByName.get('experiencia') ?? null

  const turnoManiana = fieldByName.get('turno_maniana') ?? null
  const turnoTarde = fieldByName.get('turno_tarde') ?? null
  const turnoNoche = fieldByName.get('turno_noche') ?? null

  const termsField = fieldByName.get('acepto_terminos') ?? null
  const quorumField = fieldByName.get('acepto_quorum') ?? null
  const disponibilidadField = fieldByName.get('acepto_disponibilidad') ?? null

  function validateStep(current: StepId): boolean {
    if (!schema) return false

    if (current === 1) {
      if (
        roleField?.required &&
        !String(values['rol_postulado'] ?? '').trim()
      ) {
        toast.showError('Seleccioná el rol al que postulás.')
        return false
      }
      return true
    }

    if (current === 2) {
      // requeridos típicos
      const requiredNames = [
        motivationField?.name,
        techField?.name,
        expField?.name,
      ].filter(Boolean) as string[]
      for (const name of requiredNames) {
        const f = fieldByName.get(name)
        if (f?.required && !String(values[name] ?? '').trim()) {
          toast.showError(`Completá: ${f.label}`)
          return false
        }
      }

      // turnos: al menos 1 (tu criterio; si no lo querés, sacalo)
      const anyTurno =
        Boolean(values['turno_maniana']) ||
        Boolean(values['turno_tarde']) ||
        Boolean(values['turno_noche'])
      if (!anyTurno) {
        toast.showError('Elegí al menos un turno (mañana/tarde/noche).')
        return false
      }

      return true
    }

    if (current === 3) {
      const requiredChecks = [
        termsField?.name,
        quorumField?.name,
        disponibilidadField?.name,
      ].filter(Boolean) as string[]
      for (const name of requiredChecks) {
        const f = fieldByName.get(name)
        if (f?.required && !values[name]) {
          toast.showError(
            'Para enviar la postulación, tenés que aceptar los compromisos.'
          )
          return false
        }
      }
      return true
    }

    return true
  }

  async function submit() {
    if (!program || !form || !schema) return
    if (!userId || !profile) return

    if (!validateStep(3)) return

    setSubmitting(true)

    // Datos personales “por detrás” desde profiles:
    const applicant = {
      id: profile.id,
      role: profile.role,
      first_name: profile.first_name,
      last_name: profile.last_name,
      document_number: profile.document_number,
      country_residence: profile.country_residence,
      whatsapp_e164: profile.whatsapp_e164,
      linkedin_url: profile.linkedin_url,
      portfolio_url: profile.portfolio_url,
      english_level: profile.english_level,
      terms_version: profile.terms_version,
      terms_accepted_at: profile.terms_accepted_at,
      marketing_opt_in: profile.marketing_opt_in,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }

    const payload = {
      program_id: program.id,
      form_id: form.id,
      form_version: schema.version,
      answers_json: values, // SOLO lo del schema
      applicant_profile_snapshot: applicant, // “por detrás”
    }

    // 🔥 AJUSTÁ ACÁ al nombre real de tu tabla de postulaciones.
    // Ejemplo: 'applications' o 'program_applications'
    const res = await supabase.from('applications').insert({
      applicant_profile_id: profile.id, // FK a profiles
      program_id: program.id,
      edition_id: null, // o la edición elegida si la tenés
      form_id: form.id,
      applied_role: String(values['rol_postulado'] ?? '').trim() || null,
      answers: values, // ✅ tu columna real es "answers"
      status: 'received', // opcional, ya tiene default
    })

    setSubmitting(false)

    if (res.error) {
      toast.showError(
        `No se pudo enviar. ${safeString(res.error.message)} (revisá el nombre de la tabla "applications")`
      )
      return
    }

    toast.showSuccess('¡Postulación enviada! Te avisaremos por email/WhatsApp.')
    router.push(`/plataforma/programas/${program.slug}`)
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Cargando…</CardTitle>
            <CardDescription>Preparando la postulación.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Programa no encontrado</CardTitle>
            <CardDescription>Revisá el enlace.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!program.is_published || status !== 'open' || !form || !schema) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Button variant="outline" asChild>
          <Link href="/plataforma/programas">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{program.title}</CardTitle>
            <CardDescription>{program.description ?? '—'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge variant="secondary">
              {program.is_published
                ? status === 'closed'
                  ? 'Inscripciones cerradas'
                  : 'Sin formulario activo'
                : 'Próximamente'}
            </Badge>
          </CardContent>
        </Card>
      </div>
    )
  }

  // auth gating
  if (isBooting) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Verificando sesión…</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Button variant="outline" asChild>
          <Link href={`/plataforma/programas/${program.slug}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Iniciar sesión requerido
            </CardTitle>
            <CardDescription>
              Para postularte, necesitás iniciar sesión. Tus datos personales se
              toman del perfil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/plataforma/login">Iniciar sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Button variant="outline" asChild>
          <Link href={`/plataforma/programas/${program.slug}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Completá tu perfil</CardTitle>
            <CardDescription>
              Antes de postularte, completá datos básicos (nombre, documento,
              WhatsApp, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => router.push('/plataforma/perfil')}
            >
              Ir a mi perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stepTitle =
    step === 1
      ? '¿En qué rol querés entrenarte esta temporada?'
      : step === 2
        ? 'Experiencia Técnica'
        : 'Contrato Moral y Compromiso'

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" asChild>
          <Link href={`/plataforma/programas/${program.slug}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Badge variant="outline">{schema.version}</Badge>
          <Badge>ABIERTO</Badge>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="text-xs text-muted-foreground">
            STEP {String(step).padStart(2, '0')}
          </div>
          <CardTitle className="text-2xl">{stepTitle}</CardTitle>
          <CardDescription>
            {program.title} · {schema.title}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1 - Role selection */}
          {step === 1 ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Seleccioná la especialidad donde querés potenciar tus
                habilidades.
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {ROLE_OPTIONS.map((r) => {
                  const selected = values['rol_postulado'] === r.title
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setValue('rol_postulado', r.title)}
                      className={[
                        'text-left rounded-xl border p-4 transition',
                        'hover:border-emerald-500/60 hover:bg-emerald-500/5',
                        selected
                          ? 'border-emerald-500/70 bg-emerald-500/10'
                          : 'border-border',
                      ].join(' ')}
                    >
                      <div className="font-semibold">{r.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {r.subtitle}
                      </div>
                      {selected ? (
                        <div className="mt-3 inline-flex items-center gap-2 text-xs text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" /> Seleccionado
                        </div>
                      ) : null}
                    </button>
                  )
                })}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (!validateStep(1)) return
                    setStep(2)
                  }}
                  className="gap-2"
                >
                  Siguiente <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}

          {/* Step 2 - Experience + shifts */}
          {step === 2 ? (
            <div className="space-y-6">
              <div className="grid gap-4">
                {expField ? (
                  <div className="space-y-2">
                    <div className="text-xs text-emerald-400/80 tracking-wide uppercase">
                      {expField.label}
                    </div>
                    <Input
                      value={values[expField.name] ?? ''}
                      onChange={(e) => setValue(expField.name, e.target.value)}
                      placeholder={expField.placeholder ?? ''}
                    />
                  </div>
                ) : null}

                {techField ? (
                  <div className="space-y-2">
                    <div className="text-xs text-emerald-400/80 tracking-wide uppercase">
                      {techField.label}
                    </div>
                    <Textarea
                      value={values[techField.name] ?? ''}
                      onChange={(e) => setValue(techField.name, e.target.value)}
                      placeholder={techField.placeholder ?? ''}
                      rows={4}
                    />
                  </div>
                ) : null}

                {motivationField ? (
                  <div className="space-y-2">
                    <div className="text-xs text-emerald-400/80 tracking-wide uppercase">
                      {motivationField.label}
                    </div>
                    <Textarea
                      value={values[motivationField.name] ?? ''}
                      onChange={(e) =>
                        setValue(motivationField.name, e.target.value)
                      }
                      placeholder={motivationField.placeholder ?? ''}
                      rows={4}
                    />
                  </div>
                ) : null}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="text-xs text-emerald-400/80 tracking-wide uppercase">
                  Turnos disponibles
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[turnoManiana, turnoTarde, turnoNoche]
                    .filter(Boolean)
                    .map((f) => {
                      const field = f as FormField
                      const checked = Boolean(values[field.name])
                      return (
                        <label
                          key={field.name}
                          className={[
                            'flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer',
                            checked
                              ? 'border-emerald-500/60 bg-emerald-500/5'
                              : 'border-border',
                          ].join(' ')}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) =>
                              setValue(field.name, Boolean(v))
                            }
                          />
                          <div className="text-sm">{field.label}</div>
                        </label>
                      )
                    })}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>

                <Button
                  onClick={() => {
                    if (!validateStep(2)) return
                    setStep(3)
                  }}
                  className="gap-2"
                >
                  Siguiente <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}

          {/* Step 3 - Commitment */}
          {step === 3 ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Postulando como:{' '}
                  <span className="font-semibold">
                    {values['rol_postulado'] || '—'}
                  </span>
                </Badge>
              </div>

              <div className="space-y-3">
                {[termsField, quorumField, disponibilidadField]
                  .filter(Boolean)
                  .map((f) => {
                    const field = f as FormField
                    const checked = Boolean(values[field.name])
                    return (
                      <label
                        key={field.name}
                        className={[
                          'flex items-start gap-3 rounded-xl border p-4 cursor-pointer',
                          checked
                            ? 'border-emerald-500/60 bg-emerald-500/5'
                            : 'border-border',
                        ].join(' ')}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) =>
                            setValue(field.name, Boolean(v))
                          }
                        />
                        <div className="space-y-1 flex">
                          <div className="text-sm text-muted-foreground">
                            {field.label}
                          </div>
                          <div className="text-sm text-red-600 font-medium">
                            {field.required ? '*' : null}
                          </div>
                        </div>
                      </label>
                    )
                  })}
              </div>

              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm text-muted-foreground">
                Al enviar la postulación, tu perfil entrará en proceso de
                revisión. Serás notificado por email y/o WhatsApp sobre el
                estado de tu ingreso.
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al paso anterior
                </Button>

                <Button
                  onClick={submit}
                  disabled={submitting}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Enviando…' : 'Enviar postulación'}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
