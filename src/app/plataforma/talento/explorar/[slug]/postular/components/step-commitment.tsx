'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, FileText, Send } from 'lucide-react'
import type {
  FormInputField,
  FormValuesMap,
  FormValue,
} from './step-experience'
import Link from 'next/link'

export function StepCommitment({
  appliedRoleTitle,
  declaredLevelLabel,
  commitmentFields,
  values,
  onChangeValue,
  onBack,
  onSubmit,
  isSubmitting,
}: {
  appliedRoleTitle: string
  declaredLevelLabel?: string
  commitmentFields: FormInputField[]
  values: FormValuesMap
  onChangeValue: (name: string, value: FormValue) => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}) {
  const termsPdfAccepted = Boolean(values['acepto_terminos_pdf'])

  const allCommitmentsAccepted =
    termsPdfAccepted &&
    commitmentFields.every((field) => {
      if (!field.required) return true
      return Boolean(values[field.name])
    })

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-white/10 bg-white/[0.03] text-white"
          >
            <FileText
              className="mr-2 h-4 w-4 text-emerald-200"
              aria-hidden="true"
            />
            Postulando como:&nbsp;
            <span className="font-semibold text-emerald-200">
              {appliedRoleTitle || '—'}
            </span>
          </Badge>
        </div>

        {declaredLevelLabel ? (
          <Badge className="border border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200">
            {declaredLevelLabel}
          </Badge>
        ) : null}
      </div>

      <div className="text-xl font-semibold text-white">
        Contrato Moral y Compromiso
      </div>

      <p className="text-sm text-white/70">
        Para finalizar tu proceso, por favor lee y acepta los siguientes{' '}
        <Link
          href="https://drive.google.com/file/d/1NO30SG06Y5Z-dIClueNPqXPSvmJlqV0K/view?usp=drive_link"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-emerald-400 underline underline-offset-4 hover:text-emerald-300"
        >
          términos de participación
        </Link>
        .
      </p>

      {/* CHECK NUEVO DEL PDF */}
      <label
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-2xl border p-5',
          'border-white/10 bg-white/[0.02] hover:border-emerald-400/30',
          termsPdfAccepted && 'border-emerald-400/40 bg-emerald-400/[0.05]'
        )}
      >
        <Checkbox
          checked={termsPdfAccepted}
          onCheckedChange={(v) =>
            onChangeValue('acepto_terminos_pdf', Boolean(v))
          }
        />

        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">
            He leído los términos de participación
            <span className="ml-2 text-emerald-300">*</span>
          </div>
          <div className="mt-1 text-sm text-white/55">
            Debes revisar el documento antes de enviar tu postulación.
          </div>
        </div>
      </label>

      <div className="space-y-3">
        {commitmentFields.map((field) => {
          const checked = Boolean(values[field.name])
          return (
            <label
              key={field.name}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-2xl border p-5',
                'border-white/10 bg-white/[0.02] hover:border-emerald-400/30',
                checked && 'border-emerald-400/40 bg-emerald-400/[0.05]'
              )}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => onChangeValue(field.name, Boolean(v))}
              />

              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">
                  {field.label}
                  {field.required ? (
                    <span className="ml-2 text-emerald-300">*</span>
                  ) : null}
                </div>
              </div>
            </label>
          )
        })}
      </div>

      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-white/65">
        Al hacer clic en “Enviar Postulación”, tu perfil entrará en proceso de
        revisión. Serás notificado vía email y WhatsApp sobre el estado de tu
        ingreso.
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="secondary"
          className="w-full border border-white/10 bg-white/5 text-white hover:bg-white/10 sm:w-auto"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Volver al paso anterior
        </Button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || !allCommitmentsAccepted}
          className={cn(
            'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 sm:w-auto',
            (isSubmitting || !allCommitmentsAccepted) &&
              'cursor-not-allowed opacity-70'
          )}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? 'Enviando…' : 'Enviar postulación'}
        </button>
      </div>
    </div>
  )
}
