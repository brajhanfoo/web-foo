'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { useAuthStore } from '@/stores/auth-stores'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { Rocket, Users, ArrowRight, Lock } from 'lucide-react'

type ProgramRow = {
  id: string
  slug: string
  title: string
  description: string | null
  is_published: boolean
  requires_payment_pre: boolean
}

type EditionRow = {
  id: string
  program_id: string
  edition_name: string
  starts_at: string | null
  ends_at: string | null
  is_open: boolean
  created_at: string
}

type ApplicationFormRow = {
  id: string
  program_id: string
  version: string
  schema_json: unknown
  is_active: boolean
  opens_at: string | null
  closes_at: string | null
  created_at: string
}

function safeString(value: unknown): string {
  if (typeof value === 'string') return value
  return ''
}

function isFormOpen(form: ApplicationFormRow, now: Date): boolean {
  if (!form.is_active) return false
  const opensAt = form.opens_at ? new Date(form.opens_at) : null
  const closesAt = form.closes_at ? new Date(form.closes_at) : null
  if (opensAt && now < opensAt) return false
  if (closesAt && now > closesAt) return false
  return true
}

type ProgramCardVM = ProgramRow & {
  edition: EditionRow | null
  form: ApplicationFormRow | null
  status: 'open' | 'closed' | 'soon'
}

export default function ProgramsPage() {
  const router = useRouter()
  const toast = useToastEnhanced()
  const { bootAuth } = useAuthStore()

  const didBootReference = useRef(false)
  const didLoadReference = useRef(false)

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ProgramCardVM[]>([])

  useEffect(() => {
    if (didBootReference.current) return
    didBootReference.current = true
    void bootAuth()
  }, [bootAuth])

  useEffect(() => {
    if (didLoadReference.current) return
    didLoadReference.current = true
    void loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadAll() {
    setLoading(true)

    const programsResponse = await supabase
      .from('programs')
      .select(
        'id, slug, title, description, is_published, requires_payment_pre'
      )
      .order('created_at', { ascending: true })

    if (programsResponse.error) {
      toast.showError(
        `No se pudieron cargar programas. ${safeString(programsResponse.error.message)}`
      )
      setItems([])
      setLoading(false)
      return
    }

    const programs = (programsResponse.data ?? []) as ProgramRow[]
    if (programs.length === 0) {
      setItems([])
      setLoading(false)
      return
    }

    const programIds = programs.map((p) => p.id)

    const [editionsResponse, formsResponse] = await Promise.all([
      supabase
        .from('program_editions')
        .select(
          'id, program_id, edition_name, starts_at, ends_at, is_open, created_at'
        )
        .in('program_id', programIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('application_forms')
        .select(
          'id, program_id, version, schema_json, is_active, opens_at, closes_at, created_at'
        )
        .in('program_id', programIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    ])

    if (editionsResponse.error) {
      toast.showError('No se pudieron cargar ediciones.')
    }
    if (formsResponse.error) {
      toast.showError('No se pudieron cargar formularios.')
    }

    const editions = (editionsResponse.data ?? []) as EditionRow[]
    const forms = (formsResponse.data ?? []) as ApplicationFormRow[]

    // última edición por programa
    const latestEditionByProgram = new Map<string, EditionRow>()
    for (const ed of editions) {
      if (!latestEditionByProgram.has(ed.program_id))
        latestEditionByProgram.set(ed.program_id, ed)
    }

    // último form activo por programa
    const latestFormByProgram = new Map<string, ApplicationFormRow>()
    for (const f of forms) {
      if (!latestFormByProgram.has(f.program_id))
        latestFormByProgram.set(f.program_id, f)
    }

    const now = new Date()
    const vm: ProgramCardVM[] = programs.map((p) => {
      const edition = latestEditionByProgram.get(p.id) ?? null
      const form = latestFormByProgram.get(p.id) ?? null

      // reglas
      if (!p.is_published) {
        return { ...p, edition, form, status: 'soon' }
      }

      const editionOpen = Boolean(edition?.is_open)
      const formOpen = form ? isFormOpen(form, now) : false
      const open = editionOpen && formOpen

      return { ...p, edition, form, status: open ? 'open' : 'closed' }
    })

    setItems(vm)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-dvh p-6">
        <Card>
          <CardHeader>
            <CardTitle>Cargando programas…</CardTitle>
            <CardDescription>Preparando la lista.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-dvh p-6 space-y-6 bg-black">
      <div className="flex flex-col gap-2">
        <div className="text-2xl font-semibold">Programas</div>
      </div>

      <Separator />

      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No hay programas</CardTitle>
            <CardDescription>
              Creá un programa desde el panel admin.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 bg-black">
          {items.map((p) => {
            const badge =
              p.status === 'open' ? (
                <Badge className="gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  ABIERTO
                </Badge>
              ) : p.status === 'closed' ? (
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3.5 w-3.5" />
                  CERRADO
                </Badge>
              ) : (
                <Badge variant="secondary">PRÓXIMAMENTE</Badge>
              )

            const primaryAction =
              p.status === 'open' ? (
                <Button
                  className="w-full justify-between bg-[#00CCA4] text-black text-center"
                  onClick={() =>
                    router.push(`/plataforma/programas/${p.slug}/postular`)
                  }
                >
                  Iniciar postulación <ArrowRight className="h-4 w-4" />
                </Button>
              ) : p.status === 'closed' ? (
                <Button
                  variant="outline"
                  className="w-full justify-between bg-black text-amber-50 text-center"
                  onClick={() => router.push(`/plataforma/programas/${p.slug}`)}
                >
                  Ver detalle <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Próximamente
                </Button>
              )

            return (
              <Card
                key={p.id}
                className={[
                  'relative overflow-hidden bg-black',
                  p.status === 'open'
                    ? 'border-emerald-500/40 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]'
                    : '',
                ].join(' ')}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-md bg-emerald-500/15 flex items-center justify-center">
                        {p.slug === 'project-academy' ? (
                          <Rocket className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <Users className="h-5 w-5 text-emerald-400" />
                        )}
                      </div>
                      <div className="font-semibold text-amber-50">
                        {p.title}
                      </div>
                    </div>
                    {badge}
                  </div>

                  <CardDescription className="whitespace-pre-line text-amber-50">
                    {p.description ?? '—'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="text-xs text-amber-50">
                    {p.edition ? (
                      <>
                        <span className="font-medium">
                          {p.edition.edition_name}
                        </span>
                        {' · '}
                      </>
                    ) : (
                      'Sin edición'
                    )}
                  </div>

                  {p.requires_payment_pre ? (
                    <Badge className="text-amber-50" variant="outline">
                      Requiere pago previo
                    </Badge>
                  ) : (
                    <Badge className="text-amber-50" variant="outline">
                      Pago posterior / coordinación
                    </Badge>
                  )}

                  {primaryAction}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
