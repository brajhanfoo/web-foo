//src/app/plataforma/admin/postulaciones/components/applications-table.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import type {
  ApplicationRowForAdminTable,
  ApplicationStatus,
} from '@/app/plataforma/admin/types/applications'
import { ExternalLink, Search, ChevronDown } from 'lucide-react'
import * as XLSX from 'xlsx'

type ProgramOption = {
  id: string
  title: string
  slug: string
}

type ApplicationsAdminViewRow = {
  // 🔴 viene del RPC
  total_count?: number

  id: string
  created_at: string
  status: ApplicationStatus
  applied_role: string | null
  cv_url: string | null

  program_id: string
  program_title: string | null
  program_slug: string | null

  edition_name: string | null

  applicant_profile_id: string
  first_name: string | null
  last_name: string | null
  applicant_full_name: string | null
  whatsapp_e164: string | null
  linkedin_url: string | null
}

type DatePreset = 'all' | '7d' | '30d' | 'this_month'
type OpenMenu = null | 'date' | 'role' | 'status' | 'actions'

function statusBadgeClasses(status: ApplicationStatus): Record<string, string> {
  if (status === 'enrolled')
    return {
      className: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20',
      label: 'Matriculado',
    }
  if (status === 'approved')
    return {
      className: 'bg-sky-500/15 text-sky-300 border-sky-400/20',
      label: 'Aprobado',
    }
  if (status === 'in_review')
    return {
      className: 'bg-yellow-500/15 text-yellow-200 border-yellow-400/20',
      label: 'En revisión',
    }
  if (status === 'rejected')
    return {
      className: 'bg-red-500/15 text-red-300 border-red-400/20',
      label: 'Rechazado',
    }
  return {
    className: 'bg-white/5 text-white/70 border-white/10',
    label: 'Recibido',
  }
}

function getDateRangeFromPreset(preset: DatePreset): {
  gte?: string
  lt?: string
} {
  if (preset === 'all') return {}

  const now = new Date()

  if (preset === '7d') {
    const from = new Date(now)
    from.setDate(from.getDate() - 7)
    return { gte: from.toISOString() }
  }

  if (preset === '30d') {
    const from = new Date(now)
    from.setDate(from.getDate() - 30)
    return { gte: from.toISOString() }
  }

  // this_month
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { gte: start.toISOString(), lt: next.toISOString() }
}

function datePresetLabel(preset: DatePreset): string {
  if (preset === 'all') return 'Todas'
  if (preset === '7d') return 'Últimos 7 días'
  if (preset === '30d') return 'Últimos 30 días'
  return 'Este mes'
}

function statusLabel(status: ApplicationStatus | 'all'): string {
  if (status === 'all') return 'Todos'
  if (status === 'received') return 'Recibido'
  if (status === 'in_review') return 'En revisión'
  if (status === 'approved') return 'Aprobado'
  if (status === 'enrolled') return 'Matriculado'
  if (status === 'rejected') return 'Rechazado'
  return status
}

function mapViewRowToTableRow(
  viewRow: ApplicationsAdminViewRow
): ApplicationRowForAdminTable {
  return {
    id: viewRow.id,
    created_at: viewRow.created_at,
    status: viewRow.status,
    applied_role: viewRow.applied_role,
    cv_url: viewRow.cv_url,
    programs: {
      title: viewRow.program_title ?? null,
      slug: viewRow.program_slug ?? null,
    },
    editions: {
      edition_name: viewRow.edition_name ?? null,
    },
    applicant: {
      first_name: viewRow.first_name ?? null,
      last_name: viewRow.last_name ?? null,
      whatsapp_e164: viewRow.whatsapp_e164 ?? null,
      linkedin_url: viewRow.linkedin_url ?? null,
    },
  } as ApplicationRowForAdminTable
}

export function ApplicationsTable() {
  const { showError, showSuccess } = useToastEnhanced()

  // data
  const [rows, setRows] = useState<ApplicationRowForAdminTable[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // programs dropdown
  const [programs, setPrograms] = useState<ProgramOption[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string>('all')

  // pagination
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [totalCount, setTotalCount] = useState<number>(0)

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize]
  )

  // top search (queda)
  const [searchText, setSearchText] = useState<string>('')

  // column filters (dropdowns in headers)
  const [datePreset, setDatePreset] = useState<DatePreset>('all')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>(
    'all'
  )

  // rol: “contains”
  const [roleFilter, setRoleFilter] = useState<string>('')

  // dropdown open state
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const menuWrapReference = useRef<HTMLDivElement | null>(null)

  const hasLoadedProgramsReference = useRef(false)

  // close dropdown on outside click
  useEffect(() => {
    function onDocumentMouseDown(event: MouseEvent) {
      const target = event.target as Node | null
      if (!target) return
      if (!menuWrapReference.current) return
      if (menuWrapReference.current.contains(target)) return
      setOpenMenu(null)
    }

    document.addEventListener('mousedown', onDocumentMouseDown)
    return () => document.removeEventListener('mousedown', onDocumentMouseDown)
  }, [])

  // load programs once
  useEffect(() => {
    if (hasLoadedProgramsReference.current) return
    hasLoadedProgramsReference.current = true

    async function loadPrograms() {
      const { data, error } = await supabase
        .from('programs')
        .select('id, title, slug')
        .order('title', { ascending: true })

      if (error) {
        showError('No se pudo cargar programas', error.message)
        setPrograms([])
        return
      }

      setPrograms((data ?? []) as ProgramOption[])
    }

    void loadPrograms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [
    selectedProgramId,
    pageSize,
    searchText,
    datePreset,
    statusFilter,
    roleFilter,
  ])

  // load applications (RPC server-side filters + pagination)
  useEffect(() => {
    let cancelled = false

    async function loadApplications() {
      setIsLoading(true)

      const from = (page - 1) * pageSize
      const dr = getDateRangeFromPreset(datePreset)

      const { data, error } = await supabase.rpc(
        'get_admin_applications_page',
        {
          _program_id: selectedProgramId === 'all' ? null : selectedProgramId,
          _status: statusFilter === 'all' ? null : statusFilter,
          _date_gte: dr.gte ?? null,
          _date_lt: dr.lt ?? null,
          _role_contains: roleFilter.trim() ? roleFilter.trim() : null,
          _search: searchText.trim() ? searchText.trim() : null,
          _limit: pageSize,
          _offset: from,
        }
      )

      if (cancelled) return

      if (error) {
        showError('No se pudo cargar postulaciones', error.message)
        setRows([])
        setTotalCount(0)
        setIsLoading(false)
        return
      }

      const pageRows = (data ?? []) as ApplicationsAdminViewRow[]
      const total = pageRows[0]?.total_count ?? 0

      setRows(pageRows.map(mapViewRowToTableRow))
      setTotalCount(Number(total))
      setIsLoading(false)
    }

    void loadApplications()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    pageSize,
    selectedProgramId,
    searchText,
    datePreset,
    statusFilter,
    roleFilter,
  ])

  const visibleRows = rows

  // role suggestions: ahora solo “página actual” (porque el RPC ya paginó)
  const roleSuggestions = useMemo(() => {
    const set = new Set<string>()
    for (const r of visibleRows) {
      const role = (r.applied_role ?? '').trim()
      if (role) set.add(role)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [visibleRows])

  function exportRowsToExcel(
    exportData: ApplicationRowForAdminTable[],
    fileName: string
  ) {
    const sheetRows = exportData.map((row) => {
      const fullName =
        `${row.applicant?.first_name ?? ''} ${row.applicant?.last_name ?? ''}`.trim() ||
        '—'

      return {
        Fecha: new Date(row.created_at).toLocaleString('es-EC'),
        Candidato: fullName,
        WhatsApp: row.applicant?.whatsapp_e164 ?? '',
        Programa: row.programs?.title ?? '',
        Edicion: row.editions?.edition_name ?? '',
        Rol: row.applied_role ?? '',
        Estado: row.status ?? '',
        LinkedIn: row.applicant?.linkedin_url ?? '',
        CV: row.cv_url ?? '',
      }
    })

    const ws = XLSX.utils.json_to_sheet(sheetRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Postulaciones')
    XLSX.writeFile(wb, fileName)
  }

  async function exportCurrentPage() {
    exportRowsToExcel(visibleRows, `postulaciones_pagina_${page}.xlsx`)
    showSuccess('Exportado', 'Se descargó el Excel de la página actual.')
  }

  // ✅ con RPC paginado, “exportar todo filtrado” idealmente sería OTRO RPC (stream/batch).
  // Acá dejamos el comportamiento simple: exporta solo la página actual + avisamos.
  async function exportAllFiltered() {
    showError(
      'Exportación completa pendiente',
      'Con RPC paginado, para exportar TODO filtrado conviene un RPC dedicado. Por ahora exportá la página actual.'
    )
  }

  function toggleMenu(menu: OpenMenu) {
    setOpenMenu((previous) => (previous === menu ? null : menu))
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      {/* Top bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">
            Gestión de Postulaciones
          </h1>
          <p className="text-xs text-white/50">
            Total: <span className="text-white/70">{totalCount}</span>
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Program dropdown */}
          <select
            value={selectedProgramId}
            onChange={(element) => setSelectedProgramId(element.target.value)}
            className="w-full md:w-72 rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-white outline-none focus:border-emerald-400/60"
          >
            <option value="all">Todos los programas</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-white/40" />
            <input
              value={searchText}
              onChange={(element) => setSearchText(element.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-xl bg-black/30 border border-white/10 pl-9 pr-3 py-3 text-white outline-none focus:border-emerald-400/60 placeholder:text-white/40"
            />
          </div>

          {/* Actions dropdown (Export) */}
          <select
            defaultValue=""
            onChange={async (element) => {
              const v = element.target.value
              element.target.value = ''
              if (v === 'export_page') await exportCurrentPage()
              if (v === 'export_all') await exportAllFiltered()
            }}
            className="w-full md:w-56 rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-white outline-none focus:border-emerald-400/60"
          >
            <option value="" disabled>
              Acciones…
            </option>
            <option value="export_page">Exportar página (Excel)</option>
            <option value="export_all">Exportar todo filtrado (Excel)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        {/* Header row with dropdown filters on Fecha/Rol/Estado */}
        <div
          ref={menuWrapReference}
          className="relative grid grid-cols-12 gap-0 bg-black/30 px-4 py-3 text-xs text-white/50"
        >
          {/* Fecha (dropdown) */}
          <div className="col-span-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleMenu('date')}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/5 text-white/70"
              title="Filtrar por fecha"
            >
              Fecha
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {datePreset !== 'all' ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                {datePresetLabel(datePreset)}
              </span>
            ) : null}

            {openMenu === 'date' ? (
              <div className="absolute left-4 top-11 z-20 w-56 rounded-xl border border-white/10 bg-black p-2 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setDatePreset('all')
                    setOpenMenu(null)
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5"
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDatePreset('7d')
                    setOpenMenu(null)
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5"
                >
                  Últimos 7 días
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDatePreset('30d')
                    setOpenMenu(null)
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5"
                >
                  Últimos 30 días
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDatePreset('this_month')
                    setOpenMenu(null)
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5"
                >
                  Este mes
                </button>
              </div>
            ) : null}
          </div>

          <div className="col-span-3">Candidato</div>
          <div className="col-span-2">Programa</div>

          {/* Rol (dropdown) */}
          <div className="col-span-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleMenu('role')}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/5 text-white/70"
              title="Filtrar por rol"
            >
              Rol
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {roleFilter.trim() ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                {roleFilter.trim()}
              </span>
            ) : null}

            {openMenu === 'role' ? (
              <div className="absolute left-[52%] top-11 z-20 w-72 -translate-x-1/2 rounded-xl border border-white/10 bg-black p-3 shadow-xl">
                <div className="text-xs text-white/50">Contiene</div>
                <input
                  value={roleFilter}
                  onChange={(element) => setRoleFilter(element.target.value)}
                  placeholder="Ej: Frontend, Designer…"
                  className="mt-2 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/60 placeholder:text-white/40"
                />

                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setRoleFilter('')
                      setOpenMenu(null)
                    }}
                    className="rounded-xl bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
                  >
                    Limpiar
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenMenu(null)}
                    className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-500/20"
                  >
                    Aplicar
                  </button>
                </div>

                {roleSuggestions.length > 0 ? (
                  <div className="mt-3">
                    <div className="text-xs text-white/50">
                      Sugerencias (página actual)
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {roleSuggestions.slice(0, 8).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setRoleFilter(role)}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="col-span-1">LinkedIn</div>

          {/* Estado (dropdown) */}
          <div className="col-span-1 flex items-center justify-start gap-2">
            <button
              type="button"
              onClick={() => toggleMenu('status')}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/5 text-white/70"
              title="Filtrar por estado"
            >
              Estado
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {statusFilter !== 'all' ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                {statusLabel(statusFilter)}
              </span>
            ) : null}

            {openMenu === 'status' ? (
              <div className="absolute right-24 top-11 z-20 w-56 rounded-xl border border-white/10 bg-black p-2 shadow-xl">
                {(
                  [
                    'all',
                    'received',
                    'in_review',
                    'approved',
                    'enrolled',
                    'rejected',
                  ] as const
                ).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setStatusFilter(v)
                      setOpenMenu(null)
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5"
                  >
                    {statusLabel(v)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="col-span-1 text-right">Acciones</div>
        </div>

        {isLoading ? (
          <div className="px-4 py-6 text-sm text-white/70">Cargando...</div>
        ) : visibleRows.length === 0 ? (
          <div className="px-4 py-10 text-sm text-white/60">
            No hay postulaciones todavía.
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {visibleRows.map((row) => {
              const fullName =
                `${row.applicant?.first_name ?? ''} ${row.applicant?.last_name ?? ''}`.trim() ||
                '—'

              const programTitle = row.programs?.title ?? '—'
              const createdAt = new Date(row.created_at).toLocaleDateString(
                'es-EC'
              )
              const linkedinUrl = row.applicant?.linkedin_url

              return (
                <div
                  key={row.id}
                  className="grid grid-cols-12 px-4 py-3 text-sm text-white/80"
                >
                  <div className="col-span-2">{createdAt}</div>

                  <div className="col-span-3">
                    <div className="font-medium text-white">{fullName}</div>
                    <div className="text-xs text-white/50">
                      {row.applicant?.whatsapp_e164 ?? '—'}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="text-white">{programTitle}</div>
                    <div className="text-xs text-white/50">
                      {row.editions?.edition_name ?? ''}
                    </div>
                  </div>

                  <div className="col-span-2">{row.applied_role ?? '—'}</div>

                  <div className="col-span-1">
                    {linkedinUrl ? (
                      <Link
                        href={linkedinUrl}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                  </div>

                  <div className="col-span-1">
                    <span
                      className={[
                        'inline-flex items-center rounded-full border px-2 py-1 text-[11px]',
                        statusBadgeClasses(row.status).className,
                      ].join(' ')}
                    >
                      {statusBadgeClasses(row.status).label}
                    </span>
                  </div>

                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      className="rounded-xl bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-500/20"
                      title="ver detalles de la postulación"
                    >
                      <Link href={`/plataforma/admin/postulaciones/${row.id}`}>
                        Ver ficha
                      </Link>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-xs text-white/50">
          Página <span className="text-white/70">{page}</span> de{' '}
          <span className="text-white/70">{totalPages}</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(element) => setPageSize(Number(element.target.value))}
            className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/60"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}
