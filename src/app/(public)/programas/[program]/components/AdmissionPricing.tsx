'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FaTasks, FaComments } from 'react-icons/fa'
import { AiOutlineCheckCircle } from 'react-icons/ai'
import {
  formatCurrencyAmount,
  resolveProgramPricing,
  type ResolvedProgramPricing,
} from '@/lib/pricing'
import type { ProgramPaymentVariant, ProgramRow } from '@/types/programs'

type AdmissionPricingProps = {
  program: ProgramRow
  countryCode: string | null
  initialPricing: ResolvedProgramPricing
}

const AdmissionPricing: React.FC<AdmissionPricingProps> = (props) => {
  const pricing = useMemo(
    () => resolveProgramPricing(props.program, props.countryCode),
    [props.program, props.countryCode]
  )

  const [paymentVariant, setPaymentVariant] = useState<ProgramPaymentVariant>(
    pricing.defaultPaymentVariant
  )

  useEffect(() => {
    setPaymentVariant(pricing.defaultPaymentVariant)
  }, [pricing.defaultPaymentVariant])

  const selectedPricing = useMemo(
    () =>
      resolveProgramPricing(props.program, props.countryCode, paymentVariant),
    [props.program, props.countryCode, paymentVariant]
  )

  const locale = selectedPricing.displayCurrency === 'ARS' ? 'es-AR' : 'es-EC'
  const selectedPriceLabel = formatCurrencyAmount({
    amount: selectedPricing.selectedPaymentPrice,
    currency: selectedPricing.displayCurrency,
    locale,
  })
  const listPriceLabel = formatCurrencyAmount({
    amount: selectedPricing.listPrice,
    currency: selectedPricing.displayCurrency,
    locale,
  })
  const singlePriceLabel = formatCurrencyAmount({
    amount: selectedPricing.singlePaymentPrice,
    currency: selectedPricing.displayCurrency,
    locale,
  })
  const installmentsPriceLabel = formatCurrencyAmount({
    amount: selectedPricing.installmentsPrice,
    currency: selectedPricing.displayCurrency,
    locale,
  })
  const installmentAmountLabel = formatCurrencyAmount({
    amount: selectedPricing.installmentAmount,
    currency: selectedPricing.displayCurrency,
    locale,
  })

  const canChooseVariant =
    selectedPricing.showInstallmentsInUi &&
    selectedPricing.hasInstallments &&
    selectedPricing.singlePaymentPrice !== null

  return (
    <section className="w-full bg-black text-white py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">
            Acceso al proceso de admisión
          </h2>
          <p className="text-gray-400 mt-4">
            Da el primer paso para ingresar a Smart Projects con una evaluación
            real de tu nivel.
          </p>
        </div>

        <div className="border border-gray-800 rounded-2xl p-8 md:p-10 bg-[#0A0A0A] flex flex-col md:flex-row gap-10 items-center justify-between">
          <div className="text-center md:text-left w-full md:w-auto">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                Cupos limitados
              </span>
              {selectedPricing.hasDiscount &&
              selectedPricing.discountPercent ? (
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                  {Math.round(selectedPricing.discountPercent)}% OFF
                </span>
              ) : null}
            </div>

            {canChooseVariant ? (
              <div className="mt-4 inline-flex rounded-lg border border-white/10 bg-black/40 p-1">
                <button
                  type="button"
                  onClick={() => setPaymentVariant('installments')}
                  className={[
                    'rounded-md px-3 py-2 text-xs font-semibold transition',
                    paymentVariant === 'installments'
                      ? 'bg-[#00CCA4] text-black'
                      : 'text-white/75 hover:text-white',
                  ].join(' ')}
                >
                  Cuotas
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentVariant('single_payment')}
                  className={[
                    'rounded-md px-3 py-2 text-xs font-semibold transition',
                    paymentVariant === 'single_payment'
                      ? 'bg-[#00CCA4] text-black'
                      : 'text-white/75 hover:text-white',
                  ].join(' ')}
                >
                  Pago único
                </button>
              </div>
            ) : null}

            <div className="mt-4">
              <h3 className="text-5xl font-bold text-white">
                {selectedPriceLabel ?? 'Proximamente'}
              </h3>
              {selectedPricing.hasListPrice && listPriceLabel ? (
                <p className="text-gray-500 text-sm mt-2 line-through">
                  {listPriceLabel}
                </p>
              ) : null}

              {selectedPricing.showInstallmentsInUi &&
              selectedPricing.hasInstallments &&
              paymentVariant === 'installments' ? (
                <div className="mt-2 text-sm text-gray-300">
                  {selectedPricing.installmentsCount ? (
                    <p>
                      Hasta {selectedPricing.installmentsCount} cuotas{' '}
                      {selectedPricing.installmentsInterestFree === false
                        ? 'con interés'
                        : 'sin interés'}
                    </p>
                  ) : null}
                  {installmentAmountLabel ? (
                    <p>{installmentAmountLabel} por cuota</p>
                  ) : null}
                </div>
              ) : null}

              {paymentVariant === 'installments' && singlePriceLabel ? (
                <p className="text-gray-400 text-sm mt-2">
                  Pago único: {singlePriceLabel}
                </p>
              ) : null}
            </div>

            <p className="text-gray-300 mt-6 max-w-md">
              Accede a una evaluación técnica real y recibe feedback
              personalizado sobre tu nivel actual.
            </p>

            <Link href="/plataforma">
              <button className="mt-6 px-6 py-3 bg-[#00CCA4] text-black font-semibold rounded-lg hover:opacity-90 transition cursor-pointer">
                Iniciar proceso de admisión
              </button>
            </Link>

            {selectedPricing.showInstallmentsInUi &&
            selectedPricing.hasInstallments &&
            installmentsPriceLabel &&
            singlePriceLabel ? (
              <p className="mt-3 text-xs text-gray-400">
                Cuotas: {installmentsPriceLabel} · Pago único:{' '}
                {singlePriceLabel}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-3">
              <FaComments className="text-[#77039F]" />
              <span>Entrevista tecnica por rol</span>
            </div>

            <div className="flex items-center gap-3">
              <FaTasks className="text-[#BDBE0B]" />
              <span>Evaluacion practica aplicada</span>
            </div>

            <div className="flex items-center gap-3">
              <AiOutlineCheckCircle className="text-[#4ADE80]" />
              <span>Feedback personalizado</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 max-w-xl mx-auto">
            <p className="text-gray-500 text-xs">
            Este pago corresponde únicamente al proceso de admisión y no
            garantiza el ingreso al programa.
          </p>

          <p className="text-gray-600 text-xs mt-3">
            +7 ediciones realizadas con talento previamente seleccionado.
          </p>
        </div>
      </div>
    </section>
  )
}

export default AdmissionPricing

