import { Suspense } from 'react'

import ConfirmPaymentClient from './confirm-payment-client'

export default function ConfirmPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-black px-6 py-10">
          <div className="mx-auto w-full max-w-xl">
            <div className="rounded-lg border border-white/10 bg-black/60 p-6 text-sm text-white/70">
              Verificando pago...
            </div>
          </div>
        </div>
      }
    >
      <ConfirmPaymentClient />
    </Suspense>
  )
}
