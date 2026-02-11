'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { useProgramsAdminStore } from '@/stores/programs-admin-store'
import {
  Plus,
  ExternalLink,
  Pencil,
  Eye,
  EyeOff,
  MoreVertical,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import type { ProgramPaymentMode, ProgramRow } from '@/types/programs'

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function AdminProgramsPage() {
  const { showError, showSuccess } = useToastEnhanced()
  const search = useProgramsAdminStore((s) => s.search)
  const setSearch = useProgramsAdminStore((s) => s.setSearch)

  const [rows, setRows] = useState<ProgramRow[]>([])
  const [loading, setLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ProgramRow | null>(null)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMode, setPaymentMode] = useState<ProgramPaymentMode>('none')
  const [priceUsd, setPriceUsd] = useState('')

  const bootedReference = useRef(false)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('programs')
      .select(
        'id,slug,title,description,is_published,payment_mode,requires_payment_pre,price_usd,created_at'
      )
      .order('created_at', { ascending: false })

    if (error) {
      showError('No se pudieron cargar los programas.')
      setLoading(false)
      return
    }

    setRows((data ?? []) as ProgramRow[])
    setLoading(false)
  }

  useEffect(() => {
    if (bootedReference.current) return
    bootedReference.current = true
    void load()
    // deps estables a propósito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const hay = `${r.title} ${r.slug} ${r.description ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [rows, search])

  function resetModal() {
    setEditing(null)
    setTitle('')
    setSlug('')
    setDescription('')
    setPaymentMode('none')
    setPriceUsd('')
  }

  function resolvePaymentMode(row: ProgramRow): ProgramPaymentMode {
    if (row.payment_mode) return row.payment_mode
    return row.requires_payment_pre ? 'pre' : 'none'
  }

  function openCreate() {
    resetModal()
    setOpen(true)
  }

  function openEdit(p: ProgramRow) {
    setEditing(p)
    setTitle(p.title)
    setSlug(p.slug)
    setDescription(p.description ?? '')
    setPaymentMode(resolvePaymentMode(p))
    setPriceUsd(
      p.price_usd === null || p.price_usd === undefined
        ? ''
        : String(p.price_usd)
    )
    setOpen(true)
  }

  async function saveProgram() {
    const t = title.trim()
    if (!t) return showError('Poné un nombre de programa.')

    const s = (slug.trim() || slugify(t)).trim()
    if (!s) return showError('Slug inválido.')

    const priceRaw = priceUsd.trim()
    let priceValue: number | null = null
    if (priceRaw) {
      const parsed = Number(priceRaw)
      if (!Number.isFinite(parsed) || parsed < 0) {
        return showError('Precio invÃ¡lido.')
      }
      priceValue = parsed
    }

    const payload = {
      title: t,
      slug: s,
      description: description.trim() || null,
      payment_mode: paymentMode,
      requires_payment_pre: paymentMode === 'pre',
      price_usd: paymentMode === 'none' ? null : priceValue,
    }

    if (editing) {
      const { error } = await supabase
        .from('programs')
        .update(payload)
        .eq('id', editing.id)
      if (error) return showError('No se pudo actualizar el programa.')
      showSuccess('Programa actualizado.')
    } else {
      const { error } = await supabase.from('programs').insert(payload)
      if (error)
        return showError('No se pudo crear el programa (revisá slug único).')
      showSuccess('Programa creado.')
    }

    setOpen(false)
    resetModal()
    await load()
  }

  async function togglePublished(p: ProgramRow) {
    const next = !p.is_published
    const { error } = await supabase
      .from('programs')
      .update({ is_published: next })
      .eq('id', p.id)
    if (error) return showError('No se pudo cambiar el estado de publicación.')
    showSuccess(next ? 'Programa publicado.' : 'Programa despublicado.')
    await load()
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-3 text-slate-100">
        <div>
          <h1 className="text-xl font-semibold">Programas</h1>
          <p className="text-sm text-slate-400">
            Crea/edita programas, publicalos y gestioná formularios por
            programa.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md  px-3 py-2 text-sm bg-[#00CCA4]"
        >
          <Plus className="h-4 w-4" /> Nuevo programa
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(element) => setSearch(element.target.value)}
          placeholder="Buscar por nombre/slug…"
          name="program-search"
          aria-label="Buscar programas"
          autoComplete="off"
          className="w-full max-w-md rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
        />
      </div>

      <div className="rounded-lg border border-slate-800 overflow-hidden">
        <div className="grid grid-cols-12 gap-0 border-b border-slate-800 bg-slate-900/60 text-xs text-slate-400 font-medium">
          <div className="col-span-4 px-3 py-2">Programa</div>
          <div className="col-span-3 px-3 py-2">Slug</div>
          <div className="col-span-2 px-3 py-2">Pago</div>
          <div className="col-span-1 px-3 py-2">Estado</div>
          <div className="col-span-2 px-3 py-2 text-right">Acciones</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-slate-400">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-slate-400">
            No hay programas.
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-12 border-b border-slate-800 last:border-b-0 text-slate-300"
            >
              <div className="col-span-4 px-3 py-3">
                <div className="font-medium">{p.title}</div>
                {p.description ? (
                  <div className="text-xs text-slate-400 line-clamp-2">
                    {p.description}
                  </div>
                ) : null}
              </div>

              <div className="col-span-3 px-3 py-3 text-sm">{p.slug}</div>

              <div className="col-span-2 px-3 py-3 text-sm">
                {resolvePaymentMode(p) === 'pre'
                  ? 'Pago previo'
                  : resolvePaymentMode(p) === 'post'
                    ? 'Pago posterior'
                    : 'Sin pago'}
              </div>

              <div className="col-span-2 px-3 py-3 text-sm">
                {p.is_published ? 'Publicado' : 'Oculto'}
              </div>
              <div className="col-span-1 flex justify-center  items-center ">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Abrir acciones">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-slate-900 border border-slate-800 text-slate-100"
                >
                    {/* Gestionar */}
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/plataforma/admin/programas/${p.id}`}
                      className="flex items-center gap-2 text-slate-300"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Gestionar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />

                    {/* Editar */}
                    <DropdownMenuItem
                      onClick={() => openEdit(p)}
                      className="flex items-center gap-2 text-slate-300"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Publicar / Ocultar */}
                    <DropdownMenuItem
                      onClick={() => void togglePublished(p)}
                      className="flex items-center gap-2 text-slate-300"
                    >
                      {p.is_published ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      {p.is_published ? 'Ocultar' : 'Publicar'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal simple (sin shadcn para que sea copy/paste) */}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 p-4">
          <div className="w-full max-w-xl rounded-lg bg-slate-900 border border-slate-800 shadow text-slate-100">
            <div className="p-4 border-b">
              <div className="text-lg font-semibold">
                {editing ? 'Editar programa' : 'Nuevo programa'}
              </div>
              <div className="text-sm text-slate-200">
                Definí si requiere pago previo y las instrucciones (si aplica).
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nombre</label>
                <input
                  value={title}
                  onChange={(element) => {
                    setTitle(element.target.value)
                    if (!editing) setSlug(slugify(element.target.value))
                  }}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Slug</label>
                <input
                  value={slug}
                  onChange={(element) => setSlug(element.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
                <div className="text-xs text-slate-200">
                  Ej: smart-projects, project-academy
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Descripción (breve)
                </label>
                <textarea
                  value={description}
                  onChange={(element) => setDescription(element.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm min-h-[90px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Modo de pago</label>
                <select
                  value={paymentMode}
                  onChange={(element) =>
                    setPaymentMode(element.target.value as ProgramPaymentMode)
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm bg-slate-900 text-slate-100"
                >
                  <option value="none">Sin pago</option>
                  <option value="pre">Pago previo</option>
                  <option value="post">Pago posterior</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Precio (USD)</label>
                <input
                  value={priceUsd}
                  onChange={(element) => setPriceUsd(element.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Ej: 49.99"
                  inputMode="decimal"
                  disabled={paymentMode === 'none'}
                />
                <div className="text-xs text-slate-200">
                  Dejalo vacÃ­o si no aplica.
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setOpen(false)
                  resetModal()
                }}
                className="rounded-md border px-3 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => void saveProgram()}
                className="rounded-md border px-3 py-2 text-sm font-medium"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
