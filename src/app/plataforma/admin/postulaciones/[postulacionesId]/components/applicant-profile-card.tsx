'use client'

import { Check, Globe, Link as LinkIcon, Mail, UserCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import type { ApplicantProfileSummary, ApplicationRow } from '../types/types'
import {
  arrayOrNull,
  buildWhatsAppLink,
  copyToClipboard,
  getEmailFromAnswers,
  textOrNA,
} from '../helpers'
import Image from 'next/image'

function pickHandle(applicant: ApplicantProfileSummary | null): string {
  const linkedinUrl = applicant?.linkedin_url?.trim()
  if (linkedinUrl) {
    const clean = linkedinUrl
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/+$/, '')
    return `@${clean}`
  }

  const documentNumber = applicant?.document_number?.trim()
  if (documentNumber) return `@${documentNumber}`

  return 'No definido'
}

export function ApplicantProfileCard({
  applicant,
  applicantFullName,
  appliedRoleFromAnswers,
  showSuccess,
  showError,
}: {
  applicant: ApplicantProfileSummary | null
  applicantFullName: string
  application: ApplicationRow | null
  appliedRoleFromAnswers: string | null
  showSuccess: (title: string, description?: string) => void
  showError: (title: string, description?: string) => void
}) {
  const handle = pickHandle(applicant)
  const email = applicant?.email
  const whatsapp = applicant?.whatsapp_e164?.trim() ?? null

  const profileStatus = textOrNA(applicant?.profile_status ?? null)
  const englishLevel = textOrNA(applicant?.english_level ?? null)

  const skills = arrayOrNull(applicant?.skills ?? null)

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-md overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center">
          <div className="relative mt-2">
            <div className="h-20 w-20 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(0,204,164,0.18)]">
              <UserCircle2 className="h-12 w-12 text-white/70" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[#00CCA4] ring-4 ring-black/60" />
          </div>

          <div className="mt-3">
            <div className="text-lg font-semibold text-white">
              {textOrNA(applicantFullName)}
            </div>
            <div className="text-xs text-white/60 mt-0.5">{handle}</div>
          </div>

          <div className="mt-4 w-full">
            <div className="grid w-full grid-cols-2 gap-2">
              {/* WhatsApp */}
              <Button
                asChild
                variant="secondary"
                className="h-10 w-full bg-[#0b2a22] hover:bg-[#0e342a] text-[#00CCA4] border border-[#00CCA4]/20 px-0"
                disabled={!whatsapp}
                title={whatsapp ? 'Abrir WhatsApp' : 'No hay WhatsApp'}
              >
                <a
                  href={whatsapp ? buildWhatsAppLink(whatsapp) : undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center"
                >
                  <Image
                    src="/whatsapp-icon.svg"
                    alt="WhatsApp"
                    width={18}
                    height={18}
                  />
                </a>
              </Button>

              {/* Mail (si no hay, avisa) */}
              <Button
                type="button"
                variant="secondary"
                className="h-10 w-full bg-white/5 hover:bg-white/10 border border-white/10 px-0"
                title={email ? 'Copiar email' : 'No hay email guardado'}
                onClick={async () => {
                  if (!email) {
                    showError(
                      'Sin email',
                      'Este postulante no tiene un email guardado.'
                    )
                    return
                  }
                  const success = await copyToClipboard(email)
                  if (success)
                    showSuccess('Copiado', 'Email copiado al portapapeles.')
                  else
                    showError('No se pudo copiar', 'Probá copiar manualmente.')
                }}
              >
                <Mail className="h-4 w-4 text-purple-500" />
                <span className="sr-only">Copiar email</span>
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 w-full">
            <div className="rounded-full px-3 py-2 text-xs font-semibold border border-[#00CCA4]/25 bg-[#00CCA4]/10 text-[#00CCA4]">
              {textOrNA(appliedRoleFromAnswers ?? null)}
            </div>
            <div className="rounded-full px-3 py-2 text-xs font-semibold border border-purple-500/20 bg-purple-500/10 text-purple-200">
              {profileStatus === 'profile_incomplete'
                ? 'Perfil incompleto'
                : 'Perfil completo'}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/80 mb-3">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 border border-white/10">
              <Check className="h-4 w-4 text-[#00CCA4]" />
            </span>
            STACK TÉCNICO
          </div>

          {skills ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-lg text-[11px] font-semibold border border-white/10 bg-black/30 text-white/80"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-xs text-white/50">No definido</div>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-white/50">NIVEL DE INGLÉS</div>
            <div className="text-sm font-semibold text-white mt-1">
              {englishLevel}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl border border-white/10 bg-black/30 flex items-center justify-center">
            <Globe className="h-5 w-5 text-yellow" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
