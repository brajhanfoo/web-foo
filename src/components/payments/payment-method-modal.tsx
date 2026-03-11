'use client'

import { useState } from 'react'
import { CreditCard, Wallet } from 'lucide-react'

import type { PaymentStatus } from '@/types/payments'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PayphoneCheckoutModal } from '@/components/payments/payphone-checkout-modal'

type PaymentPurpose = 'pre_enrollment' | 'tuition'

type CreateMercadoPagoPreferenceResponse = {
  ok: boolean
  message?: string
  paymentId?: string
  status?: PaymentStatus
  alreadyPaid?: boolean
  preferenceId?: string
  initPoint?: string
  sandboxInitPoint?: string
}

type PaymentMethodModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  programId: string
  editionId: string | null
  purpose: PaymentPurpose
  applicationId?: string | null
  amountCents: number
  onPaid?: (paymentId: string) => void
}

export function PaymentMethodModal(props: PaymentMethodModalProps) {
  const [payphoneOpen, setPayphoneOpen] = useState(false)
  const [isStartingMp, setIsStartingMp] = useState(false)
  const [methodError, setMethodError] = useState<string | null>(null)

  function openPayphone() {
    setMethodError(null)
    props.onOpenChange(false)
    setPayphoneOpen(true)
  }

  async function openMercadoPago() {
    setMethodError(null)
    setIsStartingMp(true)

    try {
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: props.programId,
          editionId: props.editionId,
          purpose: props.purpose,
          applicationId: props.applicationId ?? null,
          amountCents: props.amountCents,
        }),
        cache: 'no-store',
      })

      const data =
        (await response.json()) as CreateMercadoPagoPreferenceResponse

      if (!response.ok || !data.ok) {
        setMethodError(
          data.message ?? 'No se pudo iniciar Mercado Pago para este pago.'
        )
        return
      }

      if (data.status === 'paid' && data.paymentId) {
        props.onPaid?.(data.paymentId)
        props.onOpenChange(false)
        return
      }

      const checkoutUrl = data.initPoint ?? data.sandboxInitPoint
      if (!checkoutUrl) {
        setMethodError('Mercado Pago no devolvió una URL de checkout válida.')
        return
      }

      props.onOpenChange(false)
      window.location.assign(checkoutUrl)
    } catch (error) {
      setMethodError(
        error instanceof Error
          ? error.message
          : 'No se pudo iniciar Mercado Pago.'
      )
    } finally {
      setIsStartingMp(false)
    }
  }

  return (
    <>
      <Dialog open={props.open} onOpenChange={props.onOpenChange}>
        <DialogContent className="border border-white/10 bg-[#0F1117] text-white">
          <DialogHeader>
            <DialogTitle>Selecciona tu metodo de pago</DialogTitle>
            <DialogDescription className="text-white/60">
              Puedes pagar con Payphone o Mercado Pago Checkout Pro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Button
              type="button"
              className="h-12 w-full justify-between bg-[#00CCA4] text-black hover:bg-[#00CCA4]/90"
              onClick={openPayphone}
              disabled={isStartingMp}
            >
              <span>Pagar con Payphone</span>
              <CreditCard className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              className="h-12 w-full justify-between border border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => void openMercadoPago()}
              disabled={isStartingMp}
            >
              <span>
                {isStartingMp
                  ? 'Iniciando Mercado Pago...'
                  : 'Pagar con Mercado Pago'}
              </span>
              <Wallet className="h-4 w-4" />
            </Button>

            {methodError ? (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {methodError}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <PayphoneCheckoutModal
        open={payphoneOpen}
        onOpenChange={setPayphoneOpen}
        programId={props.programId}
        editionId={props.editionId}
        purpose={props.purpose}
        applicationId={props.applicationId}
        amountCents={props.amountCents}
        onPaid={props.onPaid}
      />
    </>
  )
}

