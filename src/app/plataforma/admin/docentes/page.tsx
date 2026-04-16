'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { UserPlus } from 'lucide-react'

import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DocentesTable } from './components/docentes-table'
import {
  DocentesToolbar,
  type DocenteStatusFilter,
} from './components/docentes-toolbar'
import type {
  AssignmentRow,
  DocenteRow,
  ProfessionalArea,
  TeamRef,
} from './components/types'

type CreateDocenteForm = {
  email: string
  first_name: string
  last_name: string
  professional_area_id: string
  temporary_password: string
}

const DEFAULT_CREATE_FORM: CreateDocenteForm = {
  email: '',
  first_name: '',
  last_name: '',
  professional_area_id: 'none',
  temporary_password: '',
}
const PRIMARY_CTA_CLASS = 'bg-[#00CCA4] text-slate-950 hover:bg-[#00b997]'

function safeText(value: string | null | undefined): string {
  return (value ?? '').trim()
}

export default function AdminDocentesPage() {
  const { showError, showSuccess, showWarning } = useToastEnhanced()

  const [loading, setLoading] = useState(true)
  const [docentes, setDocentes] = useState<DocenteRow[]>([])
  const [areas, setAreas] = useState<ProfessionalArea[]>([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DocenteStatusFilter>('all')
  const [areaFilter, setAreaFilter] = useState('all')

  const [createOpen, setCreateOpen] = useState(false)
  const [createBusy, setCreateBusy] = useState(false)
  const [createForm, setCreateForm] =
    useState<CreateDocenteForm>(DEFAULT_CREATE_FORM)

  const [busyById, setBusyById] = useState<Record<string, boolean>>({})
  const [toggleCandidate, setToggleCandidate] = useState<DocenteRow | null>(
    null
  )

  const didLoadRef = useRef(false)

  async function loadData() {
    setLoading(true)
    const response = await fetch('/api/plataforma/admin/docentes', {
      cache: 'no-store',
    })
    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      docentes?: DocenteRow[]
      professional_areas?: ProfessionalArea[]
      assignments?: AssignmentRow[]
      teams?: TeamRef[]
      message?: string
    } | null

    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo cargar docentes.')
      setDocentes([])
      setAreas([])
      setLoading(false)
      return
    }

    setDocentes(payload.docentes ?? [])
    setAreas(payload.professional_areas ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (didLoadRef.current) return
    didLoadRef.current = true
    void loadData()
  }, [])

  function setRowBusy(docenteId: string, value: boolean) {
    setBusyById((previous) => ({ ...previous, [docenteId]: value }))
  }

  async function createDocente() {
    const email = safeText(createForm.email).toLowerCase()
    const firstName = safeText(createForm.first_name)
    const lastName = safeText(createForm.last_name)

    if (!email || !firstName || !lastName) {
      showWarning('Completa email, nombres y apellidos.')
      return
    }

    setCreateBusy(true)
    const response = await fetch('/api/plataforma/admin/docentes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        professional_area_id:
          createForm.professional_area_id === 'none'
            ? null
            : createForm.professional_area_id,
        temporary_password:
          safeText(createForm.temporary_password) || undefined,
      }),
    })

    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      message?: string
      temporary_password?: string
    } | null

    setCreateBusy(false)

    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo crear docente.')
      return
    }

    showSuccess('Docente creado.')
    if (payload.temporary_password) {
      showWarning(
        `Contraseña temporal: ${payload.temporary_password}`,
        'Compártela por un canal seguro.'
      )
    }

    setCreateForm(DEFAULT_CREATE_FORM)
    setCreateOpen(false)
    await loadData()
  }

  async function resetPassword(docente: DocenteRow) {
    setRowBusy(docente.id, true)
    const response = await fetch(
      `/api/plataforma/admin/docentes/${docente.id}/reset-password`,
      {
        method: 'POST',
      }
    )

    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      temporary_password?: string
      message?: string
    } | null

    setRowBusy(docente.id, false)

    if (!response.ok || !payload?.ok) {
      showError(payload?.message ?? 'No se pudo resetear contraseña.')
      return
    }

    showSuccess('Contraseña temporal regenerada.')
    if (payload.temporary_password) {
      showWarning(
        `Nueva temporal: ${payload.temporary_password}`,
        'Compártela por un canal seguro.'
      )
    }

    await loadData()
  }

  async function toggleDocenteActive(docente: DocenteRow) {
    setRowBusy(docente.id, true)

    const response = await fetch(
      `/api/plataforma/admin/docentes/${docente.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !docente.is_active,
        }),
      }
    )

    const payload = (await response.json().catch(() => null)) as {
      ok: boolean
      message?: string
    } | null

    setRowBusy(docente.id, false)

    if (!response.ok || !payload?.ok) {
      showError(
        payload?.message ?? 'No se pudo actualizar el estado del docente.'
      )
      return
    }

    showSuccess(
      docente.is_active ? 'Docente desactivado.' : 'Docente reactivado.'
    )
    await loadData()
  }

  const areaNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const area of areas) {
      map.set(area.id, area.name)
    }
    return map
  }, [areas])

  const filteredDocentes = useMemo(() => {
    const q = safeText(search).toLowerCase()

    return docentes.filter((docente) => {
      if (statusFilter === 'active' && !docente.is_active) return false
      if (statusFilter === 'inactive' && docente.is_active) return false

      if (areaFilter === 'none' && docente.professional_area_id) return false
      if (
        areaFilter !== 'all' &&
        areaFilter !== 'none' &&
        docente.professional_area_id !== areaFilter
      ) {
        return false
      }

      if (!q) return true
      const haystack = `${safeText(docente.first_name)} ${safeText(
        docente.last_name
      )} ${safeText(docente.email)}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [docentes, search, statusFilter, areaFilter])

  return (
    <div className="space-y-6">
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Docentes</CardTitle>
            <CardDescription className="text-slate-300">
              Administra el staff docente y entra al detalle para gestionar
              asignaciones por equipo.
            </CardDescription>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className={PRIMARY_CTA_CLASS}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo docente
          </Button>
        </CardHeader>
      </Card>

      <DocentesToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        areaFilter={areaFilter}
        onAreaFilterChange={setAreaFilter}
        areas={areas}
        totalCount={docentes.length}
        filteredCount={filteredDocentes.length}
      />

      <DocentesTable
        rows={filteredDocentes}
        loading={loading}
        busyIds={busyById}
        areaNameById={areaNameById}
        onResetPassword={(docente) => void resetPassword(docente)}
        onToggleActive={(docente) => setToggleCandidate(docente)}
      />

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) {
            setCreateForm(DEFAULT_CREATE_FORM)
          }
        }}
      >
        <DialogContent className="border border-slate-800 bg-[#0F1117] text-slate-100 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo docente</DialogTitle>
            <DialogDescription className="text-slate-400">
              Crea la cuenta docente y define su información base.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Email</Label>
              <Input
                value={createForm.email}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    email: event.target.value,
                  }))
                }
                placeholder="docente@dominio.com"
                className="border-slate-800 bg-slate-950"
              />
            </div>

            <div className="space-y-2">
              <Label>Nombres</Label>
              <Input
                value={createForm.first_name}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    first_name: event.target.value,
                  }))
                }
                className="border-slate-800 bg-slate-950"
              />
            </div>

            <div className="space-y-2">
              <Label>Apellidos</Label>
              <Input
                value={createForm.last_name}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    last_name: event.target.value,
                  }))
                }
                className="border-slate-800 bg-slate-950"
              />
            </div>

            <div className="space-y-2">
              <Label>Área profesional</Label>
              <Select
                value={createForm.professional_area_id}
                onValueChange={(value) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    professional_area_id: value,
                  }))
                }
              >
                <SelectTrigger className="border-slate-800 bg-slate-950">
                  <SelectValue placeholder="Selecciona área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin área</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contraseña temporal (opcional)</Label>
              <Input
                value={createForm.temporary_password}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    temporary_password: event.target.value,
                  }))
                }
                placeholder="Si no completas, se genera automáticamente"
                className="border-slate-800 bg-slate-950"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createBusy}
              className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              disabled={createBusy}
              onClick={() => void createDocente()}
              className={PRIMARY_CTA_CLASS}
            >
              Crear docente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(toggleCandidate)}
        onOpenChange={(open) => {
          if (!open) setToggleCandidate(null)
        }}
        title={
          toggleCandidate?.is_active
            ? '¿Desactivar docente?'
            : '¿Reactivar docente?'
        }
        description={
          toggleCandidate?.is_active
            ? 'El docente no podrá ingresar hasta que lo reactives.'
            : 'El docente recuperará el acceso a la plataforma.'
        }
        confirmLabel={toggleCandidate?.is_active ? 'Desactivar' : 'Reactivar'}
        confirmVariant={toggleCandidate?.is_active ? 'destructive' : 'default'}
        confirmDisabled={!toggleCandidate}
        onConfirm={() => {
          if (!toggleCandidate) return
          void toggleDocenteActive(toggleCandidate)
          setToggleCandidate(null)
        }}
      />
    </div>
  )
}
