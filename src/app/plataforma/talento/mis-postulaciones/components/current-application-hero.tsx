// src/app/plataforma/talento/mis-postulaciones/components/current-application-hero.tsx

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PayphoneCheckoutModal } from '@/components/payments/payphone-checkout-modal'

import {
  ArrowRight,
  CheckCircle2,
  ClipboardClock,
  Clock3,
  CreditCard,
  ExternalLink,
  Trophy,
} from 'lucide-react'

import type { ApplicationRow, ProgramPaymentMode, ProgramRow } from '../types'
import {
  badgeClass,
  fmtDateESFromISO,
  headerLine,
  roleTextClass,
  safeTrim,
  statusLabel,
} from '../helpers'
import { ShellCard } from './shell-card'
import { getPaymentWindow } from '../payment-logic'

function resolvePaymentMode(program: ProgramRow | null): ProgramPaymentMode {
  if (!program) return 'none'
  if (program.payment_mode) return program.payment_mode
  return program.requires_payment_pre ? 'pre' : 'none'
}

function parsePriceToCents(priceUsd: string | number | null): number | null {
  if (priceUsd === null || priceUsd === undefined) return null
  const parsed = Number(priceUsd)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed * 100)
}

export function CurrentApplicationHero(props: { app: ApplicationRow }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const programTitle = props.app.program ? props.app.program.title : 'Programa'
  const role = safeTrim(props.app.applied_role)
  const appliedAt = fmtDateESFromISO(props.app.created_at)

  // Header line estilo: "Project Academy - Batch 1 | FRONTEND DEVELOPER"
  const topLeftText = headerLine(programTitle, role)
  const topRight = (
    <Badge
      className={['uppercase', 'border', badgeClass(props.app.status)].join(
        ' '
      )}
    >
      Estado: {statusLabel(props.app.status)}
    </Badge>
  )

  if (props.app.status === 'received') {
    return (
      <ShellCard
        status="received"
        className="
    rounded-2xl
    border border-blue-500/25
    bg-[linear-gradient(to_right,rgba(0,0,0,1),rgba(10,22,45,0.85),rgba(0,0,0,1))]
    shadow-[0_8px_30px_rgba(0,0,0,0.35)]
  "
        topLeft={
          <span className="text-white font-semibold tracking-wide">
            {programTitle}
          </span>
        }
        topRight={topRight}
        icon={
          <div className="
      flex items-center justify-center
      h-14 w-14 rounded-2xl
      bg-black/80
      border border-blue-500/30
    ">
            <Clock3 className="h-6 w-6 text-[#60A5FA]" />
          </div>
        }
        title="Postulación recibida"
        description="Hemos recibido tu ficha correctamente. Nuestro equipo de admisión comenzará a revisarla pronto."
        bottomLeft={
          <span className="text-xs text-white/40">
            Postulado: {appliedAt}
          </span>
        }
        bottomRight={
          <span className={roleTextClass()}>
            {role || '—'}
          </span>
        }
      />

    )
  }

  if (props.app.status === 'in_review') {
    return (
      <ShellCard
        status="in_review"
        className="
    rounded-2xl
    border border-orange-500/25
    bg-[linear-gradient(to_right,rgba(0,0,0,1),rgba(30,18,8,0.9),rgba(0,0,0,1))]
    shadow-[0_8px_30px_rgba(0,0,0,0.35)]
  "
        topLeft={
          <div className="flex items-center gap-3 text-sm md:text-base">

            {/* Programa */}
            <span className="text-white font-semibold tracking-wide">
              {programTitle}
            </span>

            {/* Separador */}
            {role && (
              <>
                <span className="text-white/30">·</span>

                {/* Rol */}
                <span className="text-orange-400 font-medium tracking-wide">
                  {role}
                </span>
              </>
            )}
          </div>
        }
        topRight={
          <span className="text-xs text-white/40">
            Postulado: {appliedAt}
          </span>
        }
        icon={
          <div
            className="
        flex items-center justify-center
        h-14 w-14 rounded-xl
        bg-black/80
        border border-orange-500/20
      "
          >
            <ClipboardClock className="h-6 w-6 text-orange-400" />
          </div>
        }
        title="Estado: EN REVISIÓN"
        description="Estamos validando tu perfil para el programa seleccionado. Nuestro equipo está revisando tu portafolio y experiencia técnica."
        bottomLeft={<span />}
        bottomRight={
          <Badge
            className="
        bg-orange-500/10
        border border-orange-500/30
        text-orange-400
        px-4 py-1.5
        rounded-lg
        text-xs
        tracking-wide
      "
          >
            Revisión en curso…
          </Badge>
        }
      />
    )
  }

  if (
    props.app.status === 'approved' ||
    props.app.status === 'admitted' ||
    props.app.status === 'payment_pending'
  ) {
    const payment = getPaymentWindow(props.app)
    const paymentMode = resolvePaymentMode(props.app.program)
    const amountCents =
      parsePriceToCents(props.app.program?.price_usd ?? null) ?? 0
    const needsPayment =
      paymentMode === 'post' && props.app.payment_status !== 'paid'
    const canPayNow = needsPayment && payment.canPay && amountCents > 0

    const expiresLabel = payment.expiresAtIso
      ? `TU RESERVA VENCE EL: ${fmtDateESFromISO(payment.expiresAtIso)}`
      : 'TU RESERVA VENCE PRONTO'
    return (
      <ShellCard
        status="approved"
        variant="admitted"
        className={[
          'bg-gradient-to-r from-emerald-950/60 via-yellow-950/30 to-emerald-950/60',
          'ring-1 ring-emerald-400/10',
          'shadow-[0_0_60px_rgba(250,204,21,0.10)]',
        ].join(' ')}
        topLeft={<span className="text-xs text-amber-50">{topLeftText}</span>}
        topRight={topRight}
        icon={<Trophy className="h-5 w-5 text-[#E7E51A]" />}
        title="¡Felicidades! Fuiste aceptado."
        description="Tu perfil encaja perfectamente con el Squad que estamos armando. Tienes una vacante reservada por 48 horas para confirmar tu participación."
        bottomLeft={
          <Badge className="border border-red-500/30 bg-red-500/10 text-red-400">
            {expiresLabel}
          </Badge>
        }
        bottomRight={
          <>
            {needsPayment ? (
              <>
                <Button
                  className={[
                    'h-11 w-full justify-center gap-2 cursor-pointer',
                    'bg-emerald-400/90 text-black hover:bg-emerald-400',
                    'shadow-[0_0_25px_rgba(52,211,153,0.25)]',
                  ].join(' ')}
                  disabled={!canPayNow}
                  onClick={() => setCheckoutOpen(true)}
                >
                  PAGAR MATRÍCULA <CreditCard className="h-4 w-4" />
                </Button>
                {!amountCents ? (
                  <div className="text-xs text-white/60">
                    Falta configurar el precio del programa.
                  </div>
                ) : null}
                <PayphoneCheckoutModal
                  open={checkoutOpen}
                  onOpenChange={setCheckoutOpen}
                  programId={props.app.program_id}
                  editionId={props.app.edition_id}
                  purpose="tuition"
                  applicationId={props.app.id}
                  amountCents={amountCents}
                  onPaid={() => setCheckoutOpen(false)}
                />
              </>
            ) : (
              <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                {paymentMode === 'post'
                  ? 'Pago confirmado'
                  : 'Pago no requerido'}
              </Badge>
            )}
          </>
        }
      />
    )
  }

  if (props.app.status === 'enrolled') {
    return (
      <ShellCard
        status="enrolled"
        topLeft={
          <span className="text-xs text-amuted-foreground">
            Programa: {programTitle}
          </span>
        }
        topRight={null}
        icon={<CheckCircle2 className="h-5 w-5 text-fuchsia-300" />}
        title="Matrícula confirmada: Bienvenido oficialmente"
        description="Ya eres parte del equipo. Tu acceso a las herramientas se habilitará 24 horas antes del inicio del programa."
        bottomLeft={<span> </span>}
        bottomRightAlign="start"
        bottomRight={
          <>
            <Button
              className="gap-2 bg-[#00CCA4] hover:bg-[#00CCA4]/90 text-black"
              asChild
            >
              <Link href="#">
                Ir al aula <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="secondary"
              className="gap-2 bg-black hover:bg-amber-500/10 text-amber-50"
              asChild
            >
              <Link
                href={`/plataforma/talento/mis-postulaciones/${props.app.id}/workspace`}
              >
                Ir al espacio de trabajo <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </>
        }
      />
    )
  }

  // rejected (soft)
  return (
    <ShellCard
      status="rejected"
      topLeft={topLeftText}
      topRight={
        <span className="text-xs text-muted-foreground">
          Postulado: {appliedAt}
        </span>
      }
      icon={<Clock3 className="h-5 w-5 text-muted-foreground" />}
      title="Gracias por postular"
      description="Por ahora no avanzaste en este batch. Te recomendamos reforzar algunos puntos y volver a intentarlo en la próxima apertura."
      bottomLeft={
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
          <span>Te avisaremos cuando se abran nuevos cupos</span>
        </div>
      }
      bottomRight={
        <Button variant="secondary" className="gap-2" asChild>
          <Link href="#">
            Ver recomendaciones <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      }
    />
  )
}
