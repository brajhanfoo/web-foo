// src/app/plataforma/admin/programas/%5BprogramId%5D/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { EditionRow, ProgramPaymentMode, ProgramRow } from '@/types/programs'

import { ArrowLeft, ExternalLink, Plus, Save } from 'lucide-react'

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function resolvePaymentMode(program: ProgramRow): ProgramPaymentMode {
  if (program.payment_mode) return program.payment_mode
  return program.requires_payment_pre ? 'pre' : 'none'
}

function toDateOnlyOrNull(value: string): string | null {
  const v = value.trim()
  if (!v) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  return v
}

function formatDateRange(startsAt: string | null, endsAt: string | null) {
  const start = startsAt ?? '—'
  const end = endsAt ?? '—'
  return `${start} → ${end}`
}

export default function AdminProgramDetailPage() {
  const parameters = useParams<{ programId: string }>()
  const { showError, showSuccess } = useToastEnhanced()

  const programId = parameters.programId

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingEdition, setSavingEdition] = useState(false)

  const [program, setProgram] = useState<ProgramRow | null>(null)
  const [editions, setEditions] = useState<EditionRow[]>([])

  // Program fields
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState<string>('')
  const [isPublished, setIsPublished] = useState(false)
  const [paymentMode, setPaymentMode] = useState<ProgramPaymentMode>('none')
  const [priceUsd, setPriceUsd] = useState('')

  // Create edition modal
  const [isEditionModalOpen, setIsEditionModalOpen] = useState(false)
  const [newEditionName, setNewEditionName] = useState('')
  const [newEditionStartsAt, setNewEditionStartsAt] = useState('')
  const [newEditionEndsAt, setNewEditionEndsAt] = useState('')
  const [newEditionTeamCount, setNewEditionTeamCount] = useState('4')

  useEffect(() => {
    if (!programId) return
    void loadAll()
  }, [programId])

  async function loadAll() {
    setLoading(true)

    const programResponse = await supabase
      .from('programs')
      .select(
        'id, slug, title, description, is_published, payment_mode, requires_payment_pre, price_usd, created_at, updated_at'
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
    setPaymentMode(resolvePaymentMode(p))
    setPriceUsd(p.price_usd ? String(p.price_usd) : '')

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

    setLoading(false)
  }

  async function saveProgram() {
    if (!program) return
    const nextTitle = title.trim()
    const nextSlug = slug.trim()

    if (!nextTitle) return showError('El titulo es obligatorio.')
    if (!nextSlug) return showError('El slug es obligatorio.')

    const priceRaw = priceUsd.trim()
    let priceValue: number | null = null
    if (priceRaw) {
      const parsed = Number(priceRaw)
      if (!Number.isFinite(parsed) || parsed < 0) {
        return showError('Precio invalido.')
      }
      priceValue = parsed
    }

    setSaving(true)

    const response = await supabase
      .from('programs')
      .update({
        title: nextTitle,
        slug: nextSlug,
        description: description.trim() ? description.trim() : null,
        is_published: isPublished,
        payment_mode: paymentMode,
        requires_payment_pre: paymentMode === 'pre',
        price_usd: paymentMode === 'none' ? null : priceValue,
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
    setNewEditionTeamCount('4')
    setIsEditionModalOpen(true)
  }

  async function createEdition() {
    const editionName = newEditionName.trim()
    if (!editionName) return showError('El nombre de edicion es obligatorio.')

    const startsAt = toDateOnlyOrNull(newEditionStartsAt)
    const endsAt = toDateOnlyOrNull(newEditionEndsAt)

    if (newEditionStartsAt && !startsAt) {
      return showError('La fecha de inicio no es valida.')
    }
    if (newEditionEndsAt && !endsAt) {
      return showError('La fecha de fin no es valida.')
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

    const teamCountRaw = newEditionTeamCount.trim()
    const parsedTeams = teamCountRaw ? Number(teamCountRaw) : 0
    if (!Number.isFinite(parsedTeams) || parsedTeams < 0) {
      return showError('Cantidad de equipos invalida.')
    }
    const teamCount = Math.floor(parsedTeams)

    setSavingEdition(true)

    const response = await supabase
      .from('program_editions')
      .insert({
        program_id: programId,
        edition_name: editionName,
        starts_at: startsAt,
        ends_at: endsAt,
        is_open: false,
      })
      .select('id')
      .maybeSingle()

    if (response.error || !response.data?.id) {
      setSavingEdition(false)
      showError(
        `No se pudo crear la edicion. ${safeString(response.error?.message)}`
      )
      return
    }

    if (teamCount > 0) {
      const teamsPayload = Array.from({ length: teamCount }).map((_, index) => ({
        edition_id: response.data?.id,
        name: `Equipo ${index + 1}`,
      }))
      const teamsResponse = await supabase
        .from('program_edition_teams')
        .insert(teamsPayload)

      if (teamsResponse.error) {
        showError(
          `Edicion creada, pero no se pudieron crear equipos. ${safeString(
            teamsResponse.error.message
          )}`
        )
      }
    }

    setSavingEdition(false)
    setIsEditionModalOpen(false)
    showSuccess('Edicion creada.')
    await loadAll()
  }

  const editionsSummary = useMemo(() => {
    if (editions.length === 0) return 'No hay ediciones.'
    return `${editions.length} edicion(es)`
  }, [editions.length])

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
          Cargando...
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
          Programa no encontrado.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/plataforma/admin/programas"
            className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-slate-100">{program.title}</h1>
            <p className="text-sm text-slate-300">{program.slug}</p>
          </div>
        </div>

        <Button onClick={openEditionModal} className="gap-2 bg-[#00CCA4]">
          <Plus className="h-4 w-4" />
          Nueva edicion
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader>
            <CardTitle>Configuracion del programa</CardTitle>
            <CardDescription className="text-slate-300">
              Actualiza el nombre, descripcion, pago y publicacion.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="programTitle">Nombre</Label>
                <Input
                  id="programTitle"
                  value={title}
                  onChange={(element) => setTitle(element.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="programSlug">Slug</Label>
                <Input
                  id="programSlug"
                  value={slug}
                  onChange={(element) => setSlug(element.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="programDescription">Descripcion</Label>
              <Textarea
                id="programDescription"
                value={description}
                onChange={(element) => setDescription(element.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="programPayment">Modo de pago</Label>
                <Select
                  value={paymentMode}
                  onValueChange={(value) =>
                    setPaymentMode(value as ProgramPaymentMode)
                  }
                >
                  <SelectTrigger id="programPayment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin pago</SelectItem>
                    <SelectItem value="pre">Pago previo</SelectItem>
                    <SelectItem value="post">Pago posterior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="programPrice">Precio (USD)</Label>
                <Input
                  id="programPrice"
                  value={priceUsd}
                  onChange={(element) => setPriceUsd(element.target.value)}
                  placeholder="Ej: 49.99"
                  inputMode="decimal"
                  disabled={paymentMode === 'none'}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="programPublished"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
              <Label htmlFor="programPublished">
                {isPublished ? 'Publicado' : 'Oculto'}
              </Label>
            </div>

            <div className="flex items-center justify-end">
              <Button onClick={saveProgram} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                Guardar programa
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader>
            <CardTitle>Ediciones</CardTitle>
            <CardDescription className="text-slate-300">
              {editionsSummary}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editions.length === 0 ? (
              <div className="text-sm text-slate-300">
                Todavia no hay ediciones creadas.
              </div>
            ) : (
              <div className="space-y-3">
                {editions.map((edition) => (
                  <div
                    key={edition.id}
                    className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{edition.edition_name}</div>
                        <div className="text-xs text-slate-300">
                          {formatDateRange(
                            edition.starts_at,
                            edition.ends_at
                          )}
                        </div>
                      </div>
                      <div className="text-xs rounded-full border border-slate-800 px-2 py-1">
                        {edition.is_open ? 'Abierta' : 'Cerrada'}
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <Button
                        asChild
                        variant="secondary"
                        className="gap-2"
                      >
                        <Link
                          href={`/plataforma/admin/programas/${programId}/ediciones/${edition.id}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Gestionar
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditionModalOpen} onOpenChange={setIsEditionModalOpen}>
        <DialogContent className="border border-slate-800 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle>Nueva edicion</DialogTitle>
            <DialogDescription className="text-slate-300">
              La edicion se crea cerrada por defecto. Podras abrirla despues de
              crear el formulario.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editionName">Nombre</Label>
              <Input
                id="editionName"
                value={newEditionName}
                onChange={(element) => setNewEditionName(element.target.value)}
                placeholder="Ej: 7ma Edicion 2026"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editionStart">Inicio</Label>
                <Input
                  id="editionStart"
                  type="date"
                  value={newEditionStartsAt}
                  onChange={(element) =>
                    setNewEditionStartsAt(element.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editionEnd">Fin</Label>
                <Input
                  id="editionEnd"
                  type="date"
                  value={newEditionEndsAt}
                  onChange={(element) =>
                    setNewEditionEndsAt(element.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editionTeams">Cantidad de equipos</Label>
              <Input
                id="editionTeams"
                value={newEditionTeamCount}
                onChange={(element) =>
                  setNewEditionTeamCount(element.target.value)
                }
                inputMode="numeric"
                placeholder="Ej: 4"
              />
              <div className="text-xs text-slate-300">
                Se crearan equipos base (Equipo 1..N). Podras editarlos luego.
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsEditionModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={createEdition} disabled={savingEdition}>
              Crear edicion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Separator className="bg-slate-800" />
    </div>
  )
}
