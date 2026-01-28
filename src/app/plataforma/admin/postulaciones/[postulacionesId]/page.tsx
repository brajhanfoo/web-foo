// page.tsx (REEMPLAZO COMPLETO) - usando tus componentes (stepper + profile + details + right column)
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'

import type {
  ApplicationRow,
  ApplicationStatus,
  ParsedAnswers,
} from './types/types'
import {
  getBooleanValue,
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
    value === 'payment_pending' ||
    value === 'enrolled' ||
    value === 'rejected'
  )
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

export default function ApplicationDetailClientPage() {
  const rawParams = useParams() as Record<string, string | string[] | undefined>
  const postulacionId = useMemo(
    () => normalizeParam(rawParams?.postulacionesId),
    [rawParams?.postulacionesId]
  )

  const { showError, showSuccess } = useToastEnhanced()

  const [isLoading, setIsLoading] = useState(true)
  const [application, setApplication] = useState<ApplicationRow | null>(null)

  const [isAdmitLoading, setIsAdmitLoading] = useState(false)
  const [isPaymentPendingLoading, setIsPaymentPendingLoading] = useState(false)
  const [isEnrollLoading, setIsEnrollLoading] = useState(false)
  const [isRejectLoading, setIsRejectLoading] = useState(false)

  const parsedAnswers = useMemo<ParsedAnswers>(
    () => application?.answers ?? {},
    [application?.answers]
  )

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
        setIsLoading(false)
        showErrorRef.current('No se pudo cargar la postulación', error.message)
        return
      }

      if (!data) {
        setApplication(null)
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

    // Seguridad extra: si por algún motivo te llega "admitted", lo forzamos
    const safeNextStatus: ApplicationStatus =
      nextStatus === ('admitted' as unknown as ApplicationStatus)
        ? 'payment_pending'
        : nextStatus

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
              experienceText={experienceText}
              technologiesText={technologiesText}
              motivationText={motivationText}
              shiftMorning={shiftMorning}
              shiftAfternoon={shiftAfternoon}
              shiftNight={shiftNight}
              acceptTerms={acceptTerms}
              acceptAvailability={acceptAvailability}
              acceptQuorum={acceptQuorum}
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
