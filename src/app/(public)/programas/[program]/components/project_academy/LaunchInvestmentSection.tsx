'use client'

import { useEffect, useMemo, useState } from 'react'
import { FiCalendar, FiClock, FiMonitor } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import {
  formatCurrencyAmount,
  resolveProgramPricing,
  type ResolvedProgramPricing,
} from '@/lib/pricing'
import type { ProgramPaymentVariant, ProgramRow } from '@/types/programs'

type LaunchInvestmentSectionProps = {
  program: ProgramRow
  countryCode: string | null
  initialPricing: ResolvedProgramPricing
}

const LaunchInvestmentSection = (props: LaunchInvestmentSectionProps) => {
  const router = useRouter()
  const basePricing = useMemo(
    () => resolveProgramPricing(props.program, props.countryCode),
    [props.program, props.countryCode]
  )

  const [paymentVariant, setPaymentVariant] = useState<ProgramPaymentVariant>(
    basePricing.defaultPaymentVariant
  )

  useEffect(() => {
    setPaymentVariant(basePricing.defaultPaymentVariant)
  }, [basePricing.defaultPaymentVariant])

  const pricing = useMemo(
    () =>
      resolveProgramPricing(props.program, props.countryCode, paymentVariant),
    [props.program, props.countryCode, paymentVariant]
  )

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
  const listPriceLabel = formatCurrencyAmount({
    amount: pricing.listPrice,
    currency: pricing.displayCurrency,
    locale,
  })
  const installmentAmountLabel = formatCurrencyAmount({
    amount: pricing.installmentAmount,
    currency: pricing.displayCurrency,
    locale,
  })

  const canChooseVariant =
    pricing.showInstallmentsInUi &&
    pricing.hasInstallments &&
    pricing.singlePaymentPrice !== null

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-semibold text-white md:text-4xl">
          Inversion por Lanzamiento
        </h2>
        <p className="mt-3 text-sm text-white/60">
          Tu futuro profesional comienza con una decision inteligente.
        </p>
      </div>

      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-gradient-to-br from-[#1b1c12] via-[#15160f] to-[#0f100b] p-8 shadow-2xl">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-full bg-[#BDBE0B]/20 px-3 py-1 text-xs font-medium text-[#BDBE0B]">
                CUPOS LIMITADOS
              </span>
              {pricing.hasDiscount && pricing.discountPercent ? (
                <span className="inline-block rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                  {Math.round(pricing.discountPercent)}% OFF
                </span>
              ) : null}
            </div>

            {canChooseVariant ? (
              <div className="mt-6 inline-flex rounded-xl border border-white/10 bg-black/35 p-1">
                <button
                  type="button"
                  onClick={() => setPaymentVariant('installments')}
                  className={[
                    'rounded-lg px-3 py-2 text-xs font-semibold transition',
                    paymentVariant === 'installments'
                      ? 'bg-[#BDBE0B] text-black'
                      : 'text-white/80 hover:text-white',
                  ].join(' ')}
                >
                  Cuotas
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentVariant('single_payment')}
                  className={[
                    'rounded-lg px-3 py-2 text-xs font-semibold transition',
                    paymentVariant === 'single_payment'
                      ? 'bg-[#BDBE0B] text-black'
                      : 'text-white/80 hover:text-white',
                  ].join(' ')}
                >
                  Pago unico
                </button>
              </div>
            ) : null}

            <div className="mt-6">
              {pricing.hasListPrice && listPriceLabel ? (
                <p className="text-sm text-white/40 line-through">
                  {listPriceLabel}
                </p>
              ) : null}

              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold leading-none text-[#BDBE0B] sm:text-5xl">
                  {selectedPriceLabel ?? 'Proximamente'}
                </span>
              </div>

              {pricing.showInstallmentsInUi &&
              pricing.hasInstallments &&
              paymentVariant === 'installments' ? (
                <div className="mt-3 space-y-1 text-sm text-white/80">
                  {pricing.installmentsCount ? (
                    <p>
                      Hasta {pricing.installmentsCount} cuotas{' '}
                      {pricing.installmentsInterestFree === false
                        ? 'con interes'
                        : 'sin interes'}
                    </p>
                  ) : null}
                  {installmentAmountLabel ? (
                    <p>{installmentAmountLabel} por cuota</p>
                  ) : null}
                </div>
              ) : null}

              {paymentVariant === 'installments' && singlePriceLabel ? (
                <p className="mt-3 text-sm text-white/65">
                  Precio final en pago unico: {singlePriceLabel}
                </p>
              ) : null}

              <p className="mt-1 text-xs uppercase tracking-wide text-[#BDBE0B]/80">
                Precio promocional
              </p>

              <p className="mt-4 text-xs text-white/50">
                Configuracion de precios sincronizada desde la base de datos.
              </p>
            </div>

            <p className="mt-6 max-w-sm text-sm text-white/50">
              Aplica para iniciar tu proceso de admision y asegurar este precio.
            </p>
          </div>

          <div className="flex flex-col justify-between">
            <div className="space-y-4 text-sm text-white/80">
              <div className="flex items-start gap-3">
                <FiCalendar className="mt-0.5 h-4 w-4 text-[#BDBE0B]" />
                <div>
                  <p className="font-medium text-white">Inicio: 18 de mayo</p>
                  <p className="text-xs text-white/50">
                    Duracion de 12 semanas
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FiClock className="mt-0.5 h-4 w-4 text-[#BDBE0B]" />
                <div>
                  <p className="font-medium text-white">Formato Part-time</p>
                  <p className="text-xs text-white/50">
                    Turnos a eleccion: manana, tarde o noche.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FiMonitor className="mt-0.5 h-4 w-4 text-[#BDBE0B]" />
                <div>
                  <p className="font-medium text-white">100% Remoto en vivo</p>
                  <p className="text-xs text-white/50">
                    Workshops grabados disponibles 24/7.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/plataforma/talento')}
              className="mt-8 w-full rounded-xl bg-gradient-to-r from-[#BDBE0B] to-[#A5A70A] py-3 text-sm font-semibold text-black transition hover:opacity-90 cursor-pointer"
            >
              Asegurar mi cupo
            </button>

            <p className="mt-3 text-center text-xs text-white/40">
              Acceso inmediato tras admision � Cupos limitados por cohorte
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LaunchInvestmentSection
