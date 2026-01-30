'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'date'

export type FormFieldOption = { value: string; label: string }

export type FormField = {
  id: string
  type: FormFieldType
  label: string
  name: string
  placeholder?: string
  required?: boolean
  options?: FormFieldOption[]
}

export type FormValue = string | boolean
export type FormValuesMap = Record<string, FormValue>

function safeString(value: FormValue | undefined): string {
  return typeof value === 'string' ? value : ''
}

export function StepExperience({
  experienceField,
  technologiesField,
  motivationField,
  shiftFields,
  values,
  onChangeValue,
  onBack,
  onNext,
}: {
  experienceField: FormField | null
  technologiesField: FormField | null
  motivationField: FormField | null
  shiftFields: FormField[]
  values: FormValuesMap
  onChangeValue: (name: string, value: FormValue) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
        <div className="mb-6">
          <div className="text-lg font-semibold text-white">
            Experiencia Técnica
          </div>
          <div className="mt-1 text-sm text-white/55">
            Queremos conocer tu nivel actual para asignarte el equipo ideal.
          </div>
        </div>

        <div className="grid gap-6">
          {experienceField ? (
            <FieldBlock label={experienceField.label}>
              {experienceField.type === 'select' &&
              experienceField.options?.length ? (
                <Select
                  value={safeString(values[experienceField.name])}
                  onValueChange={(v) => onChangeValue(experienceField.name, v)}
                >
                  <SelectTrigger className="h-12 rounded-xl border-white/10 bg-black/30 text-white">
                    <SelectValue
                      placeholder={
                        experienceField.placeholder ??
                        'Selecciona tu rango de experiencia'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceField.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-12 rounded-xl border-white/10 bg-black/30 text-white placeholder:text-white/30"
                  value={safeString(values[experienceField.name])}
                  onChange={(e) =>
                    onChangeValue(experienceField.name, e.target.value)
                  }
                  placeholder={
                    experienceField.placeholder ??
                    'Selecciona tu rango de experiencia'
                  }
                />
              )}
            </FieldBlock>
          ) : null}

          {technologiesField ? (
            <FieldBlock label={technologiesField.label}>
              <Textarea
                className="min-h-[110px] rounded-xl border-white/10 bg-black/30 text-white placeholder:text-white/30"
                value={safeString(values[technologiesField.name])}
                onChange={(e) =>
                  onChangeValue(technologiesField.name, e.target.value)
                }
                placeholder={
                  technologiesField.placeholder ??
                  'Ej: React.js, Tailwind CSS, TypeScript, Git, Figma...'
                }
              />
            </FieldBlock>
          ) : null}

          {motivationField ? (
            <FieldBlock label={motivationField.label}>
              <Textarea
                className="min-h-[110px] rounded-xl border-white/10 bg-black/30 text-white placeholder:text-white/30"
                value={safeString(values[motivationField.name])}
                onChange={(e) =>
                  onChangeValue(motivationField.name, e.target.value)
                }
                placeholder={
                  motivationField.placeholder ??
                  'Cuéntanos qué buscas aprender o fortalecer en esta experiencia...'
                }
              />
            </FieldBlock>
          ) : null}
        </div>
      </div>

      {shiftFields.length ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
            Turnos disponibles
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {shiftFields.map((field) => {
              const checked = Boolean(values[field.name])
              return (
                <label
                  key={field.name}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-4',
                    'border-white/10 bg-black/20 hover:border-emerald-400/30',
                    checked && 'border-emerald-400/40 bg-emerald-400/[0.05]'
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) =>
                      onChangeValue(field.name, Boolean(v))
                    }
                  />
                  <span className="text-sm text-white">{field.label}</span>
                </label>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
        >
          Siguiente
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  )
}

function FieldBlock({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
          {label}
        </div>
        {hint ? <div className="text-xs text-white/40">{hint}</div> : null}
      </div>
      {children}
    </div>
  )
}
