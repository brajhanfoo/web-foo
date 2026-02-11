// src/app/plataforma/admin/programas/%5BprogramId%5D/ediciones/%5BeditionId%5D/page.tsx
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

import { ArrowLeft, ExternalLink, Plus, Save, Trash2 } from 'lucide-react'
import { EditionFormBuilder } from './components/edition-form-builder'
import type {
  ApplicationParticipantRow,
  ProgramEditionMilestone,
  ProgramEditionTeam,
  ProgramParticipantRole,
} from '@/types/program-editions'
import type { EditionRow, ProgramRowBase } from '@/types/programs'

type ParticipantRow = ApplicationParticipantRow & {
  created_at: string
  applicant_profile: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  } | null
}
const ROLE_OPTIONS: { value: ProgramParticipantRole; label: string }[] = [
  { value: 'product_designer', label: 'Product Designer' },
  { value: 'ux_ui_designer', label: 'UX/UI Designer' },
  { value: 'frontend_developer', label: 'Front End Developer' },
  { value: 'backend_developer', label: 'Back End Developer' },
  { value: 'qa_tester', label: 'QA Tester' },
  { value: 'product_manager', label: 'Product Manager' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'data_analyst', label: 'Data Analyst' },
  { value: 'no_code', label: 'No-Code Developer' },
]

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
  const start = startsAt ?? '—'
  const end = endsAt ?? '—'
  return `${start} ? ${end}`
}

function fullName(participant: ParticipantRow): string {
  const first = participant.applicant_profile?.first_name ?? ''
  const last = participant.applicant_profile?.last_name ?? ''
  const joined = `${first} ${last}`.trim()
  return joined || 'Sin nombre'
}

export default function AdminEditionDetailPage() {
  const params = useParams<{ programId: string; editionId: string }>()
  const { showError, showSuccess } = useToastEnhanced()

  const programId = params.programId
  const editionId = params.editionId

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [program, setProgram] = useState<ProgramRowBase | null>(null)
  const [edition, setEdition] = useState<EditionRow | null>(null)
  const [teams, setTeams] = useState<ProgramEditionTeam[]>([])
  const [milestones, setMilestones] = useState<ProgramEditionMilestone[]>([])
  const [participants, setParticipants] = useState<ParticipantRow[]>([])
  const [hasActiveForm, setHasActiveForm] = useState(false)

  // Edition fields
  const [editionName, setEditionName] = useState('')
  const [editionStartsAt, setEditionStartsAt] = useState('')
  const [editionEndsAt, setEditionEndsAt] = useState('')
  const [editionIsOpen, setEditionIsOpen] = useState(false)

  // Teams
  const [newTeamName, setNewTeamName] = useState('')
  const [teamSavingId, setTeamSavingId] = useState<string | null>(null)
  const [teamToDelete, setTeamToDelete] = useState<ProgramEditionTeam | null>(
    null
  )

  // Milestones
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] =
    useState<ProgramEditionMilestone | null>(null)
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneMeetUrl, setMilestoneMeetUrl] = useState('')
  const [milestoneDriveUrl, setMilestoneDriveUrl] = useState('')
  const [milestoneStartsAt, setMilestoneStartsAt] = useState('')
  const [milestonePosition, setMilestonePosition] = useState('')

  // Participants
  const [participantSavingId, setParticipantSavingId] = useState<string | null>(
    null
  )
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>(
    {}
  )
  const [uploading, setUploading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!programId || !editionId) return
    void loadAll()
  }, [programId, editionId])

  async function loadAll() {
    setLoading(true)

    const [
      programResponse,
      editionResponse,
      teamsResponse,
      milestonesResponse,
    ] = await Promise.all([
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
        .eq('edition_id', editionId)
        .order('name', { ascending: true }),
      supabase
        .from('program_edition_milestones')
        .select(
          'id, edition_id, title, meet_url, drive_url, starts_at, position, created_at, updated_at'
        )
        .eq('edition_id', editionId)
        .order('position', { ascending: true })
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
      const ed = editionResponse.data as EditionRow
      setEdition(ed)
      setEditionName(ed.edition_name)
      setEditionStartsAt(ed.starts_at ?? '')
      setEditionEndsAt(ed.ends_at ?? '')
      setEditionIsOpen(Boolean(ed.is_open))
    }

    setTeams((teamsResponse.data ?? []) as ProgramEditionTeam[])
    setMilestones((milestonesResponse.data ?? []) as ProgramEditionMilestone[])

    const participantsResponse = await supabase
      .from('applications')
      .select(
        `
        id,
        applicant_profile_id,
        status,
        applied_role,
        assigned_role,
        team_id,
        certificate_object_path,
        feedback_object_path,
        feedback_notes,
        created_at,
        applicant_profile:profiles(id, first_name, last_name, email)
      `
      )
      .eq('edition_id', editionId)
      .order('created_at', { ascending: false })
      .returns<ParticipantRow[]>()

    if (participantsResponse.error) {
      showError('No se pudieron cargar participantes.')
      setParticipants([])
    } else {
      const rows = participantsResponse.data ?? []
      setParticipants(rows)
      const draftNotes: Record<string, string> = {}
      rows.forEach((row) => {
        if (row.feedback_notes) draftNotes[row.id] = row.feedback_notes
      })
      setFeedbackDrafts(draftNotes)
    }

    const activeFormResponse = await supabase
      .from('application_forms')
      .select('id')
      .eq('edition_id', editionId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    setHasActiveForm(Boolean(activeFormResponse.data?.id))

    setLoading(false)
  }
  async function saveEdition() {
    if (!edition) return

    const name = editionName.trim()
    if (!name) return showError('El nombre de la edicion es obligatorio.')

    const startsAt = toDateOnlyOrNull(editionStartsAt)
    const endsAt = toDateOnlyOrNull(editionEndsAt)

    if (editionStartsAt && !startsAt) {
      return showError('La fecha de inicio no es valida.')
    }
    if (editionEndsAt && !endsAt) {
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

    if (editionIsOpen && !hasActiveForm) {
      return showError('Crea un formulario activo antes de abrir la edicion.')
    }

    setSaving(true)

    const response = await supabase
      .from('program_editions')
      .update({
        edition_name: name,
        starts_at: startsAt,
        ends_at: endsAt,
        is_open: editionIsOpen,
      })
      .eq('id', edition.id)

    setSaving(false)

    if (response.error) {
      showError(`No se pudo guardar. ${safeString(response.error.message)}`)
      return
    }

    showSuccess('Edicion guardada.')
    await loadAll()
  }

  async function createTeam() {
    const name = newTeamName.trim()
    if (!name) return showError('Pone un nombre de equipo.')

    const response = await supabase
      .from('program_edition_teams')
      .insert({
        edition_id: editionId,
        name,
      })
      .select('*')
      .maybeSingle()

    if (response.error || !response.data) {
      showError(
        `No se pudo crear el equipo. ${safeString(response.error?.message)}`
      )
      return
    }

    setTeams((previous) => [response.data as ProgramEditionTeam, ...previous])
    setNewTeamName('')
  }

  async function saveTeam(team: ProgramEditionTeam) {
    setTeamSavingId(team.id)
    const response = await supabase
      .from('program_edition_teams')
      .update({
        name: team.name,
        drive_url: team.drive_url,
        classroom_url: team.classroom_url,
        slack_url: team.slack_url,
      })
      .eq('id', team.id)

    setTeamSavingId(null)

    if (response.error) {
      showError(
        `No se pudo guardar el equipo. ${safeString(response.error.message)}`
      )
      return
    }

    showSuccess('Equipo actualizado.')
  }

  async function deleteTeam() {
    if (!teamToDelete) return

    const response = await supabase
      .from('program_edition_teams')
      .delete()
      .eq('id', teamToDelete.id)

    if (response.error) {
      showError(
        `No se pudo eliminar el equipo. ${safeString(response.error.message)}`
      )
      return
    }

    setTeams((previous) =>
      previous.filter((team) => team.id !== teamToDelete.id)
    )
    setTeamToDelete(null)
    showSuccess('Equipo eliminado.')
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

    const payload = {
      edition_id: editionId,
      title,
      meet_url: milestoneMeetUrl.trim() || null,
      drive_url: milestoneDriveUrl.trim() || null,
      starts_at: toDateOnlyOrNull(milestoneStartsAt),
      position: positionValue,
    }

    const response = editingMilestone
      ? await supabase
          .from('program_edition_milestones')
          .update(payload)
          .eq('id', editingMilestone.id)
          .select('*')
          .maybeSingle()
      : await supabase
          .from('program_edition_milestones')
          .insert(payload)
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

  async function updateParticipant(
    participantId: string,
    patch: Partial<ParticipantRow>
  ) {
    setParticipantSavingId(participantId)

    const response = await supabase
      .from('applications')
      .update(patch)
      .eq('id', participantId)

    setParticipantSavingId(null)

    if (response.error) {
      showError(
        `No se pudo actualizar el participante. ${safeString(response.error.message)}`
      )
      return
    }

    setParticipants((previous) =>
      previous.map((p) => (p.id === participantId ? { ...p, ...patch } : p))
    )
  }

  async function saveFeedbackNotes(participantId: string) {
    const notes = feedbackDrafts[participantId] ?? ''
    await updateParticipant(participantId, { feedback_notes: notes })
  }

  async function uploadArtifact(
    participantId: string,
    kind: 'certificate' | 'feedback',
    file: File
  ) {
    const key = `${participantId}:${kind}`
    setUploading((previous) => ({ ...previous, [key]: true }))

    const formData = new FormData()
    formData.append('application_id', participantId)
    formData.append('kind', kind)
    formData.append('file', file)

    const response = await fetch('/api/plataforma/edition-artifacts/upload', {
      method: 'POST',
      body: formData,
    })

    const json = (await response.json()) as {
      ok?: boolean
      message?: string
      object_path?: string
    }

    setUploading((previous) => ({ ...previous, [key]: false }))

    if (!response.ok || !json?.object_path) {
      showError(json?.message ?? 'No se pudo subir el archivo.')
      return
    }

    const patch =
      kind === 'certificate'
        ? { certificate_object_path: json.object_path }
        : { feedback_object_path: json.object_path }

    setParticipants((previous) =>
      previous.map((p) => (p.id === participantId ? { ...p, ...patch } : p))
    )

    showSuccess('Archivo subido.')
  }

  async function openArtifact(
    participantId: string,
    kind: 'certificate' | 'feedback'
  ) {
    const response = await fetch(
      `/api/plataforma/edition-artifacts/get-signed-url?application_id=${participantId}&kind=${kind}`
    )

    const json = (await response.json()) as {
      signed_url?: string
      message?: string
    }

    if (!response.ok || !json.signed_url) {
      showError(json?.message ?? 'No se pudo obtener el enlace.')
      return
    }

    window.open(json.signed_url, '_blank', 'noopener,noreferrer')
  }

  const teamOptions = useMemo(() => {
    return teams.map((team) => ({ value: team.id, label: team.name }))
  }, [teams])

  const tabsListClass =
    'bg-slate-900 text-slate-100 border border-slate-800 data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100'

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
          Cargando edicion...
        </div>
      </div>
    )
  }

  if (!program || !edition) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
          No se encontro la edicion.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/plataforma/admin/programas/${programId}`}
            className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-slate-100">
              {program.title} · {edition.edition_name}
            </h1>
            <div className="text-sm text-slate-300">
              {formatDateRange(edition.starts_at, edition.ends_at)}
            </div>
          </div>
        </div>
        <Button asChild variant="secondary" className="gap-2">
          <Link
            href={`/plataforma/admin/programas/${programId}/ediciones/${editionId}`}
          >
            <ExternalLink className="h-4 w-4" />
            Ver en nueva pestaña
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="resumen" className="space-y-6">
        <TabsList className="flex flex-wrap gap-2 bg-transparent">
          <TabsTrigger value="resumen" className={tabsListClass}>
            Resumen
          </TabsTrigger>
          <TabsTrigger value="formulario" className={tabsListClass}>
            Formulario
          </TabsTrigger>
          <TabsTrigger value="equipos" className={tabsListClass}>
            Equipos
          </TabsTrigger>
          <TabsTrigger value="hitos" className={tabsListClass}>
            Hitos
          </TabsTrigger>
          <TabsTrigger value="post" className={tabsListClass}>
            Post-edicion
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardHeader>
              <CardTitle>Resumen de la edicion</CardTitle>
              <CardDescription className="text-slate-300">
                Actualiza nombre, fechas y estado de apertura.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editionName">Nombre</Label>
                  <Input
                    id="editionName"
                    value={editionName}
                    onChange={(element) => setEditionName(element.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editionRange">Rango</Label>
                  <div className="text-sm text-slate-300">
                    {formatDateRange(edition.starts_at, edition.ends_at)}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editionStart">Inicio</Label>
                  <Input
                    id="editionStart"
                    type="date"
                    value={editionStartsAt}
                    onChange={(element) =>
                      setEditionStartsAt(element.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editionEnd">Fin</Label>
                  <Input
                    id="editionEnd"
                    type="date"
                    value={editionEndsAt}
                    onChange={(element) =>
                      setEditionEndsAt(element.target.value)
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="editionIsOpen"
                  checked={editionIsOpen}
                  onCheckedChange={setEditionIsOpen}
                />
                <Label htmlFor="editionIsOpen" className="text-sm">
                  {editionIsOpen ? 'Edicion abierta' : 'Edicion cerrada'}
                </Label>
                {!hasActiveForm ? (
                  <span className="text-xs text-slate-300">
                    Necesitas un formulario activo para abrir.
                  </span>
                ) : null}
              </div>

              <div className="flex items-center justify-end">
                <Button
                  onClick={saveEdition}
                  disabled={saving}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Guardar edicion
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formulario">
          <EditionFormBuilder
            programId={programId}
            editionId={editionId}
            onFormSaved={loadAll}
          />
        </TabsContent>

        <TabsContent value="equipos">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-slate-900 border-slate-800 text-slate-100">
              <CardHeader>
                <CardTitle>Equipos</CardTitle>
                <CardDescription className="text-slate-300">
                  Crea equipos y guarda sus enlaces.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={newTeamName}
                    onChange={(element) => setNewTeamName(element.target.value)}
                    placeholder="Nombre del equipo"
                  />
                  <Button onClick={createTeam} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar
                  </Button>
                </div>

                <div className="space-y-4">
                  {teams.length === 0 ? (
                    <div className="text-sm text-slate-300">
                      No hay equipos todavia.
                    </div>
                  ) : (
                    teams.map((team) => (
                      <div
                        key={team.id}
                        className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3"
                      >
                        <div className="space-y-2">
                          <Label>Nombre</Label>
                          <Input
                            value={team.name}
                            onChange={(element) =>
                              setTeams((previous) =>
                                previous.map((t) =>
                                  t.id === team.id
                                    ? { ...t, name: element.target.value }
                                    : t
                                )
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Drive</Label>
                          <Input
                            value={team.drive_url ?? ''}
                            onChange={(element) =>
                              setTeams((previous) =>
                                previous.map((t) =>
                                  t.id === team.id
                                    ? { ...t, drive_url: element.target.value }
                                    : t
                                )
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Classroom</Label>
                          <Input
                            value={team.classroom_url ?? ''}
                            onChange={(element) =>
                              setTeams((previous) =>
                                previous.map((t) =>
                                  t.id === team.id
                                    ? {
                                        ...t,
                                        classroom_url: element.target.value,
                                      }
                                    : t
                                )
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Slack</Label>
                          <Input
                            value={team.slack_url ?? ''}
                            onChange={(element) =>
                              setTeams((previous) =>
                                previous.map((t) =>
                                  t.id === team.id
                                    ? { ...t, slack_url: element.target.value }
                                    : t
                                )
                              )
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <Button
                            onClick={() => saveTeam(team)}
                            disabled={teamSavingId === team.id}
                          >
                            Guardar
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => setTeamToDelete(team)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 text-slate-100">
              <CardHeader>
                <CardTitle>Participantes</CardTitle>
                <CardDescription className="text-slate-300">
                  Asigna roles y equipos a los participantes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {participants.length === 0 ? (
                  <div className="text-sm text-slate-300">
                    No hay participantes para esta edicion.
                  </div>
                ) : (
                  participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">
                          {fullName(participant)}
                        </div>
                        <div className="text-xs text-slate-300">
                          {participant.applicant_profile?.email ?? 'Sin email'}
                        </div>
                        <div className="text-xs text-slate-300">
                          Estado: {participant.status}
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Rol asignado</Label>
                          <Select
                            value={participant.assigned_role ?? 'none'}
                            onValueChange={(value) =>
                              updateParticipant(participant.id, {
                                assigned_role:
                                  value === 'none'
                                    ? null
                                    : (value as ProgramParticipantRole),
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona rol" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin asignar</SelectItem>
                              {ROLE_OPTIONS.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Equipo</Label>
                          <Select
                            value={participant.team_id ?? 'none'}
                            onValueChange={(value) =>
                              updateParticipant(participant.id, {
                                team_id: value === 'none' ? null : value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona equipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin equipo</SelectItem>
                              {teamOptions.map((team) => (
                                <SelectItem key={team.value} value={team.value}>
                                  {team.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300">
                        Rol aplicado: {participant.applied_role ?? '—'}
                      </div>

                      {participantSavingId === participant.id ? (
                        <div className="text-xs text-slate-300">
                          Guardando cambios...
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hitos">
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>Hitos de la edicion</CardTitle>
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
                <div className="text-sm text-slate-300">
                  Todavia no hay hitos.
                </div>
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
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openMilestoneModal(milestone)}
                      >
                        Editar
                      </Button>
                    </div>
                    <div className="text-xs text-slate-300">
                      Meet: {milestone.meet_url ?? '—'}
                    </div>
                    <div className="text-xs text-slate-300">
                      Drive: {milestone.drive_url ?? '—'}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="post">
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardHeader>
              <CardTitle>Post-edicion</CardTitle>
              <CardDescription className="text-slate-300">
                Sube certificados y feedback por participante.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {participants.length === 0 ? (
                <div className="text-sm text-slate-300">
                  No hay participantes para esta edicion.
                </div>
              ) : (
                participants.map((participant) => {
                  const certKey = `${participant.id}:certificate`
                  const feedbackKey = `${participant.id}:feedback`
                  return (
                    <div
                      key={participant.id}
                      className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">
                          {fullName(participant)}
                        </div>
                        <div className="text-xs text-slate-300">
                          {participant.applicant_profile?.email ?? 'Sin email'}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Certificado</Label>
                          {participant.certificate_object_path ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                openArtifact(participant.id, 'certificate')
                              }
                            >
                              Ver certificado
                            </Button>
                          ) : (
                            <div className="text-xs text-slate-300">
                              Sin certificado cargado.
                            </div>
                          )}
                          <Input
                            type="file"
                            onChange={(event) => {
                              const file = event.target.files?.[0]
                              if (file) {
                                void uploadArtifact(
                                  participant.id,
                                  'certificate',
                                  file
                                )
                              }
                            }}
                          />
                          {uploading[certKey] ? (
                            <div className="text-xs text-slate-300">
                              Subiendo certificado...
                            </div>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label>Feedback</Label>
                          {participant.feedback_object_path ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                openArtifact(participant.id, 'feedback')
                              }
                            >
                              Ver feedback
                            </Button>
                          ) : (
                            <div className="text-xs text-slate-300">
                              Sin feedback cargado.
                            </div>
                          )}
                          <Input
                            type="file"
                            onChange={(event) => {
                              const file = event.target.files?.[0]
                              if (file) {
                                void uploadArtifact(
                                  participant.id,
                                  'feedback',
                                  file
                                )
                              }
                            }}
                          />
                          {uploading[feedbackKey] ? (
                            <div className="text-xs text-slate-300">
                              Subiendo feedback...
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Notas de feedback</Label>
                        <Textarea
                          value={feedbackDrafts[participant.id] ?? ''}
                          onChange={(event) =>
                            setFeedbackDrafts((previous) => ({
                              ...previous,
                              [participant.id]: event.target.value,
                            }))
                          }
                          placeholder="Comentarios internos o feedback corto..."
                        />
                        <Button
                          size="sm"
                          onClick={() => saveFeedbackNotes(participant.id)}
                        >
                          Guardar notas
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
        open={Boolean(teamToDelete)}
        onOpenChange={(open) => {
          if (!open) setTeamToDelete(null)
        }}
        title="Eliminar equipo?"
        description="Se eliminara el equipo y las asignaciones quedaran sin equipo."
        confirmLabel="Eliminar"
        confirmVariant="destructive"
        onConfirm={deleteTeam}
      />

      <Separator className="bg-slate-800" />
    </div>
  )
}
