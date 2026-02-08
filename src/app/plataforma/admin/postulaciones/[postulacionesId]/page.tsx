// src/app/plataforma/admin/postulaciones/%5BpostulacionesId%5D/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'

import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'

import type {
  ApplicationRow,
  ApplicationStatus,
  ParsedAnswers,
  FormSchema,
  SchemaField,
  SchemaFieldOption,
  FieldType,
  PaymentStatus,
  ProgramPaymentMode,
} from './types/types'
import {
  getStringValue,
  statusToStepIndex,
  textOrNA,
} from './helpers'

import { ApplicationStepper } from './components/application-stepper'
import { ApplicantProfileCard } from './components/applicant-profile-card'
import { ApplicationDetailsCard } from './components/application-details-card'
import { ApplicationWorkflowCard } from './components/application-workflow-card'

function normalizeParam(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return null
}

function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return (
    value === 'received' ||
    value === 'admitted' ||
    value === 'in_review' ||
    value === 'payment_pending' ||
    value === 'enrolled' ||
    value === 'rejected'
  )
}

function resolvePaymentMode(program: {
  payment_mode: ProgramPaymentMode | null
  requires_payment_pre: boolean
} | null): ProgramPaymentMode {
  if (!program) return 'none'
  if (program.payment_mode) return program.payment_mode
  return program.requires_payment_pre ? 'pre' : 'none'
}

function buildFullName(
  firstName: string | null,
  lastName: string | null
): string {
  const parts = [firstName ?? '', lastName ?? '']
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
  return parts.length ? parts.join(' ') : 'No definido'
}

type SupabaseApplicationRow = {
  id: unknown
  applicant_profile_id: unknown
  program_id: unknown
  edition_id: unknown
  status: unknown
  payment_status: unknown
  paid_at: unknown
  applied_role: unknown
  cv_url: unknown
  answers: unknown
  created_at: unknown
  updated_at: unknown
  form_id: unknown
  program: unknown
  edition: unknown
  applicant_profile: unknown
}

function pickString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function pickObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value))
    return value as Record<string, unknown>
  return null
}

function isFieldType(value: unknown): value is FieldType {
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

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    value === 'initiated' ||
    value === 'pending' ||
    value === 'paid' ||
    value === 'failed' ||
    value === 'canceled'
  )
}

function parseFormSchema(schema: unknown): FormSchema | null {
  if (!schema || typeof schema !== 'object') return null
  const candidate = schema as Record<string, unknown>
  const title = candidate['title']
  const fields = candidate['fields']
  if (typeof title !== 'string' || !Array.isArray(fields)) return null
  const description = typeof candidate['description'] === 'string' ? candidate['description'] : undefined
  const parsedFields: SchemaField[] = fields.reduce<SchemaField[]>((acc, fieldUnknown) => {
    if (!fieldUnknown || typeof fieldUnknown !== 'object') return acc
    const row = fieldUnknown as Record<string, unknown>
    const id = row['id']
    const name = row['name']
    const type = row['type']
    const label = row['label']
    if (typeof id !== 'string' || typeof name !== 'string' || typeof label !== 'string') return acc
    if (!isFieldType(type)) return acc
    const placeholder = row['placeholder']
    const required = row['required']
    const optionsRaw = row['options']
    const options: SchemaFieldOption[] | undefined = Array.isArray(optionsRaw)
      ? optionsRaw.reduce<SchemaFieldOption[]>((optAcc, optUnknown) => {
          if (!optUnknown || typeof optUnknown !== 'object') return optAcc
          const optRow = optUnknown as Record<string, unknown>
          const optLabel = optRow['label']
          const optValue = optRow['value']
          if (typeof optLabel !== 'string' || typeof optValue !== 'string') return optAcc
          optAcc.push({ label: optLabel, value: optValue })
          return optAcc
        }, [])
      : undefined
    acc.push({
      id,
      name,
      type,
      label,
      placeholder: typeof placeholder === 'string' ? placeholder : undefined,
      required: typeof required === 'boolean' ? required : undefined,
      options,
    })
    return acc
  }, [])
  return { title, description, fields: parsedFields }
}

export default function ApplicationDetailClientPage() {
  const rawParams = useParams() as Record<string, string | string[] | undefined>
  const postulacionId = useMemo(
    () => normalizeParam(rawParams?.postulacionesId),
    [rawParams?.postulacionesId]
  )

  const { showError, showSuccess } = useToastEnhanced()

  const [isLoading, setIsLoading] = useState(true)
  const [application, setApplication] = useState<ApplicationRow | null>(null)
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null)

  const [isAdmitLoading, setIsAdmitLoading] = useState(false)
  const [isPaymentPendingLoading, setIsPaymentPendingLoading] = useState(false)
  const [isEnrollLoading, setIsEnrollLoading] = useState(false)
  const [isRejectLoading, setIsRejectLoading] = useState(false)

  const parsedAnswers = useMemo<ParsedAnswers>(
    () => application?.answers ?? {},
    [application?.answers]
  )

  const currentStep = statusToStepIndex(application?.status ?? 'received')

  const applicant = application?.applicant_profile ?? null
  const applicantFullName = buildFullName(
    applicant?.first_name ?? null,
    applicant?.last_name ?? null
  )

  const appliedRoleFromAnswers =
    getStringValue(parsedAnswers['rol_postulado']) ??
    application?.applied_role ??
    null
  const showErrorRef = useRef(showError)
  useEffect(() => {
    showErrorRef.current = showError
  }, [showError])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!postulacionId) {
        setIsLoading(false)
        setApplication(null)
        setFormSchema(null)
        return
      }

      setIsLoading(true)

      const { data, error } = await supabase
        .from('applications')
        .select(
          `
        id,
        applicant_profile_id,
        program_id,
        edition_id,
        status,
        payment_status,
        paid_at,
        applied_role,
        cv_url,
        answers,
        created_at,
        updated_at,
        form_id,
        program:programs(id,title,slug,payment_mode,requires_payment_pre),
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
          role,
          document_number,
          profile_status,
          skills,
          primary_role,
          email
        )
      `
        )
        .eq('id', postulacionId)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        setApplication(null)
        setFormSchema(null)
        setIsLoading(false)
        showErrorRef.current('No se pudo cargar la postulación', error.message)
        return
      }

      if (!data) {
        setApplication(null)
        setFormSchema(null)
        setIsLoading(false)
        return
      }

      const row = data as unknown as SupabaseApplicationRow

      const programObject = pickObject(row.program)
      const editionObject = pickObject(row.edition)
      const applicantObject = pickObject(row.applicant_profile)

      const next: ApplicationRow = {
        id: String(row.id),
        applicant_profile_id: String(row.applicant_profile_id),
        program_id: String(row.program_id),
        edition_id: pickString(row.edition_id),
        status: isApplicationStatus(row.status) ? row.status : 'received',
        payment_status: isPaymentStatus(row.payment_status)
          ? row.payment_status
          : null,
        paid_at: pickString(row.paid_at),
        applied_role: pickString(row.applied_role),
        cv_url: pickString(row.cv_url),
        answers: (pickObject(row.answers) ?? {}) as ParsedAnswers,
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
        form_id: pickString(row.form_id),
        program: programObject
          ? {
              id: String(programObject['id']),
              title: pickString(programObject['title']),
              slug: pickString(programObject['slug']),
              payment_mode:
                (programObject['payment_mode'] as ProgramPaymentMode | null) ??
                null,
              requires_payment_pre: Boolean(
                programObject['requires_payment_pre']
              ),
            }
          : null,
        edition: editionObject
          ? {
              id: String(editionObject['id']),
              edition_name: pickString(editionObject['edition_name']),
            }
          : null,
        applicant_profile: applicantObject
          ? {
              id: String(applicantObject['id']),
              first_name: pickString(applicantObject['first_name']),
              last_name: pickString(applicantObject['last_name']),
              country_residence: pickString(
                applicantObject['country_residence']
              ),
              whatsapp_e164: pickString(applicantObject['whatsapp_e164']),
              linkedin_url: pickString(applicantObject['linkedin_url']),
              portfolio_url: pickString(applicantObject['portfolio_url']),
              english_level: pickString(applicantObject['english_level']),
              role: pickString(applicantObject['role']),
              document_number: pickString(applicantObject['document_number']),
              profile_status: pickString(applicantObject['profile_status']),
              primary_role: pickString(applicantObject['primary_role']),
              email: pickString(applicantObject['email']),
              skills: Array.isArray(applicantObject['skills'])
                ? (applicantObject['skills'].filter(
                    (item) => typeof item === 'string'
                  ) as string[])
                : null,
            }
          : null,
      }

      let nextSchema: FormSchema | null = null
      if (next.form_id) {
        const { data: formData } = await supabase
          .from('application_forms')
          .select('schema_json')
          .eq('id', next.form_id)
          .maybeSingle()

        if (!cancelled) {
          nextSchema = parseFormSchema(formData?.schema_json)
        }
      }
      if (cancelled) return
      setFormSchema(nextSchema)
      setApplication(next)
      setIsLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [postulacionId])

  async function updateApplicationStatus(nextStatus: ApplicationStatus) {
    if (!application?.id) return

    const paymentMode = resolvePaymentMode(application.program ?? null)
    const usesPaymentPending = paymentMode === 'post'
    let safeNextStatus: ApplicationStatus = nextStatus

    if (nextStatus === 'admitted' && usesPaymentPending) {
      safeNextStatus = 'payment_pending'
    }

    if (nextStatus === 'payment_pending' && !usesPaymentPending) {
      safeNextStatus = 'admitted'
    }

    setIsAdmitLoading(false)
    setIsPaymentPendingLoading(false)
    setIsEnrollLoading(false)
    setIsRejectLoading(false)

    if (safeNextStatus === 'in_review') setIsAdmitLoading(false) // no tenés loader propio para review acá
    if (safeNextStatus === 'payment_pending') setIsPaymentPendingLoading(true)
    if (safeNextStatus === 'enrolled') setIsEnrollLoading(true)
    if (safeNextStatus === 'rejected') setIsRejectLoading(true)
    if (safeNextStatus === 'received') {
      // sin loader extra
    }

    const { error } = await supabase
      .from('applications')
      .update({ status: safeNextStatus })
      .eq('id', application.id)

    setIsAdmitLoading(false)
    setIsPaymentPendingLoading(false)
    setIsEnrollLoading(false)
    setIsRejectLoading(false)

    if (error) {
      showError('No se pudo actualizar el estado', error.message)
      return
    }

    setApplication((previous) =>
      previous ? { ...previous, status: safeNextStatus } : previous
    )

    showSuccess('Actualizado', `Estado: ${textOrNA(safeNextStatus)}`)
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 md:px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <ApplicationStepper currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* IZQUIERDA */}
          <div className="lg:col-span-3">
            <ApplicantProfileCard
              applicant={applicant}
              applicantFullName={applicantFullName}
              application={application}
              appliedRoleFromAnswers={appliedRoleFromAnswers}
              showSuccess={showSuccess}
              showError={showError}
            />
          </div>

          {/* CENTRO */}
          <div className="lg:col-span-6">
            <ApplicationDetailsCard
              isLoading={isLoading}
              application={application}
              formSchema={formSchema}
            />
          </div>

          {/* DERECHA */}
          <div className="lg:col-span-3">
            <ApplicationWorkflowCard
              isLoading={isLoading}
              application={application}
              isAdmitLoading={isAdmitLoading}
              isPaymentPendingLoading={isPaymentPendingLoading}
              isEnrollLoading={isEnrollLoading}
              isRejectLoading={isRejectLoading}
              onUpdateStatus={updateApplicationStatus}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
