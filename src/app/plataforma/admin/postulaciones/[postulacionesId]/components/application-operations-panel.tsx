'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import type { ApplicationRow, ApplicationStatus } from '../types/types'
import { PaymentProofDialog, type ProofInfo } from './payment-proofs-dialog'

type ProofPresence = 'unknown' | 'missing' | 'present'

type GetSignedUrlResponse =
  | { ok: true; proof: ProofInfo | null }
  | { ok: false; message: string }

type RecommendedAction = {
  title: string
  description: string
  ctaLabel: string | null
  loadingLabel?: string
  nextStatus?: ApplicationStatus
  disabled?: boolean
}

export function ApplicationOperationsPanel({
  application,

  showSuccess,
  showError,
  onUpdateStatus,

  isReviewLoading,
  isAdmitLoading,
  isRejectLoading,
  isEnrollLoading,
  isBackToReviewLoading,
  isBackToPaymentPendingLoading,
}: {
  application: ApplicationRow | null

  showSuccess: (title: string, description?: string) => void
  showError: (title: string, description?: string) => void

  onUpdateStatus: (nextStatus: ApplicationStatus) => Promise<void>

  isReviewLoading: boolean
  isAdmitLoading: boolean
  isRejectLoading: boolean
  isEnrollLoading: boolean
  isBackToReviewLoading: boolean
  isBackToPaymentPendingLoading: boolean
}) {
  const status: ApplicationStatus | null = application?.status ?? null
  const applicationId: string | null = application?.id ?? null
  const paymentStatus = application?.payment_status ?? null
  const program = application?.program ?? null
  const paymentMode =
    program?.payment_mode ?? (program?.requires_payment_pre ? 'pre' : 'none')
  const usesPaymentPending = paymentMode === 'post'

  const isReceived: boolean = status === 'received'
  const isInReview: boolean = status === 'in_review'
  const isInterviewFeedback: boolean = status === 'interview_feedback'
  const isAdmitted: boolean = status === 'admitted'
  const isPaymentPending: boolean = status === 'payment_pending'
  const isEnrolled: boolean = status === 'enrolled'
  const isRejected: boolean = status === 'rejected'

  const [proofPresence, setProofPresence] = useState<ProofPresence>('unknown')

  // Evita loops: solo chequea cuando cambia applicationId/status
  const lastCheckKeyRef = useRef<string>('')

  const phaseLabel: string = useMemo(() => {
    if (!status) return '-'
    if (isReceived) return 'Recibido'
    if (isInReview) return 'En revision'
    if (isInterviewFeedback) return 'Entrevista + feedback'
    if (isAdmitted) return 'Admitido'
    if (isPaymentPending) return 'Pago pendiente'
    if (isEnrolled) return 'Matriculado'
    if (isRejected) return 'Rechazado'
    return status
  }, [
    status,
    isReceived,
    isInReview,
    isInterviewFeedback,
    isAdmitted,
    isPaymentPending,
    isEnrolled,
    isRejected,
  ])

  const paymentBadge = useMemo(() => {
    if (!paymentStatus) return null
    if (paymentStatus === 'paid') {
      return {
        label: 'Pago confirmado',
        className: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
      }
    }
    if (paymentStatus === 'failed' || paymentStatus === 'canceled') {
      return {
        label: 'Pago rechazado',
        className: 'bg-red-500/15 text-red-200 border-red-400/30',
      }
    }
    return {
      label: 'Pago pendiente',
      className: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
    }
  }, [paymentStatus])

  // Chequeo liviano de presencia de comprobante (sin abrir modal)
  useEffect(() => {
    if (!applicationId) {
      setProofPresence('unknown')
      return
    }

    if (!usesPaymentPending) {
      setProofPresence('unknown')
      return
    }

    // Solo tiene sentido chequear si estás en payment_pending o enrolled
    if (!isPaymentPending && !isEnrolled) {
      setProofPresence('unknown')
      return
    }

    const key: string = `${applicationId}:${status ?? 'null'}`
    if (lastCheckKeyRef.current === key) return
    lastCheckKeyRef.current = key

    let cancelled = false

    async function run(): Promise<void> {
      try {
        const res: Response = await fetch(
          '/api/plataforma/payment-proofs/get-signed-url',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ application_id: applicationId }),
          }
        )

        const json: GetSignedUrlResponse =
          (await res.json()) as GetSignedUrlResponse

        if (cancelled) return

        if (!json.ok) {
          setProofPresence('missing')
          return
        }

        setProofPresence(json.proof ? 'present' : 'missing')
      } catch {
        if (cancelled) return
        setProofPresence('missing')
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [applicationId, status, isPaymentPending, isEnrolled, usesPaymentPending])

  const proofTriggerLabel: string = useMemo(() => {
    if (!usesPaymentPending) return 'Comprobante (no aplica)'
    if (!isPaymentPending && !isEnrolled) return 'Comprobante (bloqueado)'
    if (proofPresence === 'present') return 'Ver comprobante'
    return 'Subir comprobante'
  }, [usesPaymentPending, isPaymentPending, isEnrolled, proofPresence])

  const canSetInReview: boolean =
    Boolean(applicationId) && isReceived && !isReviewLoading

  const canMoveToInterview: boolean =
    Boolean(applicationId) && isInReview && !isReviewLoading

  const canAdmit: boolean =
    Boolean(applicationId) && isInterviewFeedback && !isAdmitLoading

  const admitTargetStatus: ApplicationStatus = usesPaymentPending
    ? 'payment_pending'
    : 'admitted'

  const canReject: boolean =
    Boolean(applicationId) &&
    (isReceived || isInReview || isInterviewFeedback || isAdmitted) &&
    !isRejectLoading

  const canBackToReview: boolean =
    Boolean(applicationId) &&
    (isInterviewFeedback ||
      (usesPaymentPending && isPaymentPending) ||
      (!usesPaymentPending && isAdmitted)) &&
    !isBackToReviewLoading

  const canBackToInterview: boolean =
    Boolean(applicationId) &&
    ((usesPaymentPending && isPaymentPending) ||
      (!usesPaymentPending && isAdmitted)) &&
    !isBackToReviewLoading

  const canBackToPrevious: boolean =
    Boolean(applicationId) && isEnrolled && !isBackToPaymentPendingLoading

  const canOpenProofDialog: boolean =
    usesPaymentPending &&
    Boolean(applicationId) &&
    (isPaymentPending || isEnrolled)

  const canEnrollNow: boolean =
    usesPaymentPending &&
    Boolean(applicationId) &&
    isPaymentPending &&
    proofPresence === 'present' &&
    !isEnrollLoading

  const canEnrollDirect: boolean =
    !usesPaymentPending &&
    Boolean(applicationId) &&
    isAdmitted &&
    !isEnrollLoading

  const recommendedAction: RecommendedAction = useMemo(() => {
    if (isReceived) {
      return {
        title: 'Siguiente paso recomendado',
        description:
          'Inicia la revisión para evaluar perfil, respuestas y evidencias del postulante.',
        ctaLabel: 'Iniciar revisión',
        loadingLabel: 'Marcando…',
        nextStatus: 'in_review',
        disabled: !canSetInReview,
      }
    }

    if (isInReview) {
      return {
        title: 'Siguiente paso recomendado',
        description:
          'Si cumple con lo esperado, envíalo a entrevista para feedback personalizado.',
        ctaLabel: 'Enviar a entrevista + feedback',
        loadingLabel: 'Enviando…',
        nextStatus: 'interview_feedback',
        disabled: !canMoveToInterview,
      }
    }

    if (isInterviewFeedback) {
      return {
        title: 'Siguiente paso recomendado',
        description: usesPaymentPending
          ? 'Tras la entrevista, habilita el pago de matrícula para continuar.'
          : 'Tras la entrevista, admite al postulante para habilitar matrícula.',
        ctaLabel: usesPaymentPending ? 'Pedir pago' : 'Admitir',
        loadingLabel: 'Actualizando…',
        nextStatus: admitTargetStatus,
        disabled: !canAdmit,
      }
    }

    if (usesPaymentPending && isPaymentPending) {
      return {
        title: 'Siguiente paso recomendado',
        description:
          proofPresence === 'present'
            ? 'El comprobante está cargado. Ya puedes confirmar la matrícula.'
            : 'Antes de matricular, solicita o valida el comprobante de pago.',
        ctaLabel: proofPresence === 'present' ? 'Confirmar matrícula' : null,
        loadingLabel: 'Matriculando...',
        nextStatus: proofPresence === 'present' ? 'enrolled' : undefined,
        disabled: !canEnrollNow,
      }
    }

    if (!usesPaymentPending && isAdmitted) {
      return {
        title: 'Siguiente paso recomendado',
        description:
          'Ya fue admitido. El próximo paso es confirmar la matrícula.',
        ctaLabel: 'Confirmar matrícula',
        loadingLabel: 'Matriculando...',
        nextStatus: 'enrolled',
        disabled: !canEnrollDirect,
      }
    }

    if (isEnrolled) {
      return {
        title: 'Proceso finalizado',
        description: 'El postulante ya está matriculado.',
        ctaLabel: null,
      }
    }

    if (isRejected) {
      return {
        title: 'Postulación cerrada',
        description:
          'Está rechazada. Si deseas reabrir el flujo, vuelve a “En revisión”.',
        ctaLabel: null,
      }
    }

    return {
      title: 'Estado actual',
      description: 'No hay acciones disponibles por el momento.',
      ctaLabel: null,
    }
  }, [
    isReceived,
    isInReview,
    isInterviewFeedback,
    isRejected,
    isEnrolled,
    isPaymentPending,
    usesPaymentPending,
    proofPresence,
    canSetInReview,
    canMoveToInterview,
    canAdmit,
    canEnrollNow,
    canEnrollDirect,
    admitTargetStatus,
  ])

  async function setStatus(nextStatus: ApplicationStatus): Promise<void> {
    await onUpdateStatus(nextStatus)

    // Reset de cache para que el chequeo se recalculen cuando corresponde
    if (
      nextStatus === 'received' ||
      nextStatus === 'in_review' ||
      nextStatus === 'interview_feedback'
    ) {
      setProofPresence('unknown')
      lastCheckKeyRef.current = ''
    }

    if (nextStatus === 'payment_pending' || nextStatus === 'enrolled') {
      lastCheckKeyRef.current = ''
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800 backdrop-blur-md overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">Acciones</CardTitle>
            <div className="text-xs text-slate-400 mt-1">
              Gestión del estado y pago
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge className="bg-slate-800 text-slate-100 border border-slate-800">
              {phaseLabel}
            </Badge>
            {paymentBadge ? (
              <Badge className={paymentBadge.className}>
                {paymentBadge.label}
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border border-[#00CCA4]/30 bg-[#00CCA4]/10 p-3 space-y-2">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[#7CF7DC]">
            {recommendedAction.title}
          </div>
          <div className="text-sm text-slate-100">
            {recommendedAction.description}
          </div>
          {recommendedAction.nextStatus && recommendedAction.ctaLabel ? (
            <Button
              className="w-full bg-[#00CCA4] text-black hover:bg-[#00e6b3]"
              disabled={Boolean(recommendedAction.disabled)}
              onClick={() => {
                const nextStatus = recommendedAction.nextStatus
                if (!nextStatus) return
                void setStatus(nextStatus)
              }}
            >
              {isReviewLoading &&
              recommendedAction.nextStatus === 'in_review' &&
              recommendedAction.loadingLabel
                ? recommendedAction.loadingLabel
                : isAdmitLoading &&
                    (recommendedAction.nextStatus === 'admitted' ||
                      recommendedAction.nextStatus === 'payment_pending') &&
                    recommendedAction.loadingLabel
                  ? recommendedAction.loadingLabel
                  : isEnrollLoading &&
                      recommendedAction.nextStatus === 'enrolled' &&
                      recommendedAction.loadingLabel
                    ? recommendedAction.loadingLabel
                    : recommendedAction.ctaLabel}
            </Button>
          ) : null}
        </div>

        {/* Fase 1 */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-slate-100">
              Fase 1 · Evaluación
            </div>
            <Badge
              variant="outline"
              className="border-slate-800 text-slate-200"
            >
              {isReceived || isInReview ? 'Activa' : 'OK'}
            </Badge>
          </div>

          {isReceived ? (
            <div className="space-y-2">
              <Button
                className="w-full"
                variant="secondary"
                disabled={!canSetInReview}
                onClick={() => setStatus('in_review')}
              >
                {isReviewLoading ? 'Marcando…' : 'Iniciar revisión'}
              </Button>

              <Button
                className="w-full"
                variant="outline"
                disabled={!canReject}
                onClick={() => setStatus('rejected')}
              >
                {isRejectLoading ? 'Rechazando…' : 'Rechazar'}
              </Button>
            </div>
          ) : null}

          {isInReview ? (
            <div className="space-y-2">
              <Button
                className="w-full"
                disabled={!canMoveToInterview}
                onClick={() => setStatus('interview_feedback')}
              >
                {isReviewLoading
                  ? 'Enviando…'
                  : 'Enviar a entrevista + feedback'}
              </Button>

              <Button
                className="w-full"
                variant="outline"
                disabled={!canReject}
                onClick={() => setStatus('rejected')}
              >
                {isRejectLoading ? 'Rechazando…' : 'Rechazar'}
              </Button>
            </div>
          ) : null}

          {isInterviewFeedback ? (
            <div className="space-y-2">
              <div className="text-xs text-slate-400">Marcar como:</div>
              <Button
                className="w-full"
                variant="outline"
                disabled={!canBackToReview}
                onClick={() => setStatus('in_review')}
              >
                {isBackToReviewLoading ? 'Volviendo...' : 'En revisión'}
              </Button>

              <Button
                className="w-full"
                disabled={!canAdmit}
                onClick={() => setStatus(admitTargetStatus)}
              >
                {isAdmitLoading
                  ? 'Actualizando…'
                  : usesPaymentPending
                    ? 'Pedir pago'
                    : 'Admitir'}
              </Button>

              <Button
                className="w-full"
                variant="outline"
                disabled={!canReject}
                onClick={() => setStatus('rejected')}
              >
                {isRejectLoading ? 'Rechazando…' : 'Rechazar'}
              </Button>
            </div>
          ) : null}

          {isRejected ? (
            <div className="text-xs text-slate-300">
              Postulación rechazada. Para volver a verla en flujo, marcala como{' '}
              <span className="text-slate-100">En revisión</span>.
            </div>
          ) : null}
        </div>

        {/* Fase 2 */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-slate-100">
              Fase 2 · Admisión y matrícula
            </div>
            <Badge
              variant="outline"
              className="border-slate-800 text-slate-200"
            >
              {usesPaymentPending
                ? isPaymentPending
                  ? 'Activa'
                  : isEnrolled
                    ? 'OK'
                    : 'Pendiente'
                : isAdmitted
                  ? 'Activa'
                  : isEnrolled
                    ? 'OK'
                    : 'Pendiente'}
            </Badge>
          </div>

          <div className="space-y-3">
            {usesPaymentPending ? (
              <>
                {/* PAYMENT_PENDING: registrar/ver comprobante + volver a revision + (si hay proof) matricular */}
                {isPaymentPending ? (
                  <>
                    <PaymentProofDialog
                      applicationId={applicationId}
                      triggerLabel={proofTriggerLabel}
                      showSuccess={showSuccess}
                      showError={showError}
                      disabled={!canOpenProofDialog}
                      onProofPresenceChange={(hasProof: boolean) =>
                        setProofPresence(hasProof ? 'present' : 'missing')
                      }
                    />
                    <Separator className="border-slate-800" />
                    <div className="text-xs text-slate-400">Marcar como:</div>

                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={!canBackToInterview}
                      onClick={() => setStatus('interview_feedback')}
                    >
                      {isBackToReviewLoading
                        ? 'Volviendo...'
                        : 'Volver a entrevista'}
                    </Button>

                    {proofPresence === 'present' ? (
                      <>
                        <Separator className="border-slate-800" />

                        <Button
                          className="w-full"
                          disabled={!canEnrollNow}
                          onClick={() => setStatus('enrolled')}
                        >
                          {isEnrollLoading
                            ? 'Matriculando...'
                            : 'Confirmar matrícula'}
                        </Button>
                      </>
                    ) : (
                      <div className="text-xs text-slate-400">
                        Cuando cargues el comprobante, se habilita{' '}
                        <span className="text-slate-100">Matricular</span>.
                      </div>
                    )}
                  </>
                ) : null}

                {/* ENROLLED: flujo inverso + opcional ver comprobante */}
                {isEnrolled ? (
                  <>
                    <PaymentProofDialog
                      applicationId={applicationId}
                      triggerLabel="Ver comprobante"
                      showSuccess={showSuccess}
                      showError={showError}
                      disabled={!canOpenProofDialog}
                      onProofPresenceChange={(hasProof: boolean) =>
                        setProofPresence(hasProof ? 'present' : 'missing')
                      }
                    />

                    <Separator className="border-slate-800" />
                    <div className="text-xs text-slate-400">Marcar como:</div>
                    <Button
                      className="w-full bg-[#00CCA4] text-black hover:bg-[#00e6b3] focus:ring-[#00e6b3]/50 cursor-pointer"
                      disabled={!canBackToPrevious}
                      onClick={() => setStatus('payment_pending')}
                    >
                      {isBackToPaymentPendingLoading
                        ? 'Volviendo...'
                        : 'Pendiente de pago'}
                    </Button>
                  </>
                ) : null}

                {/* Otros estados: mensaje */}
                {!isPaymentPending && !isEnrolled ? (
                  <div className="text-xs text-slate-400">
                    Para registrar pago, primero debe ser{' '}
                    <span className="text-slate-100">
                      Entrevista + feedback
                    </span>
                    .
                  </div>
                ) : null}
              </>
            ) : (
              <>
                {isAdmitted ? (
                  <>
                    <div className="text-xs text-slate-400">Marcar como:</div>

                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={!canBackToInterview}
                      onClick={() => setStatus('interview_feedback')}
                    >
                      {isBackToReviewLoading
                        ? 'Volviendo...'
                        : 'Volver a entrevista'}
                    </Button>

                    <Button
                      className="w-full"
                      disabled={!canEnrollDirect}
                      onClick={() => setStatus('enrolled')}
                    >
                      {isEnrollLoading
                        ? 'Matriculando...'
                        : 'Confirmar matrícula'}
                    </Button>

                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={!canReject}
                      onClick={() => setStatus('rejected')}
                    >
                      {isRejectLoading ? 'Rechazando...' : 'Rechazar'}
                    </Button>
                  </>
                ) : null}

                {isEnrolled ? (
                  <>
                    <div className="text-xs text-slate-400">Marcar como:</div>
                    <Button
                      className="w-full bg-[#00CCA4] text-black hover:bg-[#00e6b3] focus:ring-[#00e6b3]/50 cursor-pointer"
                      disabled={!canBackToPrevious}
                      onClick={() => setStatus('admitted')}
                    >
                      {isBackToPaymentPendingLoading
                        ? 'Volviendo...'
                        : 'Volver a admitido'}
                    </Button>
                  </>
                ) : null}

                {!isAdmitted && !isEnrolled ? (
                  <div className="text-xs text-slate-400">
                    Para matricular, primero debe ser{' '}
                    <span className="text-slate-100">
                      Entrevista + feedback
                    </span>
                    .
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

