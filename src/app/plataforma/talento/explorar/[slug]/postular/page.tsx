'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-stores'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { PaymentMethodModal } from '@/components/payments/payment-method-modal'
import { Button } from '@/components/ui/button'

import {
  StepRole,
  type RoleOption,
} from '@/app/plataforma/talento/explorar/[slug]/postular/components/step-role'
import {
  StepExperience,
  type FormField,
  type FormInputField,
  type FormValuesMap,
  type FormValue,
} from '@/app/plataforma/talento/explorar/[slug]/postular/components/step-experience'
import { StepCommitment } from '@/app/plataforma/talento/explorar/[slug]/postular/components/step-commitment'
import { PostulationShell } from '@/app/plataforma/talento/explorar/[slug]/postular/components/postulation-shell'
import { PostulationStepper } from '@/app/plataforma/talento/explorar/[slug]/postular/components/postulation-stepper'
import type { ApplicationFormRow } from '@/types/program-editions'
import type {
  EditionRowBase,
  ProgramPaymentMode,
  ProgramRow,
} from '@/types/programs'

type FieldTypeInput =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'date'

type SchemaFieldOption = { value: string; label: string }

type SchemaInputField = {
  id: string
  type: FieldTypeInput
  label: string
  name: string
  placeholder?: string
  required?: boolean
  options?: SchemaFieldOption[]
}

type SchemaLinkField = {
  id: string
  type: 'link'
  label: string
  url: string
  description?: string
  openInNewTab?: boolean
}

type SchemaField = SchemaInputField | SchemaLinkField

type FormSchema = {
  title: string
  description?: string
  fields: SchemaField[]
}

type StepIdentifier = 1 | 2 | 3

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function isInputFieldType(value: unknown): value is FieldTypeInput {
  return (
    value === 'text' ||
    value === 'textarea' ||
    value === 'email' ||
    value === 'phone' ||
    value === 'number' ||
    value === 'select' ||
    value === 'checkbox' ||
    value === 'date'
  )
}

function resolvePaymentMode(program: ProgramRow): ProgramPaymentMode {
  if (program.payment_mode) return program.payment_mode
  return program.requires_payment_pre ? 'pre' : 'none'
}

function parsePriceToCents(priceUsd: string | number | null): number | null {
  if (priceUsd === null || priceUsd === undefined) return null
  const parsed = Number(priceUsd)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed * 100)
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

  const descriptionValue = candidate['description']

  // Validación mínima del array de fields (sin any)
  const parsedFields: SchemaField[] = fields.reduce<SchemaField[]>(
    (accumulator, fieldUnknown) => {
      if (!fieldUnknown || typeof fieldUnknown !== 'object') return accumulator

      const row = fieldUnknown as Record<string, unknown>

      const id = row['id']
      const type = row['type']
      const label = row['label']

      if (
        typeof id !== 'string' ||
        typeof type !== 'string' ||
        typeof label !== 'string'
      ) {
        return accumulator
      }

      if (type === 'link') {
        const url = row['url']
        if (typeof url !== 'string') return accumulator
        const description = row['description']
        const openInNewTab = row['openInNewTab']

        accumulator.push({
          id,
          type: 'link',
          label,
          url,
          description:
            typeof description === 'string' ? description : undefined,
          openInNewTab:
            typeof openInNewTab === 'boolean' ? openInNewTab : undefined,
        })
        return accumulator
      }

      if (!isInputFieldType(type)) return accumulator

      const name = row['name']
      if (typeof name !== 'string') return accumulator

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
        type,
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
  if (field.type === 'link') {
    return {
      id: field.id,
      type: 'link',
      label: field.label,
      url: field.url,
      description: field.description,
      openInNewTab: field.openInNewTab,
    }
  }

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

function mapSchemaInputFieldToStepField(
  field: SchemaInputField
): FormInputField {
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

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [program, setProgram] = useState<ProgramRow | null>(null)
  const [edition, setEdition] = useState<EditionRowBase | null>(null)
  const [form, setForm] = useState<ApplicationFormRow | null>(null)
  const [schema, setSchema] = useState<FormSchema | null>(null)

  const [step, setStep] = useState<StepIdentifier>(1)
  const [values, setValues] = useState<FormValuesMap>({})
  const [hasPaidPre, setHasPaidPre] = useState<boolean | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  useEffect(() => {
    if (hasBootedOnceRef.current) return
    hasBootedOnceRef.current = true
    void bootAuth()
  }, [bootAuth])

  useEffect(() => {
    void loadProgramAndForm()
  }, [slug])

  useEffect(() => {
    if (!program) return
    if (resolvePaymentMode(program) !== 'pre') {
      setHasPaidPre(true)
      return
    }
    if (!userId) {
      setHasPaidPre(false)
      return
    }
    void checkPrePayment(program.id, edition?.id ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program?.id, edition?.id, userId])

  async function loadProgramAndForm() {
    setIsLoading(true)

    const programResponse = await supabase
      .from('programs')
      .select(
        'id, slug, title, description, is_published, payment_mode, requires_payment_pre, price_usd'
      )
      .eq('slug', slug)
      .maybeSingle()

    if (programResponse.error || !programResponse.data) {
      toast.showError('Programa no encontrado.')
      setProgram(null)
      setEdition(null)
      setForm(null)
      setSchema(null)
      setIsLoading(false)
      return
    }

    const programRow = programResponse.data as ProgramRow
    setProgram(programRow)
    setEdition(null)

    if (!programRow.is_published) {
      setForm(null)
      setSchema(null)
      setIsLoading(false)
      return
    }

    const openEditionResponse = await supabase
      .from('program_editions')
      .select('id, program_id, is_open, created_at')
      .eq('program_id', programRow.id)
      .eq('is_open', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (openEditionResponse.error) {
      toast.showError('No se pudieron cargar las ediciones.')
    }

    let activeEdition = (openEditionResponse.data ??
      null) as EditionRowBase | null

    if (!activeEdition) {
      const latestEditionResponse = await supabase
        .from('program_editions')
        .select('id, program_id, is_open, created_at')
        .eq('program_id', programRow.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latestEditionResponse.error) {
        toast.showError('No se pudieron cargar las ediciones.')
      }

      activeEdition = (latestEditionResponse.data ??
        null) as EditionRowBase | null
    }

    setEdition(activeEdition)

    const fetchForm = async (editionId: string | null) => {
      let query = supabase
        .from('application_forms')
        .select(
          'id, program_id, edition_id, version_num, schema_json, is_active, opens_at, closes_at, created_at'
        )
        .eq('program_id', programRow.id)
        .eq('is_active', true)
        .order('version_num', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)

      query = editionId
        ? query.eq('edition_id', editionId)
        : query.is('edition_id', null)

      return query.maybeSingle()
    }

    const editionFormResponse = await fetchForm(activeEdition?.id ?? null)

    if (editionFormResponse.error) {
      toast.showError('No se pudo cargar el formulario activo.')
      setForm(null)
      setSchema(null)
      setIsLoading(false)
      return
    }

    let activeForm = (editionFormResponse.data ??
      null) as ApplicationFormRow | null

    if (!activeForm && activeEdition?.id) {
      const programFormResponse = await fetchForm(null)
      if (programFormResponse.error) {
        toast.showError('No se pudo cargar el formulario activo.')
        setForm(null)
        setSchema(null)
        setIsLoading(false)
        return
      }
      activeForm = (programFormResponse.data ??
        null) as ApplicationFormRow | null
    }

    setForm(activeForm)

    const parsedSchema = activeForm ? parseSchema(activeForm.schema_json) : null
    setSchema(parsedSchema)

    const initialValues: FormValuesMap = {}
    for (const field of parsedSchema?.fields ?? []) {
      if (field.type === 'link') continue
      initialValues[field.name] = field.type === 'checkbox' ? false : ''
    }
    setValues(initialValues)

    setIsLoading(false)
  }

  const applicationStatus = useMemo(() => {
    if (!program) return 'not_found'
    if (!program.is_published) return 'unpublished'
    if (!form || !schema) return 'no_form'
    if (edition && !edition.is_open) return 'closed'
    return isFormOpen(form, new Date()) ? 'open' : 'closed'
  }, [program, form, schema, edition])

  const fieldByName = useMemo(() => {
    const map = new Map<string, SchemaInputField>()
    for (const field of schema?.fields ?? []) {
      if (field.type === 'link') continue
      map.set(field.name, field)
    }
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
  ].filter((x): x is SchemaInputField => Boolean(x))

  const termsField = fieldByName.get('acepto_terminos') ?? null
  const quorumField = fieldByName.get('acepto_quorum') ?? null
  const availabilityField = fieldByName.get('acepto_disponibilidad') ?? null
  const commitmentFields: FormInputField[] = [
    termsField,
    quorumField,
    availabilityField,
  ]
    .filter((field): field is SchemaInputField => Boolean(field))
    .map(mapSchemaInputFieldToStepField)

  const reservedFieldNames = new Set(
    [
      roleField?.name,
      motivationField?.name,
      technologiesField?.name,
      experienceField?.name,
      ...shiftFields.map((field) => field.name),
      ...commitmentFields.map((field) => field.name),
    ].filter((name): name is string => Boolean(name))
  )

  const extraFields = (schema?.fields ?? [])
    .filter((field) =>
      field.type === 'link' ? true : !reservedFieldNames.has(field.name)
    )
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

      const shiftFieldNames = shiftFields.map((field) => field.name)
      if (shiftFieldNames.length > 0) {
        const hasSomeShift = shiftFieldNames.some((name) =>
          Boolean(values[name])
        )
        if (!hasSomeShift) {
          toast.showError('Elegí al menos un turno (mañana/tarde/noche).')
          return false
        }
      }

      for (const field of extraFields) {
        if (field.type === 'link') continue
        if (!field.required) continue
        const value = values[field.name]
        if (field.type === 'checkbox') {
          if (!Boolean(value)) {
            toast.showError(`Completá: ${field.label}`)
            return false
          }
          continue
        }

        const textValue = typeof value === 'string' ? value.trim() : ''
        if (!textValue) {
          toast.showError(`Completá: ${field.label}`)
          return false
        }
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

  async function alreadyApplied(params: {
    applicantProfileId: string
    programId: string
    editionId: string | null
  }): Promise<boolean> {
    const { data, error } = await supabase
      .from('applications')
      .select('id')
      .eq('applicant_profile_id', params.applicantProfileId)
      .eq('program_id', params.programId)
      .eq('edition_id', params.editionId)
      .limit(1)
      .maybeSingle()

    if (error) return false // fallback: deja que el índice único mande
    return Boolean(data?.id)
  }

  async function checkPrePayment(
    programId: string,
    editionId: string | null
  ): Promise<void> {
    if (!userId) {
      setHasPaidPre(false)
      return
    }

    setHasPaidPre(null)

    let query = supabase
      .from('payments')
      .select('id')
      .eq('user_id', userId)
      .eq('program_id', programId)
      .eq('purpose', 'pre_enrollment')
      .eq('status', 'paid')
      .limit(1)

    query = editionId
      ? query.eq('edition_id', editionId)
      : query.is('edition_id', null)

    const { data, error } = await query.maybeSingle()
    if (error) {
      setHasPaidPre(false)
      return
    }

    if (data?.id) {
      setHasPaidPre(true)
      return
    }

    if (editionId) {
      const fallback = await supabase
        .from('payments')
        .select('id')
        .eq('user_id', userId)
        .eq('program_id', programId)
        .eq('purpose', 'pre_enrollment')
        .eq('status', 'paid')
        .is('edition_id', null)
        .limit(1)
        .maybeSingle()

      if (fallback.data?.id) {
        setHasPaidPre(true)
        return
      }
    }

    setHasPaidPre(false)
  }

  async function handleSubmit() {
    if (!program || !form || !schema) return
    if (!userId || !profile) return
    if (!validateStep(3)) return

    // Seguridad extra: aunque ya lo bloqueaste antes, aquí se mantiene por si entran directo por URL
    if (profile.profile_status !== 'profile_complete') {
      toast.showError('Completá tu perfil antes de postular.')
      router.push('/plataforma/talento/perfil')
      return
    }

    if (resolvePaymentMode(program) === 'pre' && hasPaidPre !== true) {
      toast.showError('Debes completar el pago antes de postular.')
      return
    }

    setIsSubmitting(true)

    const editionId: string | null = edition?.id ?? null

    const exists = await alreadyApplied({
      applicantProfileId: profile.id,
      programId: program.id,
      editionId,
    })

    if (exists) {
      setIsSubmitting(false)
      toast.showError('Ya te postulaste a este programa en esta edición.')
      router.push(`/plataforma/talento/explorar/${program.slug}`)
      return
    }

    const paymentMode = resolvePaymentMode(program)
    let paymentStatus: 'initiated' | 'paid' = 'initiated'
    let paidAt: string | null = null
    let paymentRequired = false

    if (paymentMode === 'pre') {
      paymentRequired = true
      if (hasPaidPre) {
        let paymentQuery = supabase
          .from('payments')
          .select('paid_at')
          .eq('user_id', userId)
          .eq('program_id', program.id)
          .eq('purpose', 'pre_enrollment')
          .eq('status', 'paid')
          .limit(1)

        paymentQuery = editionId
          ? paymentQuery.eq('edition_id', editionId)
          : paymentQuery.is('edition_id', null)

        const { data: paidRow } = await paymentQuery.maybeSingle()

        if (!paidRow?.paid_at && editionId) {
          const { data: fallbackRow } = await supabase
            .from('payments')
            .select('paid_at')
            .eq('user_id', userId)
            .eq('program_id', program.id)
            .eq('purpose', 'pre_enrollment')
            .eq('status', 'paid')
            .is('edition_id', null)
            .limit(1)
            .maybeSingle()
          paidAt = (fallbackRow?.paid_at as string | null) ?? null
        } else {
          paidAt = (paidRow?.paid_at as string | null) ?? null
        }

        paymentStatus = 'paid'
      }
    }

    const appliedRole = safeString(values['rol_postulado']).trim() || null

    const insertResponse = await supabase.from('applications').insert({
      applicant_profile_id: profile.id,
      program_id: program.id,
      edition_id: editionId,
      form_id: form.id,
      applied_role: appliedRole,
      answers: values,
      status: 'received',
      payment_status: paymentStatus,
      paid_at: paidAt,
      payment_required: paymentRequired,
    })

    setIsSubmitting(false)

    if (insertResponse.error) {
      const msg = safeString(insertResponse.error.message).toLowerCase()

      // choque con índice único (multi-tab / carrera / doble click)
      if (msg.includes('duplicate key')) {
        toast.showError('Ya te postulaste a este programa en esta edición.')
        router.push(`/plataforma/talento/explorar/${program.slug}`)
        return
      }

      toast.showError(
        `No se pudo enviar. ${safeString(insertResponse.error.message)}`
      )
      return
    }

    toast.showSuccess('¡Postulación enviada! Te contactaremos pronto.')
    router.push(`/plataforma/talento/explorar/${program.slug}`)
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
          href="/plataforma/talento/explorar"
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
          href={`/plataforma/talento/explorar/${program.slug}`}
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
          href={`/plataforma/talento/explorar/${program.slug}`}
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

  const paymentMode = resolvePaymentMode(program)

  if (paymentMode === 'pre') {
    if (hasPaidPre === null) {
      return (
        <div className="p-6 max-w-3xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-white">
            Verificando tu pago…
          </div>
        </div>
      )
    }

    if (!hasPaidPre) {
      const amountCents = parsePriceToCents(program.price_usd) ?? 0
      return (
        <div className="p-6 max-w-3xl mx-auto space-y-4">
          <Link
            className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            href={`/plataforma/talento/explorar`}
          >
            ← Volver
          </Link>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-white space-y-3">
            <div className="text-lg font-semibold">{program.title}</div>
            <div className="text-sm text-white/60">
              Este programa requiere pago previo para habilitar la postulación.
            </div>

            <Button
              className="w-full bg-amber-400 text-black hover:bg-amber-400/90"
              onClick={() => setCheckoutOpen(true)}
              disabled={!amountCents}
            >
              Pagar e inscribirme
            </Button>

            {!amountCents ? (
              <div className="text-xs text-white/60">
                Falta configurar el precio del programa.
              </div>
            ) : null}
          </div>

          <PaymentMethodModal
            open={checkoutOpen}
            onOpenChange={setCheckoutOpen}
            programId={program.id}
            programTitle={program.title}
            editionId={edition?.id ?? null}
            purpose="pre_enrollment"
            amountCents={amountCents}
            onPaid={() => {
              setHasPaidPre(true)
              setCheckoutOpen(false)
            }}
          />
        </div>
      )
    }
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
      programTitle={program?.title ?? undefined}
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
            experienceField
              ? mapSchemaInputFieldToStepField(experienceField)
              : null
          }
          technologiesField={
            technologiesField
              ? mapSchemaInputFieldToStepField(technologiesField)
              : null
          }
          motivationField={
            motivationField
              ? mapSchemaInputFieldToStepField(motivationField)
              : null
          }
          shiftFields={shiftFields.map(mapSchemaInputFieldToStepField)}
          extraFields={extraFields}
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
