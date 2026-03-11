import { Suspense } from 'react'

import { MercadoPagoReturnState } from '@/components/payments/mercadopago-return-state'

export default function MercadoPagoFailurePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-black" />}>
      <MercadoPagoReturnState variant="failure" />
    </Suspense>
  )
}
