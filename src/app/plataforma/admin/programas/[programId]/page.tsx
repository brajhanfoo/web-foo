'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-stores'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'

import { Button } from '@/components/ui/button'
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
  Lock,
  Unlock,
  Trash2,
  GripVertical,
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
  version: string
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
  version: string
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

function uid(prefix = 'f') {
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

export default function AdminProgramDetailPage() {
  const parameters = useParams<{ programId: string }>()
  const router = useRouter()
  const { showError, showSuccess } = useToastEnhanced()

  const { profile, isBooting } = useAuthStore()

  const programId = parameters.programId
  const didLoadReference = useRef(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [program, setProgram] = useState<ProgramRow | null>(null)
  const [editions, setEditions] = useState<EditionRow[]>([])
  const [form, setForm] = useState<ApplicationFormRow | null>(null)

  // Program fields
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState<string>('')
  const [isPublished, setIsPublished] = useState(false)
  const [requiresPaymentPre, setRequiresPaymentPre] = useState(false)

  // Editions create
  const [newEditionName, setNewEditionName] = useState('')

  // Form builder meta
  const [newFormVersion, setNewFormVersion] = useState('v1')
  const [newFormIsActive, setNewFormIsActive] = useState(true)
  const [newFormOpensAt, setNewFormOpensAt] = useState<string>('')
  const [newFormClosesAt, setNewFormClosesAt] = useState<string>('')

  // Form schema builder
  const [schemaTitle, setSchemaTitle] = useState('Formulario de Postulación')
  const [schemaDescription, setSchemaDescription] = useState(
    'Completa los campos solicitados.'
  )
  const [fields, setFields] = useState<FormField[]>([
    {
      id: uid('field'),
      type: 'text',
      label: 'Nombre completo',
      name: 'full_name',
      placeholder: 'Ej: Gonzalo Rodríguez',
      required: true,
    },
    {
      id: uid('field'),
      type: 'email',
      label: 'Email',
      name: 'email',
      placeholder: 'tuemail@ejemplo.com',
      required: true,
    },
  ])

  const isAdmin = useMemo(() => {
    const role = profile?.role ?? 'talent'
    return role === 'admin' || role === 'super_admin'
  }, [profile?.role])

  useEffect(() => {
    if (isBooting) return
    if (!profile) return

    if (!isAdmin) {
      router.replace('/plataforma')
      return
    }

    if (didLoadReference.current) return
    didLoadReference.current = true

    void loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBooting, profile, isAdmin, programId])

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
      setEditions((editionsResponse.data ?? []) as EditionRow[])
    }

    const formResponse = await supabase
      .from('application_forms')
      .select(
        'id, program_id, edition_id, version, schema_json, is_active, opens_at, closes_at, created_at, updated_at'
      )
      .eq('program_id', programId)
      .is('edition_id', null) // 👈 SOLO el “form principal del programa”
      .maybeSingle()

    if (formResponse.error) {
      showError('No se pudo cargar el formulario del programa.')
      setForm(null)
    } else {
      setForm((formResponse.data ?? null) as ApplicationFormRow | null)

      // si existe, lo cargamos directo al builder
      if (formResponse.data) {
        const existing = formResponse.data as ApplicationFormRow
        const parsed = parseSchema(existing.schema_json)
        if (parsed) {
          setNewFormVersion(existing.version || parsed.version || 'v1')
          setNewFormIsActive(Boolean(existing.is_active))
          setNewFormOpensAt(existing.opens_at ?? '')
          setNewFormClosesAt(existing.closes_at ?? '')

          setSchemaTitle(parsed.title || 'Formulario')
          setSchemaDescription(parsed.description || '')
          setFields(Array.isArray(parsed.fields) ? parsed.fields : [])
        }
      }
    }

    setLoading(false)
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

  async function createEdition() {
    const editionName = newEditionName.trim()
    if (!editionName) return showError('El nombre de edición es obligatorio.')

    setSaving(true)

    const response = await supabase
      .from('program_editions')
      .insert({
        program_id: programId,
        edition_name: editionName,
        is_open: true,
      })
      .select('id')
      .maybeSingle()

    setSaving(false)

    if (response.error) {
      showError(
        `No se pudo crear la edición. ${safeString(response.error.message)}`
      )
      return
    }

    setNewEditionName('')
    showSuccess('Edición creada.')
    await loadAll()
  }

  async function toggleEditionOpen(editionId: string, nextOpen: boolean) {
    setSaving(true)
    const response = await supabase
      .from('program_editions')
      .update({ is_open: nextOpen })
      .eq('id', editionId)
    setSaving(false)

    if (response.error) {
      showError(
        `No se pudo actualizar la edición. ${safeString(response.error.message)}`
      )
      return
    }

    showSuccess(`Edición ${nextOpen ? 'abierta' : 'cerrada'}.`)
    await loadAll()
  }

  function buildSchema(): FormSchema {
    return {
      version: newFormVersion.trim() ? newFormVersion.trim() : 'v1',
      title: schemaTitle.trim() ? schemaTitle.trim() : 'Formulario',
      description: schemaDescription.trim()
        ? schemaDescription.trim()
        : undefined,
      fields,
    }
  }

  async function upsertForm() {
    // validaciones mínimas tipo "tally"
    const version = newFormVersion.trim() ? newFormVersion.trim() : 'v1'
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

    // si existe => update; si no => insert
    const payload = {
      program_id: programId,
      edition_id: null as string | null, // 👈 siempre null (solo 1 por programa)
      version,
      schema_json: schema,
      is_active: newFormIsActive,
      opens_at: opensAtIso,
      closes_at: closesAtIso,
    }

    const response = form?.id
      ? await supabase
          .from('application_forms')
          .update(payload)
          .eq('id', form.id)
          .select('*')
          .maybeSingle()
      : await supabase
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
    showSuccess('Formulario guardado.')
    await loadAll()
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

    const version = schema.version
    const title = schema.title
    const description = schema.description
    const fields = schema.fields

    if (typeof version !== 'string') return null
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
      version,
      title,
      description: typeof description === 'string' ? description : undefined,
      fields,
    }
  }

  async function deleteSingleForm() {
    if (!form?.id) return
    const ok = window.confirm(
      '¿Eliminar el formulario del programa? Esto NO se puede deshacer.'
    )
    if (!ok) return

    setSaving(true)
    const response = await supabase
      .from('application_forms')
      .delete()
      .eq('id', form.id)
    setSaving(false)

    if (response.error) {
      showError(`No se pudo eliminar. ${safeString(response.error.message)}`)
      return
    }

    setForm(null)
    showSuccess('Formulario eliminado.')
    // reset builder a defaults
    setNewFormVersion('v1')
    setNewFormIsActive(true)
    setNewFormOpensAt('')
    setNewFormClosesAt('')
    setSchemaTitle('Formulario de Postulación')
    setSchemaDescription('Completa los campos solicitados.')
    setFields([])
  }

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
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
        </div>

        <Button onClick={saveProgram} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          Guardar
        </Button>
      </div>

      {/* ---------------- Program ---------------- */}
      <Card className="bg-[#302f2f] text-amber-50">
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
                value={title}
                onChange={(element) => setTitle(element.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(element) => setSlug(element.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Descripción</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(element) => setDescription(element.target.value)}
              rows={4}
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              <div>
                <div className="font-medium">Publicado</div>
                <div className="text-sm text-muted-foreground">
                  Visible en la web.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={requiresPaymentPre}
                onCheckedChange={setRequiresPaymentPre}
              />
              <div>
                <div className="font-medium">Requiere pago previo</div>
                <div className="text-sm text-muted-foreground">
                  Bloquea postulación sin pago (si no está exento).
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- Editions ---------------- */}
      <Card className="bg-[#302f2f] text-amber-50">
        <CardHeader>
          <CardTitle>Ediciones</CardTitle>
          <CardDescription>
            Creá ediciones para controlar apertura y cohortes.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="editionName">Nombre de edición</Label>
              <Input
                id="editionName"
                placeholder="Ej: 7ma Edición 2026"
                value={newEditionName}
                onChange={(element) => setNewEditionName(element.target.value)}
              />
            </div>

            <Button onClick={createEdition} disabled={saving}>
              <Plus className="h-4 w-4 mr-2" />
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
                  className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
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
                      onClick={() => toggleEditionOpen(ed.id, !ed.is_open)}
                      disabled={saving}
                      className="gap-2"
                    >
                      {ed.is_open ? (
                        <>
                          <Lock className="h-4 w-4" />
                          Cerrar
                        </>
                      ) : (
                        <>
                          <Unlock className="h-4 w-4" />
                          Abrir
                        </>
                      )}
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
      <Card className="bg-[#302f2f] text-amber-50">
        <CardHeader>
          <CardTitle>Formulario del programa</CardTitle>
          <CardDescription>
            Solo existe <b>1 formulario</b> por programa. Se edita y se
            actualiza. Los datos básicos del perfil se completan
            automáticamente.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex flex-col gap-2 rounded-md border p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-medium">
                Estado: {form ? 'Existe' : 'No existe aún'}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {form ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={deleteSingleForm}
                  disabled={saving}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              ) : null}

              <Button onClick={upsertForm} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                Guardar formulario
              </Button>
            </div>
          </div>

          {/* Autofill notice */}
          <div className="rounded-md border p-4">
            <div className="font-medium">
              Los datos del perfil del postulante se completan automáticamente
              desde su perfil no es necesario pedirlos en el formulario.
            </div>
          </div>

          {/* META */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Versión</Label>
              <Input
                value={newFormVersion}
                onChange={(element) => setNewFormVersion(element.target.value)}
                placeholder="v1"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <Switch
                checked={newFormIsActive}
                onCheckedChange={setNewFormIsActive}
              />
              <div className="text-sm">
                {newFormIsActive ? 'Activo' : 'Inactivo'} (solo el activo se usa
                en la web)
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Apertura (ISO opcional)</Label>
              <Input
                value={newFormOpensAt}
                onChange={(element) => setNewFormOpensAt(element.target.value)}
                placeholder="2026-01-20T12:00:00Z"
              />
            </div>

            <div className="space-y-2">
              <Label>Cierre (ISO opcional)</Label>
              <Input
                value={newFormClosesAt}
                onChange={(element) => setNewFormClosesAt(element.target.value)}
                placeholder="2026-02-20T23:59:59Z"
              />
            </div>
          </div>

          <Separator />

          {/* Builder schema */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Título del formulario</Label>
              <Input
                value={schemaTitle}
                onChange={(element) => setSchemaTitle(element.target.value)}
                placeholder="Ej: Postulación Project Academy"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Input
                value={schemaDescription}
                onChange={(element) =>
                  setSchemaDescription(element.target.value)
                }
                placeholder="Ej: Completa tus datos para postular."
              />
            </div>
          </div>

          {/* Add field buttons */}
          <div className="flex flex-wrap gap-2 ">
            <Button
              type="button"
              variant="outline"
              onClick={() => addField('text')}
              className="bg-[#302f2f] text-amber-50"
            >
              + Texto
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => addField('textarea')}
              className="bg-[#302f2f] text-amber-50"
            >
              + Párrafo
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => addField('number')}
              className="bg-[#302f2f] text-amber-50"
            >
              + Número
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => addField('date')}
              className="bg-[#302f2f] text-amber-50"
            >
              + Fecha
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => addField('select')}
              className="bg-[#302f2f] text-amber-50"
            >
              + Select
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => addField('checkbox')}
              className="bg-[#302f2f] text-amber-50"
            >
              + Checkbox
            </Button>
          </div>

          {/* Fields list (tu mismo bloque actual) */}
          <div className="space-y-3">
            {fields.map((f, index) => (
              <div key={f.id} className="rounded-md border p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
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
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => moveField(f.id, 'down')}
                      disabled={index === fields.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeField(f.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Label</Label>
                    <Input
                      value={f.label}
                      onChange={(element) =>
                        updateField(f.id, { label: element.target.value })
                      }
                      placeholder="Ej: Empresa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nombre (key)</Label>
                    <Input
                      value={f.name}
                      onChange={(element) =>
                        updateField(f.id, {
                          name: toFieldName(element.target.value),
                        })
                      }
                      placeholder="Ej: company"
                    />
                    <div className="text-xs text-muted-foreground">
                      Se guarda como key. Evitá nombres reservados del perfil.
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
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
                      <SelectTrigger>
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
                    />
                    <div className="text-sm">
                      {f.required ? 'Requerido' : 'Opcional'}
                    </div>
                  </div>
                </div>

                {f.type !== 'checkbox' ? (
                  <div className="space-y-2">
                    <Label>Placeholder (opcional)</Label>
                    <Input
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
                            <Label className="text-xs">Value</Label>
                            <Input
                              value={opt.value}
                              onChange={(element) =>
                                updateSelectOption(f.id, optIndex, {
                                  value: toFieldName(element.target.value),
                                })
                              }
                              placeholder="opcion_1"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Label</Label>
                            <Input
                              value={opt.label}
                              onChange={(element) =>
                                updateSelectOption(f.id, optIndex, {
                                  label: element.target.value,
                                })
                              }
                              placeholder="Opción 1"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSelectOption(f.id, optIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
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
            <Save className="h-4 w-4" />
            Guardar formulario
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
