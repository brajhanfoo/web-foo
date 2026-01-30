'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-stores'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'

import {
  StepRole,
  type RoleOption,
} from '@/app/plataforma/talento/programas/[slug]/postular/components/step-role'
import {
  StepExperience,
  type FormField,
  type FormValuesMap,
  type FormValue,
} from '@/app/plataforma/talento/programas/[slug]/postular/components/step-experience'
import { StepCommitment } from '@/app/plataforma/talento/programas/[slug]/postular/components/step-commitment'
import { PostulationShell } from '@/app/plataforma/talento/programas/[slug]/postular/components/postulation-shell'
import { PostulationStepper } from '@/app/plataforma/talento/programas/[slug]/postular/components/postulation-stepper'

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

type SchemaFieldOption = { value: string; label: string }

type SchemaField = {
  id: string
  type: FieldType
  label: string
  name: string
  placeholder?: string
  required?: boolean
  options?: SchemaFieldOption[]
}

type FormSchema = {
  version: string
  title: string
  description?: string
  fields: SchemaField[]
}

type StepIdentifier = 1 | 2 | 3

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : ''
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

  const candidate = schema as Record<string, unknown>
  const title = candidate['title']
  const fields = candidate['fields']

  if (typeof title !== 'string') return null
  if (!Array.isArray(fields)) return null

  const versionValue = candidate['version']
  const descriptionValue = candidate['description']

  // Validación mínima del array de fields (sin any)
  const parsedFields: SchemaField[] = fields.reduce<SchemaField[]>(
    (accumulator, fieldUnknown) => {
      if (!fieldUnknown || typeof fieldUnknown !== 'object') return accumulator

      const row = fieldUnknown as Record<string, unknown>

      const id = row['id']
      const name = row['name']
      const type = row['type']
      const label = row['label']

      if (
        typeof id !== 'string' ||
        typeof name !== 'string' ||
        typeof type !== 'string' ||
        typeof label !== 'string'
      ) {
        return accumulator
      }

      const placeholder = row['placeholder']
      const required = row['required']
      const options = row['options']

      const parsedOptions: SchemaFieldOption[] | undefined = Array.isArray(
        options
      )
        ? options.reduce<SchemaFieldOption[]>(
            (optionsAccumulator, optionUnknown) => {
              if (!optionUnknown || typeof optionUnknown !== 'object')
                return optionsAccumulator

              const optionRow = optionUnknown as Record<string, unknown>
              const optionLabel = optionRow['label']
              const optionValue = optionRow['value']

              if (
                typeof optionLabel !== 'string' ||
                typeof optionValue !== 'string'
              )
                return optionsAccumulator

              optionsAccumulator.push({
                label: optionLabel,
                value: optionValue,
              })
              return optionsAccumulator
            },
            []
          )
        : undefined

      accumulator.push({
        id,
        name,
        type: type as FieldType,
        label,
        placeholder: typeof placeholder === 'string' ? placeholder : undefined,
        required: typeof required === 'boolean' ? required : undefined,
        options: parsedOptions,
      })

      return accumulator
    },
    []
  )

  return {
    version: typeof versionValue === 'string' ? versionValue : 'v1',
    title,
    description:
      typeof descriptionValue === 'string' ? descriptionValue : undefined,
    fields: parsedFields,
  }
}

const ROLE_OPTIONS: RoleOption[] = [
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
  {
    key: 'product_manager',
    title: 'Product Manager',
    subtitle: 'Visión y producto',
  },
  {
    key: 'analista_funcional',
    title: 'Analista Funcional',
    subtitle: 'Requisitos y procesos',
  },
  {
    key: 'project_manager',
    title: 'Project Manager',
    subtitle: 'Delivery y gestión',
  },
  { key: 'no_code', title: 'No-Code Developer', subtitle: 'MVPs rápidos' },
]

function mapSchemaFieldToStepField(field: SchemaField): FormField {
  return {
    id: field.id,
    name: field.name,
    label: field.label,
    type: field.type,
    placeholder: field.placeholder,
    required: field.required,
    options: field.options,
  }
}

export default function ProgramPostularPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const toast = useToastEnhanced()
  const { isBooting, bootAuth, userId, profile } = useAuthStore()

  const slug = params.slug

  const hasBootedOnceRef = useRef(false)
  const hasLoadedOnceRef = useRef(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [program, setProgram] = useState<ProgramRow | null>(null)
  const [form, setForm] = useState<ApplicationFormRow | null>(null)
  const [schema, setSchema] = useState<FormSchema | null>(null)

  const [step, setStep] = useState<StepIdentifier>(1)
  const [values, setValues] = useState<FormValuesMap>({})

  useEffect(() => {
    if (hasBootedOnceRef.current) return
    hasBootedOnceRef.current = true
    void bootAuth()
  }, [bootAuth])

  useEffect(() => {
    if (hasLoadedOnceRef.current) return
    hasLoadedOnceRef.current = true
    void loadProgramAndForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  async function loadProgramAndForm() {
    setIsLoading(true)

    const programResponse = await supabase
      .from('programs')
      .select(
        'id, slug, title, description, is_published, requires_payment_pre'
      )
      .eq('slug', slug)
      .maybeSingle()

    if (programResponse.error || !programResponse.data) {
      toast.showError('Programa no encontrado.')
      setProgram(null)
      setForm(null)
      setSchema(null)
      setIsLoading(false)
      return
    }

    const programRow = programResponse.data as ProgramRow
    setProgram(programRow)

    if (!programRow.is_published) {
      setForm(null)
      setSchema(null)
      setIsLoading(false)
      return
    }

    const formResponse = await supabase
      .from('application_forms')
      .select(
        'id, program_id, version, schema_json, is_active, opens_at, closes_at, created_at'
      )
      .eq('program_id', programRow.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (formResponse.error) {
      toast.showError('No se pudo cargar el formulario activo.')
      setForm(null)
      setSchema(null)
      setIsLoading(false)
      return
    }

    const activeForm = (formResponse.data ?? null) as ApplicationFormRow | null
    setForm(activeForm)

    const parsedSchema = activeForm ? parseSchema(activeForm.schema_json) : null
    setSchema(parsedSchema)

    const initialValues: FormValuesMap = {}
    for (const field of parsedSchema?.fields ?? []) {
      initialValues[field.name] = field.type === 'checkbox' ? false : ''
    }
    setValues(initialValues)

    setIsLoading(false)
  }

  const applicationStatus = useMemo(() => {
    if (!program) return 'not_found'
    if (!program.is_published) return 'unpublished'
    if (!form || !schema) return 'no_form'
    return isFormOpen(form, new Date()) ? 'open' : 'closed'
  }, [program, form, schema])

  const fieldByName = useMemo(() => {
    const map = new Map<string, SchemaField>()
    for (const field of schema?.fields ?? []) map.set(field.name, field)
    return map
  }, [schema])

  const roleField = fieldByName.get('rol_postulado') ?? null

  // tu schema tiene "mativacion" (typo), soportamos ambos
  const motivationField =
    fieldByName.get('mativacion') ?? fieldByName.get('motivacion') ?? null

  const technologiesField = fieldByName.get('tecnologias') ?? null
  const experienceField = fieldByName.get('experiencia') ?? null

  const shiftFields = [
    fieldByName.get('turno_maniana') ?? null,
    fieldByName.get('turno_tarde') ?? null,
    fieldByName.get('turno_noche') ?? null,
  ].filter((x): x is SchemaField => Boolean(x))

  const termsField = fieldByName.get('acepto_terminos') ?? null
  const quorumField = fieldByName.get('acepto_quorum') ?? null
  const availabilityField = fieldByName.get('acepto_disponibilidad') ?? null
  const commitmentFields: FormField[] = [
    termsField,
    quorumField,
    availabilityField,
  ]
    .filter((field): field is SchemaField => Boolean(field))
    .map(mapSchemaFieldToStepField)
  function handleChangeValue(name: string, value: FormValue) {
    setValues((previous) => ({ ...previous, [name]: value }))
  }

  function validateStep(currentStep: StepIdentifier): boolean {
    if (!schema) return false

    if (currentStep === 1) {
      const selectedRole = safeString(values['rol_postulado'])
      if (roleField?.required && !selectedRole.trim()) {
        toast.showError('Seleccioná el rol al que postulás.')
        return false
      }
      return true
    }

    if (currentStep === 2) {
      const requiredFieldNames = [
        motivationField?.name,
        technologiesField?.name,
        experienceField?.name,
      ].filter((x): x is string => Boolean(x))

      for (const fieldName of requiredFieldNames) {
        const field = fieldByName.get(fieldName)
        if (!field) continue
        if (!field.required) continue

        const value = values[fieldName]
        const textValue = typeof value === 'string' ? value.trim() : ''
        if (!textValue) {
          toast.showError(`Completá: ${field.label}`)
          return false
        }
      }

      const hasSomeShift =
        Boolean(values['turno_maniana']) ||
        Boolean(values['turno_tarde']) ||
        Boolean(values['turno_noche'])

      if (!hasSomeShift) {
        toast.showError('Elegí al menos un turno (mañana/tarde/noche).')
        return false
      }

      return true
    }

    if (currentStep === 3) {
      const requiredChecks = [
        termsField?.name,
        quorumField?.name,
        availabilityField?.name,
      ].filter((x): x is string => Boolean(x))

      for (const fieldName of requiredChecks) {
        const field = fieldByName.get(fieldName)
        const checked = Boolean(values[fieldName])
        if (field?.required && !checked) {
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

  async function handleSubmit() {
    if (!program || !form || !schema) return
    if (!userId || !profile) return
    if (!validateStep(3)) return

    setIsSubmitting(true)

    const appliedRole = safeString(values['rol_postulado']).trim() || null

    const insertResponse = await supabase.from('applications').insert({
      applicant_profile_id: profile.id,
      program_id: program.id,
      edition_id: null,
      form_id: form.id,
      applied_role: appliedRole,
      answers: values,
      status: 'received',
    })

    setIsSubmitting(false)

    if (insertResponse.error) {
      toast.showError(
        `No se pudo enviar. ${safeString(insertResponse.error.message)}`
      )
      return
    }

    toast.showSuccess('¡Postulación enviada! Te contactaremos pronto.')
    router.push(`/plataforma/talento/programas/${program.slug}`)
  }

  // ---------------------------- UI states (early) ---------------------------

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-white">
          Cargando…
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-white">
          Programa no encontrado.
        </div>
      </div>
    )
  }

  if (
    !program.is_published ||
    applicationStatus !== 'open' ||
    !form ||
    !schema
  ) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Link
          className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          href="/plataforma/talento/programas"
        >
          ← Volver
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-white">
          <div className="text-lg font-semibold">{program.title}</div>
          <div className="mt-1 text-sm text-white/60">
            {program.description ?? '—'}
          </div>

          <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            {program.is_published
              ? applicationStatus === 'closed'
                ? 'Inscripciones cerradas'
                : 'Sin formulario activo'
              : 'Próximamente'}
          </div>
        </div>
      </div>
    )
  }

  if (isBooting) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-white">
          Verificando sesión…
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Link
          className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          href={`/plataforma/talento/programas/${program.slug}`}
        >
          ← Volver
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-white">
          <div className="text-lg font-semibold">Iniciar sesión requerido</div>
          <div className="mt-1 text-sm text-white/60">
            Para postularte, necesitás iniciar sesión. Tus datos personales se
            toman del perfil.
          </div>

          <div className="mt-4">
            <Link
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black hover:brightness-110"
              href="/ingresar"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Link
          className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          href={`/plataforma/talento/programas/${program.slug}`}
        >
          ← Volver
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-white">
          <div className="text-lg font-semibold">Completá tu perfil</div>
          <div className="mt-1 text-sm text-white/60">
            Antes de postularte, completá datos básicos (nombre, documento,
            WhatsApp, etc.)
          </div>

          <div className="mt-4">
            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black hover:brightness-110"
              onClick={() => router.push('/plataforma/talento/perfil')}
            >
              Ir a mi perfil
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ------------------------------ Step metadata -----------------------------

  const selectedRoleTitle = safeString(values['rol_postulado'])

  const stepTitle =
    step === 1
      ? '¿En qué rol quieres entrenarte esta temporada?'
      : step === 2
        ? 'Experiencia Técnica'
        : 'Contrato Moral y Compromiso'

  const stepSubtitle =
    step === 1
      ? 'Selecciona la especialidad donde deseas potenciar tus habilidades y liderar la próxima revolución tecnológica.'
      : step === 2
        ? 'Queremos conocer tu nivel actual para asignarte el equipo ideal.'
        : 'Para finalizar tu proceso, por favor lee y acepta los siguientes términos de participación.'

  // ------------------------------- Render shell ------------------------------

  return (
    <PostulationShell
      stepLabel={`Paso ${String(step).padStart(2, '0')} de 03`}
      title={stepTitle}
      subtitle={stepSubtitle}
    >
      <div className="mb-8">
        <PostulationStepper current={step} />
      </div>{' '}
      {step === 1 ? (
        <StepRole
          options={ROLE_OPTIONS}
          selectedTitle={selectedRoleTitle}
          onSelect={(title: string) =>
            handleChangeValue('rol_postulado', title)
          }
          onNext={() => {
            if (!validateStep(1)) return
            setStep(2)
          }}
        />
      ) : null}
      {step === 2 ? (
        <StepExperience
          experienceField={
            experienceField ? mapSchemaFieldToStepField(experienceField) : null
          }
          technologiesField={
            technologiesField
              ? mapSchemaFieldToStepField(technologiesField)
              : null
          }
          motivationField={
            motivationField ? mapSchemaFieldToStepField(motivationField) : null
          }
          shiftFields={shiftFields.map(mapSchemaFieldToStepField)}
          values={values}
          onChangeValue={handleChangeValue}
          onBack={() => setStep(1)}
          onNext={() => {
            if (!validateStep(2)) return
            setStep(3)
          }}
        />
      ) : null}
      {step === 3 ? (
        <StepCommitment
          appliedRoleTitle={selectedRoleTitle}
          declaredLevelLabel={safeString(values['experiencia'])}
          commitmentFields={commitmentFields}
          values={values}
          onChangeValue={handleChangeValue}
          isSubmitting={isSubmitting}
          onBack={() => setStep(2)}
          onSubmit={handleSubmit}
        />
      ) : null}
    </PostulationShell>
  )
}
