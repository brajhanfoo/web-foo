'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import type { ApplicationFormRow } from '@/types/program-editions'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Save, Trash2, GripVertical } from 'lucide-react'

type FieldTypeInput =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'date'

type FieldType = FieldTypeInput | 'link'

type FormInputField = {
  id: string
  type: FieldTypeInput
  label: string
  name: string
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[] // select
}

type FormLinkItem = {
  id: string
  type: 'link'
  label: string
  url: string
  description?: string
  openInNewTab?: boolean
}

type FormField = FormInputField | FormLinkItem
type FormInputPatch = Partial<Omit<FormInputField, 'type'>>
type FormLinkPatch = Partial<Omit<FormLinkItem, 'type'>>

type FormSchema = {
  title: string
  description?: string
  fields: FormField[]
}

const DEFAULT_SCHEMA_TITLE = 'Formulario de Postulacion'
const DEFAULT_SCHEMA_DESCRIPTION = 'Completa los campos solicitados.'
const DEFAULT_SELECT_OPTIONS = [
  { value: 'opcion_1', label: 'Opcion 1' },
  { value: 'opcion_2', label: 'Opcion 2' },
]

function safeString(value: unknown): string {
  if (typeof value === 'string') return value
  return ''
}

function toIsoOrNull(value: string): string | null {
  const v = value.trim()
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function uid(prefix = 'f') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

function toFieldName(label: string) {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 40) || `field_${Date.now()}`
  )
}

function getDefaultLabelForType(type: FieldType): string {
  if (type === 'email') return 'Email'
  if (type === 'phone') return 'Telefono'
  if (type === 'textarea') return 'Descripcion'
  if (type === 'number') return 'Numero'
  if (type === 'date') return 'Fecha'
  if (type === 'checkbox') return 'Acepto terminos'
  if (type === 'select') return 'Seleccionar opcion'
  if (type === 'link') return 'Enlace'
  return 'Nuevo campo'
}

function createDefaultFields(): FormField[] {
  return []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isInputFieldType(value: unknown): value is FieldTypeInput {
  return (
    value === 'text' ||
    value === 'textarea' ||
    value === 'email' ||
    value === 'phone' ||
    value === 'number' ||
    value === 'select' ||
    value === 'checkbox' ||
    value === 'date'
  )
}

function isSafeLinkUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('//')) return false
  const lower = trimmed.toLowerCase()
  if (lower.startsWith('javascript:')) return false
  if (lower.startsWith('https://')) return true
  if (lower.startsWith('mailto:')) return true
  if (trimmed.startsWith('/')) return true
  return false
}

function createInputField(
  type: FieldTypeInput,
  label?: string
): FormInputField {
  const nextLabel = label?.trim() ? label : getDefaultLabelForType(type)
  const name = toFieldName(nextLabel)
  return {
    id: uid('field'),
    type,
    label: nextLabel,
    name,
    placeholder: type === 'checkbox' ? undefined : '',
    required: type !== 'checkbox',
    options: type === 'select' ? DEFAULT_SELECT_OPTIONS : undefined,
  }
}

function createLinkField(label?: string): FormLinkItem {
  const nextLabel = label?.trim() ? label : getDefaultLabelForType('link')
  return {
    id: uid('link'),
    type: 'link',
    label: nextLabel,
    url: '',
    description: '',
    openInNewTab: true,
  }
}

function buildInputFieldFromExisting(
  field: FormField,
  nextType: FieldTypeInput
): FormInputField {
  const label = field.label?.trim()
    ? field.label
    : getDefaultLabelForType(nextType)
  const name =
    field.type !== 'link' && field.name.trim() ? field.name : toFieldName(label)
  const placeholder =
    nextType === 'checkbox'
      ? undefined
      : field.type !== 'link'
        ? (field.placeholder ?? '')
        : ''
  const required =
    nextType === 'checkbox'
      ? false
      : field.type !== 'link'
        ? Boolean(field.required)
        : true

  const next: FormInputField = {
    id: field.id,
    type: nextType,
    label,
    name,
    placeholder,
    required,
  }

  if (nextType === 'select') {
    next.options =
      field.type === 'select' && field.options?.length
        ? field.options
        : DEFAULT_SELECT_OPTIONS
  }

  return next
}

function buildLinkFieldFromExisting(field: FormField): FormLinkItem {
  return {
    id: field.id,
    type: 'link',
    label: field.label?.trim() ? field.label : getDefaultLabelForType('link'),
    url: field.type === 'link' ? field.url : '',
    description: field.type === 'link' ? (field.description ?? '') : undefined,
    openInNewTab: field.type === 'link' ? (field.openInNewTab ?? true) : true,
  }
}

function parseSchema(schema: unknown): FormSchema | null {
  if (!isRecord(schema)) return null

  const title = schema['title']
  const fields = schema['fields']

  if (typeof title !== 'string' || !Array.isArray(fields)) return null

  const description =
    typeof schema['description'] === 'string'
      ? (schema['description'] as string)
      : undefined

  const parsedFields: FormField[] = fields.reduce<FormField[]>(
    (acc, fieldUnknown) => {
      if (!isRecord(fieldUnknown)) return acc

      const id = fieldUnknown['id']
      const type = fieldUnknown['type']
      const label = fieldUnknown['label']

      if (typeof id !== 'string' || typeof label !== 'string') {
        return acc
      }

      if (type === 'link') {
        const url = fieldUnknown['url']
        if (typeof url !== 'string') return acc

        const description = fieldUnknown['description']
        const openInNewTab = fieldUnknown['openInNewTab']

        acc.push({
          id,
          type: 'link',
          label,
          url,
          description:
            typeof description === 'string' ? description : undefined,
          openInNewTab:
            typeof openInNewTab === 'boolean' ? openInNewTab : undefined,
        })
        return acc
      }

      if (!isInputFieldType(type)) return acc

      const name = fieldUnknown['name']
      if (typeof name !== 'string') return acc

      const placeholder = fieldUnknown['placeholder']
      const required = fieldUnknown['required']
      const options = fieldUnknown['options']

      const parsedOptions: { value: string; label: string }[] | undefined =
        Array.isArray(options)
          ? options.reduce<{ value: string; label: string }[]>(
              (optAcc, optUnknown) => {
                if (!isRecord(optUnknown)) return optAcc
                const optValue = optUnknown['value']
                const optLabel = optUnknown['label']
                if (
                  typeof optValue !== 'string' ||
                  typeof optLabel !== 'string'
                )
                  return optAcc
                optAcc.push({ value: optValue, label: optLabel })
                return optAcc
              },
              []
            )
          : undefined

      acc.push({
        id,
        type,
        label,
        name,
        placeholder: typeof placeholder === 'string' ? placeholder : undefined,
        required: typeof required === 'boolean' ? required : undefined,
        options: parsedOptions,
      })

      return acc
    },
    []
  )

  return { title, description, fields: parsedFields }
}

export function EditionFormBuilder(props: {
  programId: string
  editionId: string
  onFormSaved?: () => void
}) {
  const { programId, editionId, onFormSaved } = props
  const { showError, showSuccess } = useToastEnhanced()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ApplicationFormRow | null>(null)
  const [latestVersionNum, setLatestVersionNum] = useState<number>(0)
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false)

  // Form builder meta
  const [newFormIsActive, setNewFormIsActive] = useState(true)
  const [newFormOpensAt, setNewFormOpensAt] = useState<string>('')
  const [newFormClosesAt, setNewFormClosesAt] = useState<string>('')

  // Form schema builder
  const [schemaTitle, setSchemaTitle] = useState(DEFAULT_SCHEMA_TITLE)
  const [schemaDescription, setSchemaDescription] = useState(
    DEFAULT_SCHEMA_DESCRIPTION
  )
  const [fields, setFields] = useState<FormField[]>(() => createDefaultFields())

  useEffect(() => {
    if (!programId || !editionId) return
    void loadForm()
  }, [programId, editionId])

  function resetBuilder() {
    setNewFormIsActive(true)
    setNewFormOpensAt('')
    setNewFormClosesAt('')
    setSchemaTitle(DEFAULT_SCHEMA_TITLE)
    setSchemaDescription(DEFAULT_SCHEMA_DESCRIPTION)
    setFields(createDefaultFields())
  }

  function applyFormToBuilder(existing: ApplicationFormRow) {
    const parsed = parseSchema(existing.schema_json)
    setNewFormIsActive(Boolean(existing.is_active))
    setNewFormOpensAt(existing.opens_at ?? '')
    setNewFormClosesAt(existing.closes_at ?? '')

    if (parsed) {
      setSchemaTitle(parsed.title || DEFAULT_SCHEMA_TITLE)
      setSchemaDescription(parsed.description ?? DEFAULT_SCHEMA_DESCRIPTION)
      setFields(Array.isArray(parsed.fields) ? parsed.fields : [])
    } else {
      resetBuilder()
    }
  }

  async function loadForm() {
    setLoading(true)

    const formResponse = await supabase
      .from('application_forms')
      .select(
        'id, program_id, edition_id, version_num, schema_json, is_active, opens_at, closes_at, created_at, updated_at'
      )
      .eq('program_id', programId)
      .eq('edition_id', editionId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (formResponse.error) {
      showError('No se pudo cargar el formulario activo.')
      setForm(null)
      resetBuilder()
      setLoading(false)
      return
    }

    const latestResponse = await supabase
      .from('application_forms')
      .select('version_num')
      .eq('program_id', programId)
      .eq('edition_id', editionId)
      .order('version_num', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (
      !latestResponse.error &&
      typeof latestResponse.data?.version_num === 'number'
    ) {
      setLatestVersionNum(latestResponse.data.version_num)
    } else {
      setLatestVersionNum(0)
    }

    const existing = (formResponse.data ?? null) as ApplicationFormRow | null
    setForm(existing)

    if (existing) {
      applyFormToBuilder(existing)
    } else {
      resetBuilder()
    }

    setLoading(false)
  }

  function buildSchema(): FormSchema {
    return {
      title: schemaTitle.trim() ? schemaTitle.trim() : 'Formulario',
      description: schemaDescription.trim()
        ? schemaDescription.trim()
        : undefined,
      fields,
    }
  }

  async function upsertForm() {
    if (!schemaTitle.trim()) return showError('Pone un titulo de formulario.')
    if (fields.length === 0) return showError('Agrega al menos 1 campo.')

    const names = new Set<string>()
    for (const f of fields) {
      if (!f.label.trim())
        return showError('Todos los campos deben tener label.')

      if (f.type === 'link') {
        const url = f.url.trim()
        if (!url)
          return showError(`El enlace "${f.label || f.id}" necesita URL.`)
        if (!isSafeLinkUrl(url)) {
          return showError(
            `El enlace "${f.label || f.id}" debe usar https://, mailto: o una ruta relativa (/…).`
          )
        }
        continue
      }

      const name = f.name.trim()
      if (!name)
        return showError(`Hay un campo sin "name". (${f.label || f.id})`)
      if (names.has(name))
        return showError(`Hay campos con el mismo name: "${name}"`)
      names.add(name)

      const forbidden = new Set([
        'first_name',
        'last_name',
        'full_name',
        'document_number',
        'whatsapp_e164',
        'country_residence',
        'linkedin_url',
        'portfolio_url',
        'primary_role',
        'skills',
        'english_level',
      ])
      if (forbidden.has(name)) {
        return showError(
          `El campo "${f.label}" usa name="${name}" pero eso viene del perfil. Cambia el name.`
        )
      }

      if (f.type === 'select') {
        const options = f.options ?? []
        if (options.length < 2)
          return showError(
            `El campo "${f.label}" (select) necesita al menos 2 opciones.`
          )
        if (options.some((o) => !o.value.trim() || !o.label.trim()))
          return showError(`El campo "${f.label}" tiene opciones vacias.`)
      }
    }

    const schema = buildSchema()
    const opensAtIso = toIsoOrNull(newFormOpensAt)
    const closesAtIso = toIsoOrNull(newFormClosesAt)

    setSaving(true)

    const payload = {
      program_id: programId,
      edition_id: editionId,
      schema_json: schema,
      is_active: newFormIsActive,
      opens_at: opensAtIso,
      closes_at: closesAtIso,
    }

    if (newFormIsActive) {
      const { error: deactivateError } = await supabase
        .from('application_forms')
        .update({ is_active: false })
        .eq('program_id', programId)
        .eq('edition_id', editionId)
        .eq('is_active', true)

      if (deactivateError) {
        setSaving(false)
        showError(
          `No se pudo desactivar el formulario activo. ${safeString(
            deactivateError.message
          )}`
        )
        return
      }
    }

    const response = await supabase
      .from('application_forms')
      .insert(payload)
      .select('*')
      .maybeSingle()

    setSaving(false)

    if (response.error || !response.data) {
      showError(
        `No se pudo guardar el formulario. ${safeString(response.error?.message)}`
      )
      return
    }

    setForm(response.data as ApplicationFormRow)
    showSuccess('Formulario guardado. Nueva version creada.')
    await loadForm()
    onFormSaved?.()
  }

  async function confirmDeactivateForm() {
    if (!form?.id) return
    setSaving(true)

    const { error } = await supabase
      .from('application_forms')
      .update({ is_active: false })
      .eq('id', form.id)

    setSaving(false)
    setConfirmDeactivateOpen(false)

    if (error) {
      showError(`No se pudo desactivar. ${safeString(error.message)}`)
      return
    }

    showSuccess('Formulario desactivado.')
    await loadForm()
    onFormSaved?.()
  }

  // ---------- Form builder helpers ----------
  function addField(type: FieldType) {
    const next = type === 'link' ? createLinkField() : createInputField(type)
    setFields((previous) => [...previous, next])
  }

  function updateField(id: string, patch: FormInputPatch | FormLinkPatch) {
    setFields((previous) =>
      previous.map((field) => {
        if (field.id !== id) return field
        if (field.type === 'link') {
          return { ...field, ...patch } as FormLinkItem
        }
        return { ...field, ...patch } as FormInputField
      })
    )
  }

  function updateFieldType(id: string, nextType: FieldType) {
    setFields((previous) =>
      previous.map((field) => {
        if (field.id !== id) return field
        if (nextType === 'link') {
          return buildLinkFieldFromExisting(field)
        }
        return buildInputFieldFromExisting(field, nextType)
      })
    )
  }

  function removeField(id: string) {
    setFields((previous) => previous.filter((f) => f.id !== id))
  }

  function moveField(id: string, direction: 'up' | 'down') {
    setFields((previous) => {
      const index = previous.findIndex((x) => x.id === id)
      if (index < 0) return previous
      const next = [...previous]
      const swapWith = direction === 'up' ? index - 1 : index + 1
      if (swapWith < 0 || swapWith >= next.length) return previous
      const temporary = next[index]
      next[index] = next[swapWith]
      next[swapWith] = temporary
      return next
    })
  }

  function updateSelectOption(
    fieldId: string,
    optIndex: number,
    patch: { value?: string; label?: string }
  ) {
    setFields((previous) =>
      previous.map((f) => {
        if (f.id !== fieldId) return f
        if (f.type !== 'select') return f
        const options = [...(f.options ?? [])]
        const current = options[optIndex]
        if (!current) return f
        options[optIndex] = { ...current, ...patch }
        return { ...f, options }
      })
    )
  }

  function addSelectOption(fieldId: string) {
    setFields((previous) =>
      previous.map((field) => {
        if (field.id !== fieldId) return field
        if (field.type !== 'select') return field
        const options = [...(field.options ?? [])]
        options.push({
          value: `opcion_${options.length + 1}`,
          label: `Opcion ${options.length + 1}`,
        })
        return { ...field, options }
      })
    )
  }

  function removeSelectOption(fieldId: string, optIndex: number) {
    setFields((previous) =>
      previous.map((field) => {
        if (field.id !== fieldId) return field
        if (field.type !== 'select') return field
        const options = [...(field.options ?? [])].filter(
          (_, index) => index !== optIndex
        )
        return { ...field, options }
      })
    )
  }

  const nextVersionNum = (latestVersionNum ?? 0) + 1
  const nextVersionLabel = `v${nextVersionNum}`

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader>
          <CardTitle>Formulario de postulacion</CardTitle>
          <CardDescription className="text-slate-300">
            Cargando formulario…
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800 text-slate-100">
      <CardHeader>
        <CardTitle>Formulario de postulacion</CardTitle>
        <CardDescription className="text-slate-300">
          Crea versiones del formulario para esta edicion.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-slate-300">
            {form?.is_active
              ? 'Hay un formulario activo.'
              : 'Sin formulario activo.'}
          </div>
          {form?.is_active ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDeactivateOpen(true)}
            >
              Desactivar formulario
            </Button>
          ) : null}
        </div>

        <div className="rounded-md border border-slate-800 bg-slate-900 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="formVersion">Version (auto)</Label>
              <Input
                id="formVersion"
                autoComplete="off"
                value={nextVersionLabel}
                disabled
                aria-readonly="true"
              />
              <div className="text-xs text-slate-400">
                Se incrementa automaticamente al guardar.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <Switch
                id="formIsActive"
                checked={newFormIsActive}
                onCheckedChange={setNewFormIsActive}
                aria-label="Formulario activo"
              />
              <Label htmlFor="formIsActive" className="text-sm">
                {newFormIsActive ? 'Activo' : 'Inactivo'} (solo el activo se usa
                en la web)
              </Label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="formOpensAt">Apertura (ISO opcional)</Label>
              <Input
                id="formOpensAt"
                autoComplete="off"
                value={newFormOpensAt}
                onChange={(element) => setNewFormOpensAt(element.target.value)}
                placeholder="2026-01-20T12:00:00Z…"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="formClosesAt">Cierre (ISO opcional)</Label>
              <Input
                id="formClosesAt"
                autoComplete="off"
                value={newFormClosesAt}
                onChange={(element) => setNewFormClosesAt(element.target.value)}
                placeholder="2026-02-20T23:59:59Z…"
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="schemaTitle">Titulo del formulario</Label>
            <Input
              id="schemaTitle"
              autoComplete="off"
              value={schemaTitle}
              onChange={(element) => setSchemaTitle(element.target.value)}
              placeholder="Ej: Postulacion Project Academy"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schemaDescription">Descripcion (opcional)</Label>
            <Input
              id="schemaDescription"
              autoComplete="off"
              value={schemaDescription}
              onChange={(element) => setSchemaDescription(element.target.value)}
              placeholder="Ej: Completa tus datos para postular…"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => addField('text')}
            className="border-slate-800 bg-slate-900 text-slate-100"
          >
            + Texto
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => addField('textarea')}
            className="border-slate-800 bg-slate-900 text-slate-100"
          >
            + Parrafo
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => addField('number')}
            className="border-slate-800 bg-slate-900 text-slate-100"
          >
            + Numero
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => addField('date')}
            className="border-slate-800 bg-slate-900 text-slate-100"
          >
            + Fecha
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => addField('select')}
            className="border-slate-800 bg-slate-900 text-slate-100"
          >
            + Select
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => addField('checkbox')}
            className="border-slate-800 bg-slate-900 text-slate-100"
          >
            + Checkbox
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => addField('link')}
            className="border-slate-800 bg-slate-900 text-slate-100"
          >
            + Enlace
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((f, index) => (
            <div
              key={f.id}
              className="rounded-md border border-slate-800 bg-slate-900 p-4 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <GripVertical
                    className="h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <div className="font-medium">
                    {f.type === 'link' ? 'Enlace' : 'Campo'} {index + 1}:{' '}
                    <span className="text-slate-400">{f.type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => moveField(f.id, 'up')}
                    disabled={index === 0}
                    aria-label="Mover campo arriba"
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => moveField(f.id, 'down')}
                    disabled={index === fields.length - 1}
                    aria-label="Mover campo abajo"
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeField(f.id)}
                    aria-label="Eliminar campo"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`field_${f.id}_label`}>Label</Label>
                  <Input
                    id={`field_${f.id}_label`}
                    autoComplete="off"
                    value={f.label}
                    onChange={(element) =>
                      updateField(f.id, { label: element.target.value })
                    }
                    placeholder="Ej: Empresa…"
                  />
                </div>

                {f.type === 'link' ? (
                  <div className="space-y-2">
                    <Label htmlFor={`field_${f.id}_url`}>URL</Label>
                    <Input
                      id={`field_${f.id}_url`}
                      type="url"
                      inputMode="url"
                      spellCheck={false}
                      autoComplete="off"
                      value={f.url}
                      onChange={(element) =>
                        updateField(f.id, { url: element.target.value })
                      }
                      placeholder="https://ejemplo.com/…"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor={`field_${f.id}_name`}>Nombre (key)</Label>
                    <Input
                      id={`field_${f.id}_name`}
                      spellCheck={false}
                      autoComplete="off"
                      value={f.name}
                      onChange={(element) =>
                        updateField(f.id, {
                          name: toFieldName(element.target.value),
                        })
                      }
                      placeholder="Ej: company…"
                    />
                    <div className="text-xs text-slate-400">
                      Se guarda como key. Evita nombres reservados del perfil.
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`field_${f.id}_type`}>Tipo</Label>
                  <Select
                    value={f.type}
                    onValueChange={(v) => updateFieldType(f.id, v as FieldType)}
                  >
                    <SelectTrigger id={`field_${f.id}_type`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="textarea">Parrafo</SelectItem>
                      <SelectItem value="number">Numero</SelectItem>
                      <SelectItem value="date">Fecha</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="link">Enlace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {f.type === 'link' ? (
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      id={`field_${f.id}_open_in_new_tab`}
                      checked={f.openInNewTab !== false}
                      onCheckedChange={(v) =>
                        updateField(f.id, { openInNewTab: v })
                      }
                      aria-label={`${f.label || 'Enlace'} abre en nueva pestaña`}
                    />
                    <Label
                      htmlFor={`field_${f.id}_open_in_new_tab`}
                      className="text-sm"
                    >
                      Abrir en nueva pestaña
                    </Label>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      checked={Boolean(f.required)}
                      onCheckedChange={(v) =>
                        updateField(f.id, { required: v })
                      }
                      aria-label={`${f.label || 'Campo'} requerido`}
                    />
                    <div className="text-sm">
                      {f.required ? 'Requerido' : 'Opcional'}
                    </div>
                  </div>
                )}
              </div>

              {f.type === 'link' ? (
                <div className="space-y-2">
                  <Label htmlFor={`field_${f.id}_description`}>
                    Descripcion (opcional)
                  </Label>
                  <Input
                    id={`field_${f.id}_description`}
                    autoComplete="off"
                    value={f.description ?? ''}
                    onChange={(element) =>
                      updateField(f.id, { description: element.target.value })
                    }
                    placeholder="Ej: PDF con terminos y condiciones…"
                  />
                </div>
              ) : null}

              {f.type !== 'link' && f.type !== 'checkbox' ? (
                <div className="space-y-2">
                  <Label htmlFor={`field_${f.id}_placeholder`}>
                    Placeholder (opcional)
                  </Label>
                  <Input
                    id={`field_${f.id}_placeholder`}
                    autoComplete="off"
                    value={f.placeholder ?? ''}
                    onChange={(element) =>
                      updateField(f.id, { placeholder: element.target.value })
                    }
                  />
                </div>
              ) : null}

              {f.type === 'select' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Opciones</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addSelectOption(f.id)}
                    >
                      + Agregar opcion
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {(f.options ?? []).map((opt, optIndex) => (
                      <div
                        key={`${f.id}_opt_${optIndex}`}
                        className="grid gap-2 md:grid-cols-[1fr_1fr_auto] items-end"
                      >
                        <div className="space-y-1">
                          <Label
                            htmlFor={`field_${f.id}_opt_${optIndex}_value`}
                            className="text-xs"
                          >
                            Value
                          </Label>
                          <Input
                            id={`field_${f.id}_opt_${optIndex}_value`}
                            autoComplete="off"
                            value={opt.value}
                            onChange={(element) =>
                              updateSelectOption(f.id, optIndex, {
                                value: toFieldName(element.target.value),
                              })
                            }
                            placeholder="opcion_1…"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label
                            htmlFor={`field_${f.id}_opt_${optIndex}_label`}
                            className="text-xs"
                          >
                            Label
                          </Label>
                          <Input
                            id={`field_${f.id}_opt_${optIndex}_label`}
                            autoComplete="off"
                            value={opt.label}
                            onChange={(element) =>
                              updateSelectOption(f.id, optIndex, {
                                label: element.target.value,
                              })
                            }
                            placeholder="Opcion 1…"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeSelectOption(f.id, optIndex)}
                          aria-label="Eliminar opcion"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <Separator />

        <Button onClick={upsertForm} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" aria-hidden="true" />
          Guardar formulario
        </Button>
      </CardContent>

      <ConfirmDialog
        open={confirmDeactivateOpen}
        onOpenChange={setConfirmDeactivateOpen}
        title="Desactivar formulario?"
        description="Las postulaciones anteriores se mantendran intactas, pero este formulario dejara de estar disponible."
        confirmLabel="Desactivar"
        confirmVariant="destructive"
        confirmDisabled={saving}
        onConfirm={confirmDeactivateForm}
      />
    </Card>
  )
}
