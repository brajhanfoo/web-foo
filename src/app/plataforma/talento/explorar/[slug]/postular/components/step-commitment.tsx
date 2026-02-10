'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, FileText, Send } from 'lucide-react'
import type { FormField, FormValuesMap, FormValue } from './step-experience'

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
  commitmentFields: FormField[]
  values: FormValuesMap
  onChangeValue: (name: string, value: FormValue) => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-white/10 bg-white/[0.03] text-white"
          >
            <FileText className="mr-2 h-4 w-4 text-emerald-200" />
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
      <div className="text-sm text-white/55">
        Para finalizar tu proceso, por favor lee y acepta los siguientes
        términos de participación.
      </div>

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

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al paso anterior
        </Button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110',
            isSubmitting && 'opacity-70'
          )}
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? 'Enviando…' : 'Enviar postulación'}
        </button>
      </div>
    </div>
  )
}
