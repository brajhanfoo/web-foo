// src/app/plataforma/admin/postulaciones/%5BpostulacionesId%5D/components/application-details-card.tsx
'use client'

import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import type { ApplicationRow, FormSchema, SchemaField } from '../types/types'
import { textOrNA } from '../helpers'

function formatValue(value: unknown, field?: SchemaField): string {
  if (value === null || value === undefined) return '-'

  if (Array.isArray(value)) {
    const items = value
      .map((item) => formatValue(item, field))
      .filter((item) => item !== '-')
    return items.length ? items.join(', ') : '-'
  }

  if (typeof value === 'boolean') return value ? 'Si' : 'No'

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '-'
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return '-'

    if (field?.options?.length) {
      const match = field.options.find((option) => option.value === trimmed)
      if (match?.label) return match.label
    }

    return trimmed
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return '-'
    }
  }

  return '-'
}

function labelFromKey(key: string): string {
  return key.replace(/_/g, ' ').trim() || key
}

type FieldEntry = {
  key: string
  label: string
  value: string
}

function buildEntriesFromSchema(
  schema: FormSchema,
  answers: Record<string, unknown>
): FieldEntry[] {
  return schema.fields.map((field) => ({
    key: field.id || field.name,
    label: field.label,
    value: formatValue(answers[field.name], field),
  }))
}

function buildFallbackEntries(answers: Record<string, unknown>): FieldEntry[] {
  return Object.entries(answers).map(([key, value]) => ({
    key,
    label: labelFromKey(key),
    value: formatValue(value),
  }))
}

export function ApplicationDetailsCard({
  isLoading,
  application,
  formSchema,
}: {
  isLoading: boolean
  application: ApplicationRow | null
  formSchema: FormSchema | null
}) {
  const applicant = application?.applicant_profile ?? null
  const email = applicant?.email ?? null

  const location = textOrNA(applicant?.country_residence ?? null)
  const phone = textOrNA(applicant?.whatsapp_e164 ?? null)
  const documentNumber = textOrNA(applicant?.document_number ?? null)

  const answers = application?.answers ?? {}
  const hasSchema = Boolean(formSchema?.fields.length)
  const entries = formSchema
    ? buildEntriesFromSchema(formSchema, answers)
    : buildFallbackEntries(answers)

  const hasEntries = entries.length > 0

  return (
    <Card className="bg-slate-900 border-slate-800 backdrop-blur-md overflow-hidden">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-semibold text-slate-100">
              Ficha de Postulante
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Datos &amp; Respuestas
            </div>
          </div>

          <Badge className="bg-slate-800 text-slate-100 border border-slate-800">
            {application?.status === 'received'
              ? 'Postulacion recibida'
              : application?.status === 'in_review'
                ? 'En revisión'
                : application?.status === 'interview_feedback'
                  ? 'Entrevista + feedback'
                  : application?.status === 'admitted'
                    ? 'Admitida'
              : application?.status === 'payment_pending'
                ? 'Pago pendiente'
                : application?.status === 'enrolled'
                  ? 'Inscrito'
                  : application?.status === 'rejected'
                    ? 'Rechazado'
                    : '-'}
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-sm text-slate-300">Cargando ficha...</div>
        ) : application ? (
          <>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="text-[11px] tracking-wide text-slate-400">
                    DNI / ID
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-100 break-words">
                    {documentNumber}
                  </div>

                  <div className="mt-4 text-[11px] tracking-wide text-slate-400">
                    EMAIL
                  </div>
                  <div className="mt-1 text-sm text-slate-200 break-words">
                    {textOrNA(email)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] tracking-wide text-slate-400">
                    UBICACIÓN
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-100 break-words">
                    {location}
                  </div>

                  <div className="mt-4 text-[11px] tracking-wide text-slate-400">
                    TELÉFONO
                  </div>
                  <div className="mt-1 text-sm text-slate-200 break-words">
                    {phone}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-semibold tracking-wide text-[#00CCA4]">
              RESPUESTAS DEL FORMULARIO
            </div>

            <Separator className="border-slate-800" />

            {hasEntries ? (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div
                    key={entry.key}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                  >
                    <div className="text-[11px] tracking-wide text-slate-400">
                      {entry.label}
                    </div>
                    <div className="mt-2 text-sm text-slate-200 whitespace-pre-wrap">
                      {entry.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-300">
                {hasSchema
                  ? 'El formulario no tiene campos para mostrar.'
                  : 'No se encontro el formulario asociado.'}
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-slate-300">
            No se pudo cargar la postulacion.
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
