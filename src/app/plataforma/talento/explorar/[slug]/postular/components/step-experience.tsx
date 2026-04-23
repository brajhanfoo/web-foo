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
import { ArrowLeft, ExternalLink } from 'lucide-react'

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

export type FormInputField = {
  id: string
  type: FormFieldType
  label: string
  name: string
  placeholder?: string
  required?: boolean
  options?: FormFieldOption[]
}

export type FormLinkItem = {
  id: string
  type: 'link'
  label: string
  url: string
  description?: string
  openInNewTab?: boolean
}

export type FormField = FormInputField | FormLinkItem

export type FormValue = string | boolean
export type FormValuesMap = Record<string, FormValue>

function safeString(value: FormValue | undefined): string {
  return typeof value === 'string' ? value : ''
}

function isFilledValue(field: FormInputField, value: FormValue | undefined) {
  if (field.type === 'checkbox') {
    return Boolean(value)
  }

  return safeString(value).trim().length > 0
}

export function StepExperience({
  experienceField,
  technologiesField,
  motivationField,
  shiftFields,
  extraFields,
  values,
  onChangeValue,
  onBack,
  onNext,
}: {
  experienceField: FormInputField | null
  technologiesField: FormInputField | null
  motivationField: FormInputField | null
  shiftFields: FormInputField[]
  extraFields: FormField[]
  values: FormValuesMap
  onChangeValue: (name: string, value: FormValue) => void
  onBack: () => void
  onNext: () => void
}) {
  const extraLinkFields = extraFields.filter(isLinkField)
  const extraCheckboxFields = extraFields.filter(
    (field): field is FormInputField => field.type === 'checkbox'
  )
  const extraInputFields = extraFields.filter(
    (field): field is FormInputField =>
      field.type !== 'checkbox' && field.type !== 'link'
  )
  const requiredInputFields = [
    experienceField,
    technologiesField,
    motivationField,
    ...extraInputFields,
  ].filter((field): field is FormInputField => Boolean(field))

  const hasMissingInputValues = requiredInputFields.some(
    (field) => !isFilledValue(field, values[field.name])
  )

  const hasShiftSelection =
    shiftFields.length === 0 ||
    shiftFields.some((field) => Boolean(values[field.name]))

  const requiredExtraCheckboxFields = extraCheckboxFields.filter(
    (field) => field.required
  )
  const hasValidExtraCheckboxSelection =
    extraCheckboxFields.length === 0
      ? true
      : requiredExtraCheckboxFields.length > 0
        ? requiredExtraCheckboxFields.every((field) =>
            Boolean(values[field.name])
          )
        : extraCheckboxFields.some((field) => Boolean(values[field.name]))

  const canContinue =
    !hasMissingInputValues &&
    hasShiftSelection &&
    hasValidExtraCheckboxSelection

  const handleNext = () => {
    if (!canContinue) return
    onNext()
  }

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
                  name={experienceField.name}
                >
                  <SelectTrigger
                    className="h-12 rounded-xl border-white/10 bg-black/30 text-white"
                    aria-label={experienceField.label}
                  >
                    <SelectValue
                      placeholder={
                        experienceField.placeholder ??
                        'Selecciona tu rango de experiencia…'
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
                  name={experienceField.name}
                  aria-label={experienceField.label}
                  autoComplete="off"
                  value={safeString(values[experienceField.name])}
                  onChange={(e) =>
                    onChangeValue(experienceField.name, e.target.value)
                  }
                  placeholder={
                    experienceField.placeholder ??
                    'Selecciona tu rango de experiencia…'
                  }
                />
              )}
            </FieldBlock>
          ) : null}

          {technologiesField ? (
            <FieldBlock label={technologiesField.label}>
              <Textarea
                className="min-h-[110px] rounded-xl border-white/10 bg-black/30 text-white placeholder:text-white/30"
                name={technologiesField.name}
                aria-label={technologiesField.label}
                autoComplete="off"
                value={safeString(values[technologiesField.name])}
                onChange={(e) =>
                  onChangeValue(technologiesField.name, e.target.value)
                }
                placeholder={
                  technologiesField.placeholder ??
                  'Ej: React.js, Tailwind CSS, TypeScript, Git, Figma…'
                }
              />
            </FieldBlock>
          ) : null}

          {motivationField ? (
            <FieldBlock label={motivationField.label}>
              <Textarea
                className="min-h-[110px] rounded-xl border-white/10 bg-black/30 text-white placeholder:text-white/30"
                name={motivationField.name}
                aria-label={motivationField.label}
                autoComplete="off"
                value={safeString(values[motivationField.name])}
                onChange={(e) =>
                  onChangeValue(motivationField.name, e.target.value)
                }
                placeholder={
                  motivationField.placeholder ??
                  'Cuéntanos qué buscas aprender o fortalecer en esta experiencia…'
                }
              />
            </FieldBlock>
          ) : null}

          {extraInputFields.length ? (
            <div className="space-y-5">
              {extraInputFields.map((field) => (
                <FieldBlock key={field.name} label={field.label}>
                  {renderField(field, values, onChangeValue)}
                </FieldBlock>
              ))}
            </div>
          ) : null}

          {extraLinkFields.length ? (
            <div className="space-y-3">
              {extraLinkFields.map((field) => (
                <LinkField key={field.id} field={field} />
              ))}
            </div>
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

      {extraCheckboxFields.length ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
            Selecciona la(s) franja(s) horaria(s) en la(s) que puedes participar
            en los workshops (lunes a viernes, sesiones de 1–2 horas dentro de
            la franja elegida)
          </div>
          <div className="grid gap-3">
            {extraCheckboxFields.map((field) => {
              const checked = Boolean(values[field.name])
              return (
                <label
                  key={field.name}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-2xl border p-5',
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
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="secondary"
          className="w-full border border-white/10 bg-white/5 text-white hover:bg-white/10 sm:w-auto"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Anterior
        </Button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canContinue}
          className={cn(
            'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 sm:w-auto',
            !canContinue && 'cursor-not-allowed opacity-70 hover:brightness-100'
          )}
        >
          Siguiente
          <span aria-hidden>→</span>
        </button>
      </div>
      {!canContinue ? (
        <div className="text-sm text-amber-200/90">
          Completa todos los campos para continuar.
          {!hasShiftSelection ? ' Debes seleccionar al menos un turno.' : ''}
          {!hasValidExtraCheckboxSelection
            ? ' Debes seleccionar al menos una franja horaria.'
            : ''}
        </div>
      ) : null}
    </div>
  )
}

function renderField(
  field: FormInputField,
  values: FormValuesMap,
  onChangeValue: (name: string, value: FormValue) => void
) {
  if (field.type === 'select' && field.options?.length) {
    return (
      <Select
        value={safeString(values[field.name])}
        onValueChange={(v) => onChangeValue(field.name, v)}
        name={field.name}
      >
        <SelectTrigger
          className="h-12 rounded-xl border-white/10 bg-black/30 text-white"
          aria-label={field.label}
        >
          <SelectValue placeholder={field.placeholder ?? 'Selecciona…'} />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (field.type === 'textarea') {
    return (
      <Textarea
        className="min-h-[110px] rounded-xl border-white/10 bg-black/30 text-white placeholder:text-white/30"
        name={field.name}
        aria-label={field.label}
        autoComplete="off"
        value={safeString(values[field.name])}
        onChange={(e) => onChangeValue(field.name, e.target.value)}
        placeholder={field.placeholder ?? ''}
      />
    )
  }

  const inputType =
    field.type === 'email'
      ? 'email'
      : field.type === 'phone'
        ? 'tel'
        : field.type === 'number'
          ? 'number'
          : field.type === 'date'
            ? 'date'
            : 'text'

  const inputMode =
    field.type === 'phone'
      ? 'tel'
      : field.type === 'number'
        ? 'numeric'
        : undefined

  return (
    <Input
      className="h-12 rounded-xl border-white/10 bg-black/30 text-white placeholder:text-white/30"
      type={inputType}
      inputMode={inputMode}
      name={field.name}
      aria-label={field.label}
      autoComplete="off"
      spellCheck={field.type === 'email' ? false : undefined}
      value={safeString(values[field.name])}
      onChange={(e) => onChangeValue(field.name, e.target.value)}
      placeholder={field.placeholder ?? ''}
    />
  )
}

function LinkField({ field }: { field: FormLinkItem }) {
  const openInNewTab = field.openInNewTab !== false
  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-black/30 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{field.label}</div>
          {field.description ? (
            <div className="mt-1 text-xs text-white/55">
              {field.description}
            </div>
          ) : null}
        </div>
        <a
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
          href={field.url}
          target={openInNewTab ? '_blank' : undefined}
          rel={openInNewTab ? 'noopener noreferrer' : undefined}
        >
          Abrir enlace
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}

function isLinkField(field: FormField): field is FormLinkItem {
  return field.type === 'link'
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
