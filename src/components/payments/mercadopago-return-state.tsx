'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { PaymentStatus } from '@/types/payments'

type ReturnVariant = 'success' | 'failure' | 'pending'

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
      mercadopago: {
        mp_status: string | null
        status_detail: string | null
      } | null
      nextUrl: string | null
    }
  | { ok: false; message: string }

function titleByVariant(variant: ReturnVariant): string {
  if (variant === 'success') return 'Retorno de Mercado Pago: Exito'
  if (variant === 'failure') return 'Retorno de Mercado Pago: Fallo'
  return 'Retorno de Mercado Pago: Pendiente'
}

function subtitleByVariant(variant: ReturnVariant): string {
  if (variant === 'success') {
    return 'Mercado Pago te redirigio con estado de exito. Validaremos el estado real en servidor.'
  }
  if (variant === 'failure') {
    return 'Mercado Pago te redirigio con estado de fallo. Validaremos el estado real en servidor.'
  }
  return 'Mercado Pago te redirigio con estado pendiente. Validaremos el estado real en servidor.'
}

function canonicalBadge(status: PaymentStatus | null): {
  label: string
  className: string
} {
  if (status === 'paid') {
    return {
      label: 'Estado canonico: pagado',
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    }
  }
  if (status === 'failed' || status === 'canceled') {
    return {
      label: 'Estado canonico: no pagado',
      className: 'border-red-500/30 bg-red-500/10 text-red-200',
    }
  }
  if (status === 'pending' || status === 'initiated') {
    return {
      label: 'Estado canonico: pendiente',
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    }
  }
  return {
    label: 'Estado canonico: sin datos',
    className: 'border-white/20 bg-white/5 text-white/70',
  }
}

export function MercadoPagoReturnState(props: { variant: ReturnVariant }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const externalReference = searchParams.get('external_reference')
  const preferenceId =
    searchParams.get('preference_id') ?? searchParams.get('preference-id')
  const paymentId = searchParams.get('payment_id') ?? searchParams.get('id')
  const reportedStatus = searchParams.get('status')

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [canonicalStatus, setCanonicalStatus] = useState<PaymentStatus | null>(
    null
  )
  const [statusDetail, setStatusDetail] = useState<string | null>(null)
  const [nextUrl, setNextUrl] = useState<string | null>(null)
  const [pollTick, setPollTick] = useState(0)

  const fetchUrl = useMemo(() => {
    const query = new URLSearchParams()
    if (externalReference) query.set('external_reference', externalReference)
    if (preferenceId) query.set('preference_id', preferenceId)
    if (paymentId) query.set('payment_id', paymentId)
    const params = query.toString()
    return params ? `/api/mercadopago/payment-status?${params}` : null
  }, [externalReference, preferenceId, paymentId])

  useEffect(() => {
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    const run = async () => {
      if (!fetchUrl) {
        setErrorMessage('No llegaron identificadores para consultar el pago.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await fetch(fetchUrl, { cache: 'no-store' })
        const json = (await response.json()) as StatusApiResponse

        if (cancelled) return

        if (!response.ok || !json.ok) {
          const message =
            typeof json === 'object' && json && 'message' in json
              ? json.message
              : 'No se pudo consultar el estado real del pago.'
          setErrorMessage(message)
          setCanonicalStatus(null)
          setStatusDetail(null)
          setIsLoading(false)
          return
        }

        setCanonicalStatus(json.payment.status)
        setStatusDetail(json.mercadopago?.status_detail ?? null)
        setNextUrl(json.nextUrl ?? null)
        setIsLoading(false)

        if (
          !cancelled &&
          (json.payment.status === 'pending' || json.payment.status === 'initiated')
        ) {
          retryTimer = setTimeout(() => {
            setPollTick((prev) => prev + 1)
          }, 3500)
        }
      } catch (error) {
        if (cancelled) return
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No se pudo consultar el estado real del pago.'
        )
        setCanonicalStatus(null)
        setStatusDetail(null)
        setNextUrl(null)
        setIsLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [fetchUrl, pollTick])

  useEffect(() => {
    if (canonicalStatus !== 'paid' || !nextUrl) return

    const redirectTimer = setTimeout(() => {
      router.replace(nextUrl)
    }, 1200)

    return () => clearTimeout(redirectTimer)
  }, [canonicalStatus, nextUrl, router])

  const badge = canonicalBadge(canonicalStatus)

  return (
    <div className="min-h-dvh bg-black px-6 py-10">
      <div className="mx-auto w-full max-w-2xl space-y-4 rounded-2xl border border-white/10 bg-black/60 p-6 text-white">
        <h1 className="text-xl font-semibold">
          {titleByVariant(props.variant)}
        </h1>
        <p className="text-sm text-white/70">
          {subtitleByVariant(props.variant)}
        </p>

        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/70">
          Estado recibido por query param (informativo):{' '}
          <span className="font-semibold text-white/90">
            {reportedStatus ?? 'no informado'}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Loader2 className="h-4 w-4 animate-spin" />
            Consultando estado real del pago...
          </div>
        ) : null}

        {!isLoading ? (
          <Badge className={badge.className}>{badge.label}</Badge>
        ) : null}

        {canonicalStatus === 'paid' && nextUrl ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            Pago confirmado. Redirigiendo al siguiente paso...
          </div>
        ) : null}

        {statusDetail ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/70">
            Detalle Mercado Pago: {statusDetail}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            asChild
            className="bg-[#00CCA4] text-black hover:bg-[#00CCA4]/90"
          >
            <Link href="/plataforma/talento/mis-postulaciones">
              Ir a mis postulaciones
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/plataforma/talento/explorar">Volver a explorar</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
