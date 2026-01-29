// components/application-workflow-card.tsx
'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'

import type { ApplicationRow, ApplicationStatus } from '../types/types'
import { ApplicationOperationsPanel } from './application-operations-panel'

export function ApplicationWorkflowCard({
  isLoading,
  application,

  isAdmitLoading,
  isPaymentPendingLoading,
  isEnrollLoading,
  isRejectLoading,
  onUpdateStatus,
}: {
  isLoading: boolean
  application: ApplicationRow | null
  isAdmitLoading: boolean
  isPaymentPendingLoading: boolean
  isEnrollLoading: boolean
  isRejectLoading: boolean
  onUpdateStatus: (nextStatus: ApplicationStatus) => Promise<void>
}) {
  // Si está cargando o no hay data, mostramos un fallback simple
  if (isLoading) {
    return (
      <div className="bg-black/40 border border-white/10 backdrop-blur-md rounded-xl p-4">
        <div className="text-sm text-white/60">Cargando…</div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="bg-black/40 border border-white/10 backdrop-blur-md rounded-xl p-4 space-y-3">
        <div className="text-sm text-white/70">No hay datos para mostrar.</div>
        <Button
          variant="secondary"
          className="bg-white/10 hover:bg-white/15 border border-white/10 text-white"
          asChild
        >
          <Link href="/plataforma/admin/postulaciones">Volver</Link>
        </Button>
      </div>
    )
  }

  return (
    <ApplicationOperationsPanel
      application={application}
      showSuccess={() => {
        /* el toast lo maneja la page en updateStatus */
      }}
      showError={() => {
        /* el toast lo maneja la page en updateStatus */
      }}
      onUpdateStatus={onUpdateStatus}
      // loaders: por ahora los “mapeamos” a lo que tenés
      isReviewLoading={false}
      isAdmitLoading={isAdmitLoading || isPaymentPendingLoading}
      isRejectLoading={isRejectLoading}
      isEnrollLoading={isEnrollLoading}
      isBackToReviewLoading={false}
      isBackToPaymentPendingLoading={false}
    />
  )
}
