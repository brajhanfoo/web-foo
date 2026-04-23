'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'

import type { PaymentStatus } from '@/types/payments'
import type { ProgramPaymentVariant } from '@/types/programs'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type PaymentPurpose = 'pre_enrollment' | 'tuition'
type CreateCheckoutResponse = {
  ok: boolean
  message?: string
  paymentId?: string
  status?: PaymentStatus
  alreadyPaid?: boolean
  clientTxId?: string
  token?: string
  storeId?: string
  amount?: number
  amountWithoutTax?: number
  amountWithTax?: number
  tax?: number
  currency?: string
  reference?: string
}

type PayphoneCheckoutModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  programId: string
  editionId: string | null
  purpose: PaymentPurpose
  applicationId?: string | null
  paymentVariant: ProgramPaymentVariant
  onPaid?: (paymentId: string) => void
}

type PayphoneBoxOptions = {
  token: string
  clientTransactionId: string
  amount: number
  amountWithoutTax: number
  amountWithTax: number
  tax: number
  currency: string
  storeId: string
  reference?: string
}

type PayphoneBoxInstance = {
  render: (containerId: string) => void
}

type PayphoneBoxConstructor = new (
  options: PayphoneBoxOptions
) => PayphoneBoxInstance

const PAYPHONE_SCRIPT_ID = 'payphone-payment-box-script'
const PAYPHONE_STYLE_ID = 'payphone-payment-box-style'
const PAYPHONE_SCRIPT_SRC =
  'https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.js'
const PAYPHONE_STYLE_SRC =
  'https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.css'

function buildRequestKey(props: PayphoneCheckoutModalProps): string {
  return [
    props.programId,
    props.editionId ?? 'none',
    props.purpose,
    props.applicationId ?? 'none',
    props.paymentVariant,
  ].join('|')
}

function ensurePayphoneAssets(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No DOM'))

  const w = window as Window & { PPaymentButtonBox?: PayphoneBoxConstructor }
  if (w.PPaymentButtonBox) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const d = window.document

    if (!d.getElementById(PAYPHONE_STYLE_ID)) {
      const link = d.createElement('link')
      link.id = PAYPHONE_STYLE_ID
      link.rel = 'stylesheet'
      link.href = PAYPHONE_STYLE_SRC
      d.head.appendChild(link)
    }

    const existing = d.getElementById(
      PAYPHONE_SCRIPT_ID
    ) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('No se pudo cargar PayPhone')),
        {
          once: true,
        }
      )
      return
    }

    const script = d.createElement('script')
    script.id = PAYPHONE_SCRIPT_ID
    script.type = 'module'
    script.src = PAYPHONE_SCRIPT_SRC
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('No se pudo cargar PayPhone'))
    d.head.appendChild(script)
  })
}

export function PayphoneCheckoutModal(props: PayphoneCheckoutModalProps) {
  const router = useRouter()
  const toast = useToastEnhanced()

  const [requestKey, setRequestKey] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [alreadyPaid, setAlreadyPaid] = useState(false)

  const [clientTxId, setClientTxId] = useState<string | null>(null)
  const [boxOptions, setBoxOptions] = useState<PayphoneBoxOptions | null>(null)
  const [boxError, setBoxError] = useState<string | null>(null)

  const latestKeyRef = useRef<string>('')
  const inFlightKeyRef = useRef<string | null>(null)

  const containerId = useMemo(
    () => (paymentId ? `payphone-box-${paymentId}` : 'payphone-box'),
    [paymentId]
  )

  const isReady = useMemo(() => Boolean(boxOptions), [boxOptions])

  useEffect(() => {
    if (!props.open) {
      setIsLoading(false)
      setPaymentId(null)
      setErrorMessage(null)
      setAlreadyPaid(false)
      setClientTxId(null)
      setBoxOptions(null)
      setBoxError(null)
      setRequestKey('')
      latestKeyRef.current = ''
      inFlightKeyRef.current = null
      return
    }

    const nextKey = buildRequestKey(props)
    if (requestKey === nextKey) return

    setRequestKey(nextKey)
    latestKeyRef.current = nextKey

    void startCheckout(nextKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.open,
    props.programId,
    props.editionId,
    props.purpose,
    props.applicationId,
    props.paymentVariant,
  ])

  useEffect(() => {
    if (!boxOptions || !paymentId || !props.open) return

    let cancelled = false

    const run = async () => {
      try {
        await ensurePayphoneAssets()
        if (cancelled) return

        const w = window as Window & {
          PPaymentButtonBox?: PayphoneBoxConstructor
        }
        const Constructor = w.PPaymentButtonBox
        if (!Constructor) {
          setBoxError('No se pudo inicializar PayPhone.')
          return
        }

        const container = document.getElementById(containerId)
        if (!container) return
        container.innerHTML = ''

        const instance = new Constructor(boxOptions)
        instance.render(containerId)
      } catch (err) {
        setBoxError(
          'No pudimos cargar el módulo de pago. Inténtalo nuevamente.'
        )
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [boxOptions, containerId, paymentId, props.open])

  async function startCheckout(currentKey: string) {
    if (inFlightKeyRef.current === currentKey) return
    inFlightKeyRef.current = currentKey

    setIsLoading(true)
    setErrorMessage(null)
    setAlreadyPaid(false)
    setClientTxId(null)
    setBoxOptions(null)
    setBoxError(null)

    try {
      const response = await fetch('/api/payphone/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: props.programId,
          editionId: props.editionId,
          purpose: props.purpose,
          applicationId: props.applicationId ?? null,
          paymentVariant: props.paymentVariant,
          payment_variant: props.paymentVariant,
        }),
        cache: 'no-store',
      })

      const data = (await response.json()) as CreateCheckoutResponse
      if (latestKeyRef.current !== currentKey) return

      if (!data.ok) {
        setErrorMessage(data.message ?? 'No se pudo iniciar el pago.')
        return
      }

      if (data.paymentId) setPaymentId(data.paymentId)
      setAlreadyPaid(Boolean(data.alreadyPaid))

      if (data.status === 'paid' && data.paymentId) {
        props.onPaid?.(data.paymentId)
        toast.showSuccess('Pago confirmado.')
        return
      }

      if (
        data.token &&
        data.clientTxId &&
        data.storeId &&
        typeof data.amount === 'number' &&
        typeof data.amountWithoutTax === 'number' &&
        typeof data.amountWithTax === 'number' &&
        typeof data.tax === 'number' &&
        data.currency
      ) {
        setClientTxId(data.clientTxId)

        setBoxOptions({
          token: data.token,
          clientTransactionId: data.clientTxId,
          amount: data.amount,
          amountWithoutTax: data.amountWithoutTax,
          amountWithTax: data.amountWithTax,
          tax: data.tax,
          currency: data.currency,
          storeId: data.storeId,
          reference: data.reference,
        })
      } else {
        setBoxError(
          'No pudimos preparar el pago en este momento. Inténtalo nuevamente.'
        )
      }
    } catch {
      setErrorMessage('No se pudo iniciar el pago.')
    } finally {
      setIsLoading(false)
      inFlightKeyRef.current = null
    }
  }

  function goToConfirm() {
    if (!clientTxId) return
    const params = new URLSearchParams()
    params.set('clientTxId', clientTxId)
    router.push(`/confirm-payment?${params.toString()}`)
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="border border-white/10 bg-[#0F1117] text-white">
        <DialogHeader>
          <DialogTitle>Completa tu pago</DialogTitle>
          <DialogDescription className="text-white/60">
            Finaliza la transacción dentro de la caja de PayPhone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generando checkout…
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {alreadyPaid ? (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Este pago ya fue registrado. Puedes continuar.
            </div>
          ) : null}

          {boxError ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              {boxError}
            </div>
          ) : null}

          {isReady ? (
            <div className="rounded-md border border-white/10 bg-black/40 p-3">
              <div id={containerId} />
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={goToConfirm} disabled={!clientTxId || isLoading}>
            Ya pagué, verificar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
