'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type VerifyStatus = 'pending' | 'paid' | 'failed' | 'canceled'

type PayphoneConfirmResponse = {
  statusCode?: number
  message?: string
  transactionStatus?: string
  transactionId?: number | string
}

type PersistApprovedResponse = {
  ok: boolean
  message?: string
  redirectTo?: string | null
}

const PAYPHONE_CONFIRM_URL =
  'https://pay.payphonetodoesposible.com/api/button/V2/Confirm'

const MAX_ATTEMPTS = 12
const POLL_MS = 3000

function normalizeStatus(value: string): string {
  return (value ?? '').trim().toLowerCase()
}

function isApproved(response: PayphoneConfirmResponse): boolean {
  const ts = normalizeStatus(response.transactionStatus ?? '')
  const sc = Number(response.statusCode ?? 0)
  return ts === 'approved' || ts === 'success' || ts === 'paid' || sc === 3
}

function isRejected(response: PayphoneConfirmResponse): boolean {
  const ts = normalizeStatus(response.transactionStatus ?? '')
  const sc = Number(response.statusCode ?? 0)
  return (
    ts === 'rejected' || ts === 'declined' || ts.includes('fail') || sc === 2
  )
}

async function payphoneConfirmFromBrowser(params: {
  id: number
  clientTxId: string
}) {
  const token = process.env.NEXT_PUBLIC_PAYPHONE_TOKEN
  if (!token) throw new Error('Falta NEXT_PUBLIC_PAYPHONE_TOKEN')

  const res = await fetch(PAYPHONE_CONFIRM_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ id: params.id, clientTxId: params.clientTxId }),
    cache: 'no-store',
  })

  const raw = await res.text()
  let json: PayphoneConfirmResponse | null = null
  try {
    json = JSON.parse(raw) as PayphoneConfirmResponse
  } catch {
    json = null
  }

  return { ok: res.ok, status: res.status, raw, json }
}

export default function ConfirmPaymentClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const transactionId =
    searchParams.get('id') ?? searchParams.get('transactionId')

  const clientTxId =
    searchParams.get('clientTxId') ??
    searchParams.get('client_tx_id') ??
    searchParams.get('clientTransactionId') ??
    searchParams.get('client_transaction_id')

  const canceled = searchParams.get('canceled') === '1'

  const [status, setStatus] = useState<VerifyStatus>('pending')
  const [message, setMessage] = useState<string>('Verificando el pago...')
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(true)

  const attemptRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  const isFinal = useMemo(
    () => status === 'paid' || status === 'failed' || status === 'canceled',
    [status]
  )

  useEffect(() => {
    if (!clientTxId) {
      setStatus('failed')
      setMessage('Falta clientTxId.')
      setIsPolling(false)
      return
    }

    if (canceled) {
      setStatus('canceled')
      setMessage('Pago cancelado por el usuario.')
      setIsPolling(false)

      const transactionIdNum = transactionId ? Number(transactionId) : NaN
      if (Number.isFinite(transactionIdNum)) {
        void fetch('/api/payphone/persist-rejected', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientTxId,
            id: transactionIdNum,
            message: 'Pago cancelado por el usuario.',
            canceled: true,
          }),
          cache: 'no-store',
        })
      }

      return
    }

    attemptRef.current = 0
    setIsPolling(true)
    void verifyOnce()

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientTxId, transactionId, canceled])

  async function verifyOnce() {
    if (!clientTxId) return
    attemptRef.current += 1

    const transactionIdNum = transactionId ? Number(transactionId) : NaN
    if (!Number.isFinite(transactionIdNum)) {
      setStatus('failed')
      setMessage('Falta id (transactionId) en la URL. Debe venir de PayPhone.')
      setIsPolling(false)
      return
    }

    try {
      const confirm = await payphoneConfirmFromBrowser({
        id: transactionIdNum,
        clientTxId,
      })

      if (!confirm.ok || !confirm.json) {
        setStatus('failed')
        setMessage(
          `PayPhone respondio ${confirm.status}

${(confirm.raw ?? '').slice(0, 1000)}...`
        )
        setIsPolling(false)
        return
      }

      setCheckoutUrl(null)

      if (isApproved(confirm.json)) {
        const persistRes = await fetch('/api/payphone/persist-approved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientTxId, id: transactionIdNum }),
          cache: 'no-store',
        })

        const persist = (await persistRes.json()) as PersistApprovedResponse

        if (!persistRes.ok || !persist.ok) {
          setStatus('failed')
          setMessage(
            persist.message ?? 'No se pudo registrar el pago en el sistema.'
          )
          setIsPolling(false)
          return
        }

        setStatus('paid')
        setMessage('Pago confirmado.')
        setRedirectTo(persist.redirectTo ?? null)
        setIsPolling(false)

        const redirectTarget =
          persist.redirectTo ?? '/plataforma/talento/mis-postulaciones'
        timerRef.current = window.setTimeout(() => {
          router.replace(redirectTarget)
        }, 1200)

        return
      }

      if (isRejected(confirm.json)) {
        await fetch('/api/payphone/persist-rejected', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientTxId,
            id: transactionIdNum,
            message:
              confirm.json.message ??
              confirm.json.transactionStatus ??
              'rejected',
          }),
          cache: 'no-store',
        })

        setStatus('failed')
        setMessage(confirm.json.message ?? 'El pago fue rechazado.')
        setIsPolling(false)
        return
      }

      setStatus('pending')
      setMessage(
        confirm.json.message ?? 'Pago pendiente. Esperando confirmacion...'
      )

      if (attemptRef.current >= MAX_ATTEMPTS) {
        setIsPolling(false)
        setMessage('No pudimos confirmar el pago todavia. Intenta de nuevo.')
        return
      }

      timerRef.current = window.setTimeout(() => void verifyOnce(), POLL_MS)
    } catch (error) {
      setStatus('failed')
      setMessage(
        error instanceof Error ? error.message : 'No se pudo verificar el pago.'
      )
      setIsPolling(false)
    }
  }

  function statusMessage(current: VerifyStatus): string {
    if (current === 'paid') return 'Pago confirmado.'
    if (current === 'failed') return 'El pago fue rechazado.'
    if (current === 'canceled') return 'Pago cancelado.'
    return 'Pago pendiente. Esperando confirmacion...'
  }

  function openCheckout() {
    if (!checkoutUrl) return
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-dvh bg-black px-6 py-10">
      {!isPolling && status === 'failed' ? (
        <pre className="max-h-60 overflow-auto rounded-md border border-white/10 bg-black/40 p-3 text-xs text-white/70">
          {message}
        </pre>
      ) : null}

      <div className="mx-auto w-full max-w-xl">
        <Card className="border border-white/10 bg-black text-white">
          <CardHeader>
            <CardTitle>Confirmar pago</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-white/70">
              {isPolling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>{message || statusMessage(status)}</span>
            </div>

            {checkoutUrl ? (
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={openCheckout}
              >
                Abrir checkout <ExternalLink className="h-4 w-4" />
              </Button>
            ) : null}

            {isFinal && redirectTo ? (
              <Button
                type="button"
                className="w-full bg-[#00CCA4] text-black hover:bg-[#00CCA4]/90"
                onClick={() => router.replace(redirectTo)}
              >
                Continuar
              </Button>
            ) : null}

            {!isFinal && !isPolling ? (
              <Button type="button" onClick={() => void verifyOnce()}>
                Reintentar verificación
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
