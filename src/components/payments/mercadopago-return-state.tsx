'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle2, Clock3, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { PaymentStatus } from '@/types/payments'

type ReturnVariant = 'success' | 'failure' | 'pending'
type PresentationState = 'success' | 'pending' | 'error'

type StatusApiResponse =
  | {
      ok: true
      payment: {
        id: string
        status: PaymentStatus
        provider: string
        purpose: string
        application_id: string | null
        paid_at: string | null
      }
      nextUrl?: string | null
    }
  | { ok: false; message: string }

const SUCCESS_REDIRECT_PATH = '/plataforma/talento/mis-postulaciones'
const SUCCESS_REDIRECT_SECONDS = 5
const STATUS_POLL_INTERVAL_MS = 2500
const STATUS_POLL_MAX_DURATION_MS = 20000

function normalizeStatusHint(value: string | null): string | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  return normalized || null
}

function resolveQueryHint(
  variant: ReturnVariant,
  reportedStatus: string | null
): PresentationState {
  const normalized = normalizeStatusHint(reportedStatus)

  if (normalized === 'approved') return 'success'
  if (
    normalized === 'pending' ||
    normalized === 'in_process' ||
    normalized === 'in_mediation'
  ) {
    return 'pending'
  }
  if (
    normalized === 'rejected' ||
    normalized === 'cancelled' ||
    normalized === 'canceled' ||
    normalized === 'failed' ||
    normalized === 'failure'
  ) {
    return 'error'
  }

  if (variant === 'failure') return 'error'
  if (variant === 'pending') return 'pending'

  // On success route we do not assume definitive success without backend.
  return 'pending'
}

function resolvePaymentPresentationState(params: {
  backendStatus: PaymentStatus | null
  backendLookupFailed: boolean
  queryHint: PresentationState
}): PresentationState {
  if (params.backendStatus === 'paid') return 'success'
  if (
    params.backendStatus === 'pending' ||
    params.backendStatus === 'initiated'
  ) {
    return 'pending'
  }
  if (
    params.backendStatus === 'failed' ||
    params.backendStatus === 'canceled'
  ) {
    return 'error'
  }

  if (params.backendLookupFailed) {
    return params.queryHint === 'error' ? 'error' : 'pending'
  }

  return params.queryHint
}

function normalizeWhatsAppNumber(value: string | undefined): string {
  return (value ?? '').replace(/[^\d]/g, '')
}

function safeRedirectPath(value: string | null | undefined): string | null {
  if (!value) return null
  const normalized = value.trim()
  if (!normalized.startsWith('/') || normalized.startsWith('//')) {
    return null
  }
  return normalized
}

function buildSupportWhatsAppUrl(): string | null {
  const number = normalizeWhatsAppNumber(
    process.env.NEXT_PUBLIC_PAYMENT_SUPPORT_WHATSAPP
  )
  if (!number) return null

  const text =
    'Hola, necesito ayuda para validar un pago realizado por Mercado Pago.'
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}

export function MercadoPagoReturnState(props: { variant: ReturnVariant }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectInProgressRef = useRef(false)

  const externalReference = searchParams.get('external_reference')
  const preferenceId =
    searchParams.get('preference_id') ?? searchParams.get('preference-id')
  const paymentId = searchParams.get('payment_id') ?? searchParams.get('id')
  const reportedStatus =
    searchParams.get('status') ?? searchParams.get('collection_status')

  const [isLoading, setIsLoading] = useState(true)
  const [backendStatus, setBackendStatus] = useState<PaymentStatus | null>(null)
  const [backendLookupFailed, setBackendLookupFailed] = useState(false)
  const [resolvedNextUrl, setResolvedNextUrl] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(SUCCESS_REDIRECT_SECONDS)

  const supportUrl = useMemo(() => buildSupportWhatsAppUrl(), [])

  const fetchUrl = useMemo(() => {
    const query = new URLSearchParams()
    if (externalReference) query.set('external_reference', externalReference)
    if (preferenceId) query.set('preference_id', preferenceId)
    if (paymentId) query.set('payment_id', paymentId)
    const params = query.toString()
    return params ? `/api/mercadopago/payment-status?${params}` : null
  }, [externalReference, preferenceId, paymentId])

  const queryHint = useMemo(
    () => resolveQueryHint(props.variant, reportedStatus),
    [props.variant, reportedStatus]
  )

  const presentationState = useMemo(
    () =>
      resolvePaymentPresentationState({
        backendStatus,
        backendLookupFailed,
        queryHint,
      }),
    [backendStatus, backendLookupFailed, queryHint]
  )

  useEffect(() => {
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    const startedAtMs = Date.now()

    const canRetry = () =>
      Date.now() - startedAtMs < STATUS_POLL_MAX_DURATION_MS

    const scheduleRetry = (run: () => Promise<void>) => {
      if (!canRetry()) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      retryTimer = setTimeout(() => {
        void run()
      }, STATUS_POLL_INTERVAL_MS)
    }

    const run = async () => {
      if (!fetchUrl) {
        if (!cancelled) {
          setBackendStatus(null)
          setBackendLookupFailed(true)
          setIsLoading(false)
        }
        return
      }

      try {
        const response = await fetch(fetchUrl, { cache: 'no-store' })
        const json = (await response.json()) as StatusApiResponse
        if (cancelled) return

        if (!response.ok || !json.ok) {
          setBackendStatus(null)
          setBackendLookupFailed(true)
          scheduleRetry(run)
          return
        }

        setBackendStatus(json.payment.status)
        setBackendLookupFailed(false)
        setResolvedNextUrl(safeRedirectPath(json.nextUrl))

        if (
          json.payment.status === 'pending' ||
          json.payment.status === 'initiated'
        ) {
          scheduleRetry(run)
          return
        }

        setIsLoading(false)
      } catch {
        if (cancelled) return
        setBackendStatus(null)
        setBackendLookupFailed(true)
        scheduleRetry(run)
      }
    }

    setIsLoading(true)
    void run()

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [fetchUrl])

  useEffect(() => {
    if (presentationState !== 'success') {
      setCountdown(SUCCESS_REDIRECT_SECONDS)
      redirectInProgressRef.current = false
      return
    }

    setCountdown(SUCCESS_REDIRECT_SECONDS)
    const timer = setInterval(() => {
      setCountdown((previous) => (previous <= 1 ? 0 : previous - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [presentationState])

  useEffect(() => {
    if (presentationState !== 'success') return
    if (countdown > 0 || redirectInProgressRef.current) return

    redirectInProgressRef.current = true
    router.replace(resolvedNextUrl ?? SUCCESS_REDIRECT_PATH)
  }, [countdown, presentationState, resolvedNextUrl, router])

  function redirectNow() {
    if (redirectInProgressRef.current) return
    redirectInProgressRef.current = true
    router.replace(resolvedNextUrl ?? SUCCESS_REDIRECT_PATH)
  }

  const isValidationErrorState =
    !isLoading && backendLookupFailed && backendStatus === null

  const title =
    presentationState === 'success'
      ? 'Pago exitoso'
      : presentationState === 'pending'
        ? 'Estamos validando tu pago'
        : isValidationErrorState
          ? 'Error al validar el pago'
          : 'No pudimos confirmar tu pago'

  const message =
    presentationState === 'success'
      ? 'Tu pago fue procesado correctamente y tu postulación quedó actualizada.'
      : presentationState === 'pending'
        ? 'Recibimos tu operación, pero todavía no pudimos confirmarla de forma definitiva.'
        : isValidationErrorState
          ? 'No pudimos validar tu pago en este momento por un problema temporal.'
          : 'Ocurrió un problema al procesar o validar tu pago.'

  const secondary =
    presentationState === 'success'
      ? `Serás redirigido en ${countdown} segundos...`
      : 'Si el estado no se actualiza en breve, contáctanos por WhatsApp para ayudarte.'

  return (
    <div className="min-h-dvh bg-black px-6 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-black/60 p-6 text-white">
        <div className="mb-5 flex items-center gap-3">
          {presentationState === 'success' ? (
            <CheckCircle2
              className="h-7 w-7 text-emerald-300"
              aria-hidden="true"
            />
          ) : presentationState === 'pending' ? (
            <Clock3 className="h-7 w-7 text-amber-300" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-7 w-7 text-red-300" aria-hidden="true" />
          )}
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>

        <p className="text-sm text-white/85">{message}</p>
        <p className="mt-2 text-sm text-white/65">{secondary}</p>

        {isLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-white/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Validando estado del pago...
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {presentationState === 'success' ? (
            <Button
              type="button"
              className="bg-[#00CCA4] text-black hover:bg-[#00CCA4]/90"
              onClick={redirectNow}
            >
              Ir ahora a mis postulaciones
            </Button>
          ) : supportUrl ? (
            <Button
              asChild
              className="bg-[#00CCA4] text-black hover:bg-[#00CCA4]/90"
            >
              <a href={supportUrl} target="_blank" rel="noopener noreferrer">
                Contactar soporte
              </a>
            </Button>
          ) : (
            <Button type="button" disabled>
              Contáctanos por soporte
            </Button>
          )}

          <Button asChild variant="secondary">
            <Link href={resolvedNextUrl ?? SUCCESS_REDIRECT_PATH}>
              Ir a mis postulaciones
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
