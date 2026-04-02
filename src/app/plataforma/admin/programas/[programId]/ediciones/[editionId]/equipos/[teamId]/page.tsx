// src/app/plataforma/admin/programas/%5BprogramId%5D/ediciones/%5BeditionId%5D/equipos/%5BteamId%5D/page.tsx
'use client'

import { useEffect, useState } from 'react'
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import type {
  ProgramEditionMilestone,
  ProgramEditionTeam,
} from '@/types/program-editions'
import type { EditionRow, ProgramRowBase } from '@/types/programs'

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toDateOnlyOrNull(value: string): string | null {
  const v = value.trim()
  if (!v) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  return v
}

function formatDateRange(startsAt: string | null, endsAt: string | null) {
  const start = startsAt ?? '--'
  const end = endsAt ?? '--'
  return `${start} -> ${end}`
}

export default function AdminTeamDetailPage() {
  const params = useParams<{
    programId: string
    editionId: string
    teamId: string
  }>()
  const { showError, showSuccess } = useToastEnhanced()

  const programId = params.programId
  const editionId = params.editionId
  const teamId = params.teamId

  const [loading, setLoading] = useState(true)
  const [savingTeam, setSavingTeam] = useState(false)

  const [program, setProgram] = useState<ProgramRowBase | null>(null)
  const [edition, setEdition] = useState<EditionRow | null>(null)
  const [team, setTeam] = useState<ProgramEditionTeam | null>(null)
  const [milestones, setMilestones] = useState<ProgramEditionMilestone[]>([])

  const [teamName, setTeamName] = useState('')
  const [teamDriveUrl, setTeamDriveUrl] = useState('')
  const [teamClassroomUrl, setTeamClassroomUrl] = useState('')
  const [teamSlackUrl, setTeamSlackUrl] = useState('')

  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] =
    useState<ProgramEditionMilestone | null>(null)
  const [milestoneToDelete, setMilestoneToDelete] =
    useState<ProgramEditionMilestone | null>(null)
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneMeetUrl, setMilestoneMeetUrl] = useState('')
  const [milestoneDriveUrl, setMilestoneDriveUrl] = useState('')
  const [milestoneStartsAt, setMilestoneStartsAt] = useState('')
  const [milestonePosition, setMilestonePosition] = useState('')

  useEffect(() => {
    if (!programId || !editionId || !teamId) return
    void loadAll()
  }, [programId, editionId, teamId])

  async function loadAll() {
    setLoading(true)

    const [programResponse, editionResponse, teamResponse, milestonesResponse] =
      await Promise.all([
        supabase
          .from('programs')
          .select('id, slug, title, description')
          .eq('id', programId)
          .maybeSingle(),
        supabase
          .from('program_editions')
          .select(
            'id, program_id, edition_name, starts_at, ends_at, is_open, created_at, updated_at'
          )
          .eq('id', editionId)
          .maybeSingle(),
        supabase
          .from('program_edition_teams')
          .select(
            'id, edition_id, name, drive_url, classroom_url, slack_url, created_at, updated_at'
          )
          .eq('id', teamId)
          .eq('edition_id', editionId)
          .maybeSingle(),
        supabase
          .from('program_edition_milestones')
          .select(
            'id, edition_id, team_id, title, meet_url, drive_url, starts_at, position, created_at, updated_at'
          )
          .eq('edition_id', editionId)
          .eq('team_id', teamId)
          .order('position', { ascending: true, nullsFirst: false })
          .order('starts_at', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: true }),
      ])

    if (programResponse.error || !programResponse.data) {
      showError('No se pudo cargar el programa.')
    } else {
      setProgram(programResponse.data as ProgramRowBase)
    }

    if (editionResponse.error || !editionResponse.data) {
      showError('No se pudo cargar la edicion.')
    } else {
      setEdition(editionResponse.data as EditionRow)
    }

    if (teamResponse.error || !teamResponse.data) {
      showError('No se pudo cargar el equipo.')
    } else {
      const row = teamResponse.data as ProgramEditionTeam
      setTeam(row)
      setTeamName(row.name)
      setTeamDriveUrl(row.drive_url ?? '')
      setTeamClassroomUrl(row.classroom_url ?? '')
      setTeamSlackUrl(row.slack_url ?? '')
    }

    if (milestonesResponse.error) {
      showError('No se pudieron cargar los hitos.')
      setMilestones([])
    } else {
      setMilestones(
        (milestonesResponse.data ?? []) as ProgramEditionMilestone[]
      )
    }

    setLoading(false)
  }

  async function saveTeam() {
    if (!team) return

    const name = teamName.trim()
    if (!name) return showError('Pone un nombre de equipo.')

    setSavingTeam(true)

    const response = await supabase
      .from('program_edition_teams')
      .update({
        name,
        drive_url: teamDriveUrl.trim() || null,
        classroom_url: teamClassroomUrl.trim() || null,
        slack_url: teamSlackUrl.trim() || null,
      })
      .eq('id', team.id)
      .select('*')
      .maybeSingle()

    setSavingTeam(false)

    if (response.error || !response.data) {
      showError(
        `No se pudo guardar el equipo. ${safeString(response.error?.message)}`
      )
      return
    }

    const updated = response.data as ProgramEditionTeam
    setTeam(updated)
    setTeamName(updated.name)
    setTeamDriveUrl(updated.drive_url ?? '')
    setTeamClassroomUrl(updated.classroom_url ?? '')
    setTeamSlackUrl(updated.slack_url ?? '')
    showSuccess('Equipo actualizado.')
  }

  function openMilestoneModal(milestone?: ProgramEditionMilestone) {
    if (milestone) {
      setEditingMilestone(milestone)
      setMilestoneTitle(milestone.title)
      setMilestoneMeetUrl(milestone.meet_url ?? '')
      setMilestoneDriveUrl(milestone.drive_url ?? '')
      setMilestoneStartsAt(milestone.starts_at ?? '')
      setMilestonePosition(
        typeof milestone.position === 'number' ? String(milestone.position) : ''
      )
    } else {
      setEditingMilestone(null)
      setMilestoneTitle('')
      setMilestoneMeetUrl('')
      setMilestoneDriveUrl('')
      setMilestoneStartsAt('')
      setMilestonePosition('')
    }
    setMilestoneModalOpen(true)
  }

  async function saveMilestone() {
    const title = milestoneTitle.trim()
    if (!title) return showError('El titulo es obligatorio.')

    const positionRaw = milestonePosition.trim()
    const positionValue = positionRaw ? Number(positionRaw) : null
    if (positionRaw && !Number.isFinite(positionValue)) {
      return showError('Posicion invalida.')
    }

    const basePayload = {
      title,
      meet_url: milestoneMeetUrl.trim() || null,
      drive_url: milestoneDriveUrl.trim() || null,
      starts_at: toDateOnlyOrNull(milestoneStartsAt),
      position: positionValue,
    }

    const response = editingMilestone
      ? await supabase
          .from('program_edition_milestones')
          .update(basePayload)
          .eq('id', editingMilestone.id)
          .eq('team_id', teamId)
          .select('*')
          .maybeSingle()
      : await supabase
          .from('program_edition_milestones')
          .insert({
            ...basePayload,
            edition_id: editionId,
            team_id: teamId,
          })
          .select('*')
          .maybeSingle()

    if (response.error || !response.data) {
      showError(
        `No se pudo guardar el hito. ${safeString(response.error?.message)}`
      )
      return
    }

    setMilestoneModalOpen(false)
    showSuccess(editingMilestone ? 'Hito actualizado.' : 'Hito creado.')
    await loadAll()
  }

  async function deleteMilestone() {
    if (!milestoneToDelete) return

    const response = await supabase
      .from('program_edition_milestones')
      .delete()
      .eq('id', milestoneToDelete.id)
      .eq('team_id', teamId)

    if (response.error) {
      showError(
        `No se pudo eliminar el hito. ${safeString(response.error.message)}`
      )
      return
    }

    setMilestones((previous) =>
      previous.filter((milestone) => milestone.id !== milestoneToDelete.id)
    )
    setMilestoneToDelete(null)
    showSuccess('Hito eliminado.')
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
          Cargando equipo...
        </div>
      </div>
    )
  }

  if (!program || !edition || !team) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
          No se encontro el equipo.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/plataforma/admin/programas/${programId}/ediciones/${editionId}`}
            className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-slate-100 break-words">
              {program.title} / {edition.edition_name} / {team.name}
            </h1>
            <div className="text-sm text-slate-300">
              {formatDateRange(edition.starts_at, edition.ends_at)}
            </div>
          </div>
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader>
          <CardTitle>Equipo</CardTitle>
          <CardDescription className="text-slate-300">
            Actualiza nombre y enlaces principales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Drive</Label>
              <Input
                value={teamDriveUrl}
                onChange={(event) => setTeamDriveUrl(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Classroom</Label>
              <Input
                value={teamClassroomUrl}
                onChange={(event) => setTeamClassroomUrl(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Slack</Label>
            <Input
              value={teamSlackUrl}
              onChange={(event) => setTeamSlackUrl(event.target.value)}
            />
          </div>

          <div className="flex items-center justify-end">
            <Button onClick={saveTeam} disabled={savingTeam} className="gap-2">
              <Save className="h-4 w-4" />
              Guardar equipo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Hitos del equipo</CardTitle>
              <CardDescription className="text-slate-300">
                Crea hitos con enlaces de meet/drive.
              </CardDescription>
            </div>
            <Button onClick={() => openMilestoneModal()} className="gap-2">
              <Plus className="h-4 w-4" /> Nuevo hito
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {milestones.length === 0 ? (
            <div className="text-sm text-slate-300">Todavia no hay hitos.</div>
          ) : (
            milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{milestone.title}</div>
                    <div className="text-xs text-slate-300">
                      {formatDateRange(milestone.starts_at, null)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openMilestoneModal(milestone)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setMilestoneToDelete(milestone)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-slate-300">
                  Meet: {milestone.meet_url ?? '--'}
                </div>
                <div className="text-xs text-slate-300">
                  Drive: {milestone.drive_url ?? '--'}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={milestoneModalOpen} onOpenChange={setMilestoneModalOpen}>
        <DialogContent className="border border-slate-800 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle>
              {editingMilestone ? 'Editar hito' : 'Nuevo hito'}
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Define el titulo y enlaces necesarios.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input
                value={milestoneTitle}
                onChange={(event) => setMilestoneTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Meet / Videollamada</Label>
              <Input
                value={milestoneMeetUrl}
                onChange={(event) => setMilestoneMeetUrl(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Drive</Label>
              <Input
                value={milestoneDriveUrl}
                onChange={(event) => setMilestoneDriveUrl(event.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={milestoneStartsAt}
                  onChange={(event) => setMilestoneStartsAt(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Posicion</Label>
                <Input
                  value={milestonePosition}
                  onChange={(event) => setMilestonePosition(event.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="secondary"
              onClick={() => setMilestoneModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={saveMilestone}>
              {editingMilestone ? 'Guardar cambios' : 'Crear hito'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(milestoneToDelete)}
        onOpenChange={(open) => {
          if (!open) setMilestoneToDelete(null)
        }}
        title="Eliminar hito?"
        description="Se eliminara el hito del equipo."
        confirmLabel="Eliminar"
        confirmVariant="destructive"
        onConfirm={deleteMilestone}
      />

      <Separator className="bg-slate-800" />
    </div>
  )
}
