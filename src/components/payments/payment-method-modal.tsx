'use client'

import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Wallet } from 'lucide-react'

import type { PaymentStatus } from '@/types/payments'
import type { ProgramPaymentVariant, ProgramRow } from '@/types/programs'
import { formatCurrencyAmount, resolveProgramPricing } from '@/lib/pricing'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PayphoneCheckoutModal } from '@/components/payments/payphone-checkout-modal'
import { buildPaymentSupportWhatsAppUrl } from '@/lib/payments/payment-support'

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
  program: ProgramRow
  countryCode: string | null
  editionId: string | null
  purpose: PaymentPurpose
  applicationId?: string | null
  onPaid?: (paymentId: string) => void
}

export function PaymentMethodModal(props: PaymentMethodModalProps) {
  const [payphoneOpen, setPayphoneOpen] = useState(false)
  const [isStartingMp, setIsStartingMp] = useState(false)
  const [methodError, setMethodError] = useState<string | null>(null)

  const [paymentVariant, setPaymentVariant] =
    useState<ProgramPaymentVariant>('single_payment')

  const pricing = useMemo(
    () =>
      resolveProgramPricing(props.program, props.countryCode, paymentVariant),
    [props.program, props.countryCode, paymentVariant]
  )

  useEffect(() => {
    setPaymentVariant(pricing.defaultPaymentVariant)
  }, [pricing.defaultPaymentVariant, props.open])

  const paymentSupportUrl = buildPaymentSupportWhatsAppUrl({
    purpose: props.purpose,
    programTitle: props.program.title,
  })

  const canChooseVariant =
    pricing.showInstallmentsInUi &&
    pricing.hasInstallments &&
    pricing.singlePaymentPrice !== null

  const canUsePayphone = pricing.checkoutCurrency === 'USD'

  const locale = pricing.displayCurrency === 'ARS' ? 'es-AR' : 'es-EC'
  const selectedPriceLabel = formatCurrencyAmount({
    amount: pricing.selectedPaymentPrice,
    currency: pricing.displayCurrency,
    locale,
  })
  const singlePriceLabel = formatCurrencyAmount({
    amount: pricing.singlePaymentPrice,
    currency: pricing.displayCurrency,
    locale,
  })
  const installmentsPriceLabel = formatCurrencyAmount({
    amount: pricing.installmentsPrice,
    currency: pricing.displayCurrency,
    locale,
  })
  const installmentAmountLabel = formatCurrencyAmount({
    amount: pricing.installmentAmount,
    currency: pricing.displayCurrency,
    locale,
  })

  function openPayphone() {
    setMethodError(null)
    props.onOpenChange(false)
    setPayphoneOpen(true)
  }

  async function openMercadoPago() {
    setMethodError(null)

    if (!pricing.selectedPaymentPrice) {
      setMethodError(
        'Esta modalidad de pago no está disponible en este momento.'
      )
      return
    }

    setIsStartingMp(true)

    try {
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: props.program.id,
          editionId: props.editionId,
          purpose: props.purpose,
          applicationId: props.applicationId ?? null,
          paymentVariant,
          payment_variant: paymentVariant,
        }),
        cache: 'no-store',
      })

      const data =
        (await response.json()) as CreateMercadoPagoPreferenceResponse

      if (!response.ok || !data.ok) {
        setMethodError(
          data.message?.trim() ||
            'No pudimos iniciar el pago. Inténtalo nuevamente.'
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
        setMethodError('No pudimos iniciar el pago. Inténtalo nuevamente.')
        return
      }

      props.onOpenChange(false)
      window.location.assign(checkoutUrl)
    } catch {
      setMethodError('No pudimos iniciar el pago. Inténtalo nuevamente.')
    } finally {
      setIsStartingMp(false)
    }
  }

  return (
    <>
      <Dialog open={props.open} onOpenChange={props.onOpenChange}>
        <DialogContent className="border border-white/10 bg-[#0F1117] text-white">
          <DialogHeader>
            <DialogTitle>Selecciona tu método de pago</DialogTitle>
            <DialogDescription className="text-white/60">
              Monto a pagar: {selectedPriceLabel ?? 'No configurado'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!canChooseVariant && pricing.displayCurrency === 'USD' ? (
              <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                Pago único en dólares.
              </div>
            ) : null}

            {canChooseVariant ? (
              <div className="rounded-lg border border-white/10 bg-black/40 p-3 space-y-2">
                <div className="text-xs uppercase tracking-wide text-white/50">
                  Modalidad de pago
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPaymentVariant('installments')}
                    className={[
                      'rounded-lg border px-3 py-2 text-left transition',
                      paymentVariant === 'installments'
                        ? 'border-[#00CCA4] bg-[#00CCA4]/15'
                        : 'border-white/15 bg-white/5 hover:bg-white/10',
                    ].join(' ')}
                  >
                    <div className="text-sm font-semibold">Cuotas</div>
                    <div className="text-xs text-white/70">
                      {installmentsPriceLabel ?? 'Sin precio'}
                    </div>
                    {pricing.installmentsCount ? (
                      <div className="text-xs text-white/50">
                        Hasta {pricing.installmentsCount} cuotas{' '}
                        {pricing.installmentsInterestFree === false
                          ? 'con interés'
                          : 'sin interés'}
                      </div>
                    ) : null}
                    {installmentAmountLabel ? (
                      <div className="text-xs text-white/50">
                        {installmentAmountLabel} por cuota
                      </div>
                    ) : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentVariant('single_payment')}
                    className={[
                      'rounded-lg border px-3 py-2 text-left transition',
                      paymentVariant === 'single_payment'
                        ? 'border-[#00CCA4] bg-[#00CCA4]/15'
                        : 'border-white/15 bg-white/5 hover:bg-white/10',
                    ].join(' ')}
                  >
                    <div className="text-sm font-semibold">Pago único</div>
                    <div className="text-xs text-white/70">
                      {singlePriceLabel ?? 'Sin precio'}
                    </div>
                  </button>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              {canUsePayphone ? (
                <Button
                  type="button"
                  className="h-12 w-full justify-between bg-[#00CCA4] text-black hover:bg-[#00CCA4]/90"
                  onClick={openPayphone}
                  disabled={isStartingMp || !pricing.selectedPaymentPrice}
                >
                  <span>Pagar con PayPhone</span>
                  <CreditCard className="h-4 w-4" />
                </Button>
              ) : (
                <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/65">
                  PayPhone está disponible solo para cobros en USD.
                </div>
              )}

              <Button
                type="button"
                className="h-12 w-full justify-between border border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={() => void openMercadoPago()}
                disabled={isStartingMp || !pricing.selectedPaymentPrice}
              >
                <span>
                  {isStartingMp
                    ? 'Iniciando Mercado Pago...'
                    : 'Pagar con Mercado Pago'}
                </span>
                <Wallet className="h-4 w-4" />
              </Button>
            </div>

            {methodError ? (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {methodError}
              </div>
            ) : null}

            <div className="pt-1 text-center">
              <a
                href={paymentSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/60 underline underline-offset-4 transition-colors hover:text-white/80"
              >
                ¿Necesitas otra forma de pago? Consulta opciones por WhatsApp
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PayphoneCheckoutModal
        open={payphoneOpen}
        onOpenChange={setPayphoneOpen}
        programId={props.program.id}
        editionId={props.editionId}
        purpose={props.purpose}
        applicationId={props.applicationId}
        paymentVariant={paymentVariant}
        onPaid={props.onPaid}
      />
    </>
  )
}
