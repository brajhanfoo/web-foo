// components/application-details-card.tsx  (REEMPLAZO COMPLETO)
'use client'

import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import type { ApplicationRow } from '../types/types'
import { getEmailFromAnswers, textOrNA } from '../helpers'
import { MiniCheck } from './mini-check'
import { cn } from '@/lib/utils'

function splitTags(value: string | null): string[] {
  if (!value) return []
  const cleaned = value.trim()
  if (!cleaned) return []
  return cleaned
    .split(/[,;\n\r]+/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, 24)
}

function StepTitle({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-7 w-7 rounded-lg bg-[#00CCA4]/15 border border-[#00CCA4]/25 flex items-center justify-center text-xs font-bold text-[#00CCA4]">
        {number}
      </div>
      <div className="text-sm font-semibold text-white">{title}</div>
    </div>
  )
}

export function ApplicationDetailsCard({
  isLoading,
  application,
  experienceText,
  technologiesText,
  motivationText,
  shiftMorning,
  shiftAfternoon,
  shiftNight,
  acceptTerms,
  acceptAvailability,
  acceptQuorum,
}: {
  isLoading: boolean
  application: ApplicationRow | null
  experienceText: string | null
  technologiesText: string | null
  motivationText: string | null
  shiftMorning: boolean | null
  shiftAfternoon: boolean | null
  shiftNight: boolean | null
  acceptTerms: boolean | null
  acceptAvailability: boolean | null
  acceptQuorum: boolean | null
}) {
  const applicant = application?.applicant_profile ?? null
  const email = getEmailFromAnswers(application?.answers)
  const technologies = splitTags(technologiesText)

  const location = textOrNA(applicant?.country_residence ?? null)
  const phone = textOrNA(applicant?.whatsapp_e164 ?? null)
  const documentNumber = textOrNA(applicant?.document_number ?? null)

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-md overflow-hidden">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-semibold text-white">
              Ficha de Postulante
            </div>
            <div className="text-xs text-white/50 mt-1">
              Datos &amp; Respuestas
            </div>
          </div>

          <Badge className="bg-white/10 text-white border border-white/10">
            {application?.status === 'received'
              ? 'Postulación recibida'
              : application?.status === 'payment_pending'
                ? 'Pago pendiente'
                : application?.status === 'enrolled'
                  ? 'Inscrito'
                  : application?.status === 'rejected'
                    ? 'Rechazado'
                    : '—'}
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-sm text-white/60">Cargando ficha…</div>
        ) : application ? (
          <>
            {/* Caja superior (DNI, ubicación, email, teléfono) */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="text-[11px] tracking-wide text-white/50">
                    DNI / ID
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white break-words">
                    {documentNumber}
                  </div>

                  <div className="mt-4 text-[11px] tracking-wide text-white/50">
                    EMAIL
                  </div>
                  <div className="mt-1 text-sm text-white/80 break-words">
                    {textOrNA(email)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] tracking-wide text-white/50">
                    UBICACIÓN
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white break-words">
                    {location}
                  </div>

                  <div className="mt-4 text-[11px] tracking-wide text-white/50">
                    TELÉFONO
                  </div>
                  <div className="mt-1 text-sm text-white/80 break-words">
                    {phone}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-semibold tracking-wide text-[#00CCA4]">
              RESPUESTAS TÉCNICAS
            </div>

            <Separator className="border-white/10" />

            {/* 1 */}
            <div className="space-y-3">
              <StepTitle number={1} title="Experiencia práctica en el rol" />
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-sm text-white/85 whitespace-pre-wrap">
                  {experienceText?.trim() ? experienceText : '—'}
                </div>
              </div>
            </div>

            {/* 2 */}
            <div className="space-y-3">
              <StepTitle
                number={2}
                title="Tecnologías y herramientas dominadas para el rol postulado"
              />
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                {technologies.length ? (
                  <div className="flex flex-wrap gap-2">
                    {technologies.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-lg text-[11px] font-semibold border border-white/10 bg-black/40 text-white/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-white/60 whitespace-pre-wrap">
                    {technologiesText?.trim() ? technologiesText : '—'}
                  </div>
                )}
              </div>
            </div>

            {/* 3 */}
            <div className="space-y-3">
              <StepTitle
                number={3}
                title="Principal objetivo al entrar a la simulación"
              />
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-sm text-white/85 whitespace-pre-wrap">
                  {motivationText?.trim() ? motivationText : '—'}
                </div>
              </div>
            </div>

            <Separator className="border-white/10" />

            {/* Disponibilidad + Aceptaciones */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                <div className="text-sm font-semibold text-white">
                  Disponibilidad
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={cn(
                      shiftMorning
                        ? 'border-[#D1D5DB] bg-white text-black'
                        : 'border-white/10 text-white'
                    )}
                  >
                    Mañana
                  </Badge>
                  <Badge
                    className={cn(
                      shiftAfternoon
                        ? 'border-[#D1D5DB] bg-white text-black'
                        : 'border-white/10 text-white'
                    )}
                  >
                    Tarde
                  </Badge>
                  <Badge
                    className={cn(
                      shiftNight
                        ? 'border-[#D1D5DB] bg-white text-black'
                        : 'border-white/10 text-white'
                    )}
                  >
                    Noche
                  </Badge>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                <div className="text-sm font-semibold text-white">
                  Aceptaciones
                </div>
                <div className="grid grid-cols-1 gap-2 border-white/10 text-white">
                  <MiniCheck label="Términos" value={acceptTerms} />
                  <MiniCheck
                    label="Disponibilidad"
                    value={acceptAvailability}
                  />
                  <MiniCheck label="Quórum" value={acceptQuorum} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-white/60">
            No se pudo cargar la postulación.
            <div className="mt-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/plataforma/admin/postulaciones">Volver</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
