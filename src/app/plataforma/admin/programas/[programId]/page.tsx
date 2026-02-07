// src/app/plataforma/admin/programas/%5BprogramId%5D/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'

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

import {
  Plus,
  ArrowLeft,
  Save,
  Trash2,
  GripVertical,
  Pencil,
} from 'lucide-react'

type ProgramRow = {
  id: string
  slug: string
  title: string
  description: string | null
  is_published: boolean
  requires_payment_pre: boolean
  created_at: string
  updated_at: string
}

type EditionRow = {
  id: string
  program_id: string
  edition_name: string
  starts_at: string | null
  ends_at: string | null
  is_open: boolean
  created_at: string
  updated_at: string
}

type ApplicationFormRow = {
  id: string
  program_id: string
  edition_id: string | null
  version_num: number
  schema_json: unknown
  is_active: boolean
  opens_at: string | null
  closes_at: string | null
  created_at: string
  updated_at: string
}

type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'date'

type FormField = {
  id: string
  type: FieldType
  label: string
  name: string
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[] // select
}

type FormSchema = {
  title: string
  description?: string
  fields: FormField[]
}

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

function toDateOnlyOrNull(value: string): string | null {
  const v = value.trim()
  if (!v) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  return v
}

function uid(prefix = 'f') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

// slugify simple para name de campo
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

const DEFAULT_SCHEMA_TITLE = 'Formulario de Postulación'
const DEFAULT_SCHEMA_DESCRIPTION = 'Completa los campos solicitados.'

function createDefaultFields(): FormField[] {
  return []
}

export default function AdminProgramDetailPage() {
  const parameters = useParams<{ programId: string }>()
  const { showError, showSuccess } = useToastEnhanced()

  const programId = parameters.programId

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [program, setProgram] = useState<ProgramRow | null>(null)
  const [editions, setEditions] = useState<EditionRow[]>([])
  const [form, setForm] = useState<ApplicationFormRow | null>(null)
  const [latestVersionNum, setLatestVersionNum] = useState<number>(0)
  const [selectedEditionId, setSelectedEditionId] = useState<string | null>(
    null
  )
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false)

  // Program fields
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState<string>('')
  const [isPublished, setIsPublished] = useState(false)
  const [requiresPaymentPre, setRequiresPaymentPre] = useState(false)

  // Editions create
  const [newEditionName, setNewEditionName] = useState('')
  const [newEditionStartsAt, setNewEditionStartsAt] = useState('')
  const [newEditionEndsAt, setNewEditionEndsAt] = useState('')
  const [isEditionModalOpen, setIsEditionModalOpen] = useState(false)
  const [editingEdition, setEditingEdition] = useState<EditionRow | null>(null)
  const [editionIsOpen, setEditionIsOpen] = useState(true)

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
    if (!programId) return
    void loadAll()
  }, [programId])

  useEffect(() => {
    if (!programId) return
    void loadFormForEdition(selectedEditionId)
  }, [programId, selectedEditionId])

  async function loadAll() {
    setLoading(true)

    const programResponse = await supabase
      .from('programs')
      .select(
        'id, slug, title, description, is_published, requires_payment_pre, created_at, updated_at'
      )
      .eq('id', programId)
      .maybeSingle()
    if (programResponse.error || !programResponse.data) {
      showError('No se pudo cargar el programa.')
      setLoading(false)
      return
    }

    const p = programResponse.data as ProgramRow
    setProgram(p)

    setTitle(p.title)
    setSlug(p.slug)
    setDescription(p.description ?? '')
    setIsPublished(p.is_published)
    setRequiresPaymentPre(p.requires_payment_pre)

    const editionsResponse = await supabase
      .from('program_editions')
      .select(
        'id, program_id, edition_name, starts_at, ends_at, is_open, created_at, updated_at'
      )
      .eq('program_id', programId)
      .order('created_at', { ascending: false })

    if (editionsResponse.error) {
      showError('No se pudieron cargar las ediciones.')
      setEditions([])
    } else {
      const nextEditions = (editionsResponse.data ?? []) as EditionRow[]
      setEditions(nextEditions)
      if (
        selectedEditionId &&
        !nextEditions.some((edition) => edition.id === selectedEditionId)
      ) {
        setSelectedEditionId(null)
      }
    }

    setLoading(false)
  }

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

  async function loadFormForEdition(editionId: string | null) {
    if (!programId) return

    let query = supabase
      .from('application_forms')
      .select(
        'id, program_id, edition_id, version_num, schema_json, is_active, opens_at, closes_at, created_at, updated_at'
      )
      .eq('program_id', programId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)

    query = editionId
      ? query.eq('edition_id', editionId)
      : query.is('edition_id', null)

    const formResponse = await query.maybeSingle()

    if (formResponse.error) {
      showError('No se pudo cargar el formulario activo.')
      setForm(null)
      resetBuilder()
      return
    }

    let latestQuery = supabase
      .from('application_forms')
      .select('version_num')
      .eq('program_id', programId)
      .order('version_num', { ascending: false })
      .limit(1)

    latestQuery = editionId
      ? latestQuery.eq('edition_id', editionId)
      : latestQuery.is('edition_id', null)

    const latestResponse = await latestQuery.maybeSingle()
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
  }

  async function saveProgram() {
    if (!program) return
    const nextTitle = title.trim()
    const nextSlug = slug.trim()

    if (!nextTitle) return showError('El título es obligatorio.')
    if (!nextSlug) return showError('El slug es obligatorio.')

    setSaving(true)

    const response = await supabase
      .from('programs')
      .update({
        title: nextTitle,
        slug: nextSlug,
        description: description.trim() ? description.trim() : null,
        is_published: isPublished,
        requires_payment_pre: requiresPaymentPre,
      })
      .eq('id', program.id)

    setSaving(false)

    if (response.error) {
      showError(`No se pudo guardar. ${safeString(response.error.message)}`)
      return
    }

    showSuccess('Programa guardado.')
    await loadAll()
  }

  function openEditionModal() {
    setNewEditionName('')
    setNewEditionStartsAt('')
    setNewEditionEndsAt('')
    setEditionIsOpen(true)
    setEditingEdition(null)
    setIsEditionModalOpen(true)
  }

  function openEditEditionModal(edition: EditionRow) {
    setNewEditionName(edition.edition_name)
    setNewEditionStartsAt(edition.starts_at ?? '')
    setNewEditionEndsAt(edition.ends_at ?? '')
    setEditionIsOpen(Boolean(edition.is_open))
    setEditingEdition(edition)
    setIsEditionModalOpen(true)
  }

  function closeEditionModal() {
    setIsEditionModalOpen(false)
    setEditingEdition(null)
  }

  async function saveEdition() {
    const editionName = newEditionName.trim()
    if (!editionName) return showError('El nombre de edición es obligatorio.')

    const startsAt = toDateOnlyOrNull(newEditionStartsAt)
    const endsAt = toDateOnlyOrNull(newEditionEndsAt)

    if (newEditionStartsAt && !startsAt) {
      return showError('La fecha de inicio no es válida.')
    }
    if (newEditionEndsAt && !endsAt) {
      return showError('La fecha de fin no es válida.')
    }

    if (startsAt && endsAt) {
      const startDate = new Date(startsAt)
      const endDate = new Date(endsAt)
      if (startDate > endDate) {
        return showError(
          'La fecha de inicio no puede ser posterior a la fecha de fin.'
        )
      }
    }

    setSaving(true)

    const payload = {
      program_id: programId,
      edition_name: editionName,
      starts_at: startsAt,
      ends_at: endsAt,
      is_open: editionIsOpen,
    }

    const response = editingEdition
      ? await supabase
          .from('program_editions')
          .update(payload)
          .eq('id', editingEdition.id)
          .select('id')
          .maybeSingle()
      : await supabase
          .from('program_editions')
          .insert(payload)
          .select('id')
          .maybeSingle()

    setSaving(false)

    if (response.error) {
      showError(
        `No se pudo crear la edición. ${safeString(response.error.message)}`
      )
      return
    }

    showSuccess(editingEdition ? 'Edición actualizada.' : 'Edición creada.')
    closeEditionModal()
    await loadAll()
  }

  const nextVersionNum = (latestVersionNum ?? 0) + 1
  const nextVersionLabel = `v${nextVersionNum}`

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
    // validaciones mínimas tipo "tally"
    if (!schemaTitle.trim()) return showError('Poné un título de formulario.')
    if (fields.length === 0) return showError('Agregá al menos 1 campo.')

    // verificar nombres únicos
    const names = new Set<string>()
    for (const f of fields) {
      const name = f.name.trim()
      if (!name)
        return showError(`Hay un campo sin "name". (${f.label || f.id})`)
      if (names.has(name))
        return showError(`Hay campos con el mismo name: "${name}"`)
      names.add(name)

      if (!f.label.trim())
        return showError('Todos los campos deben tener label.')

      // PROHIBIDOS: no dejar que pidan datos base del perfil
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
          `El campo "${f.label}" usa name="${name}" pero eso viene del perfil y se autocompleta. Cambiá el name.`
        )
      }

      if (f.type === 'select') {
        const options = f.options ?? []
        if (options.length < 2)
          return showError(
            `El campo "${f.label}" (select) necesita al menos 2 opciones.`
          )
        if (options.some((o) => !o.value.trim() || !o.label.trim()))
          return showError(`El campo "${f.label}" tiene opciones vacías.`)
      }
    }

    const schema = buildSchema()
    const opensAtIso = toIsoOrNull(newFormOpensAt)
    const closesAtIso = toIsoOrNull(newFormClosesAt)

    setSaving(true)

    const editionId = selectedEditionId
    const payload = {
      program_id: programId,
      edition_id: editionId,
      schema_json: schema,
      is_active: newFormIsActive,
      opens_at: opensAtIso,
      closes_at: closesAtIso,
    }

    if (newFormIsActive) {
      let deactivateQuery = supabase
        .from('application_forms')
        .update({ is_active: false })
        .eq('program_id', programId)
        .eq('is_active', true)

      deactivateQuery = editionId
        ? deactivateQuery.eq('edition_id', editionId)
        : deactivateQuery.is('edition_id', null)

      const { error: deactivateError } = await deactivateQuery
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
    showSuccess('Formulario guardado. Nueva versión creada.')
    await loadFormForEdition(editionId)
  }

  // ---------- Form builder helpers ----------
  function addField(type: FieldType) {
    const nextLabel =
      type === 'email'
        ? 'Email'
        : type === 'phone'
          ? 'Teléfono'
          : type === 'textarea'
            ? 'Descripción'
            : type === 'number'
              ? 'Número'
              : type === 'date'
                ? 'Fecha'
                : type === 'checkbox'
                  ? 'Acepto términos'
                  : type === 'select'
                    ? 'Seleccionar opción'
                    : 'Nuevo campo'

    const name = toFieldName(nextLabel)
    const base: FormField = {
      id: uid('field'),
      type,
      label: nextLabel,
      name,
      placeholder: type === 'checkbox' ? undefined : '',
      required: type !== 'checkbox',
    }

    if (type === 'select') {
      base.options = [
        { value: 'opcion_1', label: 'Opción 1' },
        { value: 'opcion_2', label: 'Opción 2' },
      ]
    }

    setFields((previous) => [...previous, base])
  }

  function updateField(id: string, patch: Partial<FormField>) {
    setFields((previous) =>
      previous.map((f) => (f.id === id ? { ...f, ...patch } : f))
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
          label: `Opción ${options.length + 1}`,
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

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
  }

  function isFieldType(value: unknown): value is FieldType {
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

  function isFormField(value: unknown): value is FormField {
    if (!isRecord(value)) return false

    const id = value.id
    const type = value.type
    const label = value.label
    const name = value.name

    if (typeof id !== 'string') return false
    if (!isFieldType(type)) return false
    if (typeof label !== 'string') return false
    if (typeof name !== 'string') return false

    // opcionales
    if (
      'placeholder' in value &&
      value.placeholder !== undefined &&
      typeof value.placeholder !== 'string'
    ) {
      return false
    }

    if (
      'required' in value &&
      value.required !== undefined &&
      typeof value.required !== 'boolean'
    ) {
      return false
    }

    // select options
    if (type === 'select') {
      if (!('options' in value)) return false
      const options = value.options
      if (!Array.isArray(options) || options.length === 0) return false

      for (const opt of options) {
        if (!isRecord(opt)) return false
        if (typeof opt.value !== 'string') return false
        if (typeof opt.label !== 'string') return false
      }
    }

    return true
  }

  function parseSchema(schema: unknown): FormSchema | null {
    if (!isRecord(schema)) return null

    const title = schema.title
    const description = schema.description
    const fields = schema.fields

    if (typeof title !== 'string') return null
    if (
      description !== undefined &&
      description !== null &&
      typeof description !== 'string'
    ) {
      return null
    }
    if (!Array.isArray(fields)) return null
    if (!fields.every(isFormField)) return null

    return {
      title,
      description: typeof description === 'string' ? description : undefined,
      fields,
    }
  }

  function requestDeactivateForm() {
    if (!form?.id) return
    setConfirmDeactivateOpen(true)
  }

  async function confirmDeactivateForm() {
    if (!form?.id) return
    setConfirmDeactivateOpen(false)

    setSaving(true)
    const response = await supabase
      .from('application_forms')
      .update({ is_active: false })
      .eq('id', form.id)
    setSaving(false)

    if (response.error) {
      showError(`No se pudo desactivar. ${safeString(response.error.message)}`)
      return
    }

    setForm(null)
    showSuccess('Formulario desactivado.')
    resetBuilder()
  }

  const selectedEdition = selectedEditionId
    ? (editions.find((edition) => edition.id === selectedEditionId) ?? null)
    : null

  const formScopeLabel = selectedEdition
    ? `Edición: ${selectedEdition.edition_name}`
    : 'Programa (general)'
  const isEditingEdition = Boolean(editingEdition)

  if (loading) {
    return (
      <div className="p-6 bg-black">
        <Card>
          <CardHeader>
            <CardTitle>Cargando…</CardTitle>
            <CardDescription>Obteniendo datos del programa.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="p-6 bg-black">
        <Card>
          <CardHeader>
            <CardTitle>Programa no encontrado</CardTitle>
            <CardDescription>Verificá el ID.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-black">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild className="bg-[#00CCA4]">
            <Link href="/plataforma/admin/programas">
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Volver
            </Link>
          </Button>
        </div>

        <Button onClick={saveProgram} disabled={saving}>
          <Save className="h-4 w-4 mr-2" aria-hidden="true" />
          Guardar
        </Button>
      </div>

      {/* ---------------- Program ---------------- */}
      <Card className="border border-white/10 bg-[#0F1117] text-white">
        <CardHeader>
          <CardTitle>Datos del programa</CardTitle>
          <CardDescription>
            Publicación y configuración de pago.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                name="program_title"
                autoComplete="off"
                value={title}
                onChange={(element) => setTitle(element.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="program_slug"
                autoComplete="off"
                spellCheck={false}
                value={slug}
                onChange={(element) => setSlug(element.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Descripción</Label>
            <Textarea
              id="desc"
              name="program_description"
              autoComplete="off"
              value={description}
              onChange={(element) => setDescription(element.target.value)}
              rows={4}
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <Switch
                id="isPublished"
                checked={isPublished}
                onCheckedChange={setIsPublished}
                aria-label="Publicado"
              />
              <div>
                <Label htmlFor="isPublished" className="font-medium">
                  Publicado
                </Label>
                <div className="text-sm text-muted-foreground">
                  Visible en la web.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="requiresPaymentPre"
                checked={requiresPaymentPre}
                onCheckedChange={setRequiresPaymentPre}
                aria-label="Requiere pago previo"
              />
              <div>
                <Label htmlFor="requiresPaymentPre" className="font-medium">
                  Requiere pago previo
                </Label>
                <div className="text-sm text-muted-foreground">
                  Bloquea postulación sin pago (si no está exento).
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- Editions ---------------- */}
      <Card className="border border-white/10 bg-[#0F1117] text-white">
        <CardHeader>
          <CardTitle>Ediciones</CardTitle>
          <CardDescription>
            Creá ediciones para controlar apertura y cohortes.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Definí ediciones para controlar apertura y fechas.
            </div>
            <Button onClick={openEditionModal} disabled={saving}>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Crear edición
            </Button>
          </div>

          <Separator />

          {editions.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No hay ediciones todavía.
            </div>
          ) : (
            <div className="space-y-2">
              {editions.map((ed) => (
                <div
                  key={ed.id}
                  className="flex flex-col gap-3 rounded-md border border-white/10 bg-black/30 p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="font-medium">{ed.edition_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Estado: {ed.is_open ? 'Abierta' : 'Cerrada'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => openEditEditionModal(ed)}
                      disabled={saving}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------------- Forms + Builder ---------------- */}
      {/* ---------------- Forms + Builder (SINGLE) ---------------- */}
      <Card className="border border-white/10 bg-[#0F1117] text-white">
        <CardHeader>
          <CardTitle>Formulario de inscripción</CardTitle>
          <CardDescription>
            Podés tener un formulario general y otro por edición. Guardar crea
            una nueva versión; las postulaciones anteriores mantienen su
            esquema. Si hay uno activo por edición, tiene prioridad sobre el
            general. Los datos básicos del perfil se completan automáticamente.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="formScope">Formulario para</Label>
              <Select
                name="form_scope"
                value={selectedEditionId ?? 'program'}
                onValueChange={(value) =>
                  setSelectedEditionId(value === 'program' ? null : value)
                }
              >
                <SelectTrigger id="formScope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="program">Programa (general)</SelectItem>
                  {editions.map((edition) => (
                    <SelectItem key={edition.id} value={edition.id}>
                      {edition.edition_name}{' '}
                      {edition.is_open ? '(abierta)' : '(cerrada)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                Si no elegís edición, se usará el formulario general.
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2 rounded-md border border-white/10 bg-black/30 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-medium">
                Estado: {form ? 'Activo' : 'Sin formulario activo'}
              </div>
              <div className="text-sm text-muted-foreground">
                {formScopeLabel}
                {form?.version_num ? ` · Versión v${form.version_num}` : ''}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {form ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={requestDeactivateForm}
                  disabled={saving}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Desactivar
                </Button>
              ) : null}

              <Button onClick={upsertForm} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" aria-hidden="true" />
                Guardar formulario
              </Button>
            </div>
          </div>

          {/* Autofill notice */}
          <div className="rounded-md border border-white/10 bg-black/30 p-4">
            <div className="font-medium">
              Los datos del perfil del postulante se completan automáticamente
              desde su perfil no es necesario pedirlos en el formulario.
            </div>
          </div>

          {/* META */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="formVersion">Versión (auto)</Label>
              <Input
                id="formVersion"
                name="form_version_num"
                autoComplete="off"
                value={nextVersionLabel}
                disabled
                aria-readonly="true"
              />
              <div className="text-xs text-muted-foreground">
                Se incrementa automáticamente al guardar.
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
                name="form_opens_at"
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
                name="form_closes_at"
                autoComplete="off"
                value={newFormClosesAt}
                onChange={(element) => setNewFormClosesAt(element.target.value)}
                placeholder="2026-02-20T23:59:59Z…"
              />
            </div>
          </div>

          <Separator />

          {/* Builder schema */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="schemaTitle">Título del formulario</Label>
              <Input
                id="schemaTitle"
                name="schema_title"
                autoComplete="off"
                value={schemaTitle}
                onChange={(element) => setSchemaTitle(element.target.value)}
                placeholder="Ej: Postulación Project Academy…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schemaDescription">Descripción (opcional)</Label>
              <Input
                id="schemaDescription"
                name="schema_description"
                autoComplete="off"
                value={schemaDescription}
                onChange={(element) =>
                  setSchemaDescription(element.target.value)
                }
                placeholder="Ej: Completa tus datos para postular…"
              />
            </div>
          </div>

          {/* Add field buttons */}
          <div className="flex flex-wrap gap-2 ">
            <Button
              type="button"
              variant="outline"
              onClick={() => addField('text')}
              className="border-white/10 bg-black/30 text-white"
            >
              + Texto
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => addField('textarea')}
              className="border-white/10 bg-black/30 text-white"
            >
              + Párrafo
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => addField('number')}
              className="border-white/10 bg-black/30 text-white"
            >
              + Número
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => addField('date')}
              className="border-white/10 bg-black/30 text-white"
            >
              + Fecha
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => addField('select')}
              className="border-white/10 bg-black/30 text-white"
            >
              + Select
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => addField('checkbox')}
              className="border-white/10 bg-black/30 text-white"
            >
              + Checkbox
            </Button>
          </div>

          {/* Fields list (tu mismo bloque actual) */}
          <div className="space-y-3">
            {fields.map((f, index) => (
              <div
                key={f.id}
                className="rounded-md border border-white/10 bg-black/30 p-4 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <GripVertical
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div className="font-medium">
                      Campo {index + 1}:{' '}
                      <span className="text-muted-foreground">{f.type}</span>
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
                      name={`field_${f.id}_label`}
                      autoComplete="off"
                      value={f.label}
                      onChange={(element) =>
                        updateField(f.id, { label: element.target.value })
                      }
                      placeholder="Ej: Empresa…"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`field_${f.id}_name`}>Nombre (key)</Label>
                    <Input
                      id={`field_${f.id}_name`}
                      name={`field_${f.id}_name`}
                      autoComplete="off"
                      spellCheck={false}
                      value={f.name}
                      onChange={(element) =>
                        updateField(f.id, {
                          name: toFieldName(element.target.value),
                        })
                      }
                      placeholder="Ej: company…"
                    />
                    <div className="text-xs text-muted-foreground">
                      Se guarda como key. Evitá nombres reservados del perfil.
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`field_${f.id}_type`}>Tipo</Label>
                    <Select
                      name={`field_${f.id}_type`}
                      value={f.type}
                      onValueChange={(v) =>
                        updateField(f.id, {
                          type: v as FieldType,
                          options:
                            v === 'select'
                              ? (f.options ?? [
                                  { value: 'opcion_1', label: 'Opción 1' },
                                  { value: 'opcion_2', label: 'Opción 2' },
                                ])
                              : undefined,
                        })
                      }
                    >
                      <SelectTrigger id={`field_${f.id}_type`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="textarea">Párrafo</SelectItem>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="date">Fecha</SelectItem>
                        <SelectItem value="select">Select</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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
                </div>

                {f.type !== 'checkbox' ? (
                  <div className="space-y-2">
                    <Label htmlFor={`field_${f.id}_placeholder`}>
                      Placeholder (opcional)
                    </Label>
                    <Input
                      id={`field_${f.id}_placeholder`}
                      name={`field_${f.id}_placeholder`}
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
                        + Agregar opción
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
                              name={`field_${f.id}_opt_${optIndex}_value`}
                              autoComplete="off"
                              spellCheck={false}
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
                              name={`field_${f.id}_opt_${optIndex}_label`}
                              autoComplete="off"
                              value={opt.label}
                              onChange={(element) =>
                                updateSelectOption(f.id, optIndex, {
                                  label: element.target.value,
                                })
                              }
                              placeholder="Opción 1…"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSelectOption(f.id, optIndex)}
                            aria-label="Eliminar opción"
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

          <Button
            onClick={upsertForm}
            disabled={saving}
            className="gap-2 bg-[#00CCA4]"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Guardar formulario
          </Button>
        </CardContent>
      </Card>

      {isEditionModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overscroll-contain">
          <div className="w-full max-w-lg rounded-lg bg-[#0F1117] border border-[#1F2937] shadow text-[#E5E7EB]">
            <div className="p-4 border-b">
              <div className="text-lg font-semibold">
                {isEditingEdition ? 'Editar edición' : 'Nueva edición'}
              </div>
              <div className="text-sm text-[#9CA3AF]">
                {isEditingEdition
                  ? 'Actualizá el nombre, fechas o estado.'
                  : 'Definí el nombre y el rango de fechas.'}
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editionName">Nombre de edición</Label>
                <Input
                  id="editionName"
                  name="edition_name"
                  autoComplete="off"
                  placeholder="Ej: 7ma Edición 2026…"
                  value={newEditionName}
                  onChange={(element) =>
                    setNewEditionName(element.target.value)
                  }
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="editionIsOpen"
                  checked={editionIsOpen}
                  onCheckedChange={setEditionIsOpen}
                  aria-label="Edición abierta"
                />
                <Label htmlFor="editionIsOpen" className="text-sm">
                  {editionIsOpen ? 'Edición abierta' : 'Edición cerrada'}
                </Label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editionStartsAt">Fecha de inicio</Label>
                  <Input
                    id="editionStartsAt"
                    name="edition_starts_at"
                    autoComplete="off"
                    type="date"
                    value={newEditionStartsAt}
                    onChange={(element) =>
                      setNewEditionStartsAt(element.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editionEndsAt">Fecha de fin</Label>
                  <Input
                    id="editionEndsAt"
                    name="edition_ends_at"
                    autoComplete="off"
                    type="date"
                    value={newEditionEndsAt}
                    onChange={(element) =>
                      setNewEditionEndsAt(element.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={closeEditionModal}>
                Cancelar
              </Button>
              <Button onClick={saveEdition} disabled={saving}>
                {isEditingEdition ? 'Guardar cambios' : 'Crear edición'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmDeactivateOpen}
        onOpenChange={setConfirmDeactivateOpen}
        title="¿Desactivar formulario?"
        description="Las postulaciones anteriores se mantendrán intactas, pero este formulario dejará de estar disponible."
        confirmLabel="Desactivar"
        confirmVariant="destructive"
        confirmDisabled={saving}
        onConfirm={confirmDeactivateForm}
      />
    </div>
  )
}
