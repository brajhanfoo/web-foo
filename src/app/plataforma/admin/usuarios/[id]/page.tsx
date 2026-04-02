'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft } from 'lucide-react'

type ProfileRow = {
  id: string
  role: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  profile_status: string | null
  is_active: boolean | null
  country_residence: string | null
  whatsapp_e164: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  primary_role: string | null
  skills: string[] | null
  other_skills: string | null
  english_level: string | null
  document_number: string | null
  terms_version: string | null
  marketing_opt_in: boolean | null
  created_at: string | null
  updated_at: string | null
}

type ApplicationRow = {
  id: string
  program_id: string
  edition_id: string | null
  status: string
  applied_role: string | null
  payment_status: string | null
  created_at: string
  programs?: { title?: string | null; slug?: string | null } | null
  program_editions?: { edition_name?: string | null } | null
}

type PaymentRow = {
  id: string
  provider: string
  status: string
  purpose: string
  amount_cents: number
  currency: string
  program_id: string
  edition_id: string | null
  created_at: string
  paid_at: string | null
  programs?: { title?: string | null } | null
}

type PaymentsApiResponse =
  | { ok: true; payments: PaymentRow[] }
  | { ok: false; message: string }

function isProfileRow(value: unknown): value is ProfileRow {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.id === 'string'
}

function textOrDash(value: string | null | undefined) {
  return value?.trim() ? value.trim() : '—'
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatMoney(amountCents: number, currency: string) {
  const amount = Number.isFinite(amountCents) ? amountCents / 100 : 0
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 2,
  }).format(amount)
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>()
  const { showError } = useToastEnhanced()
  const showErrorRef = useRef(showError)

  const userId = params.id

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [payments, setPayments] = useState<PaymentRow[]>([])

  useEffect(() => {
    showErrorRef.current = showError
  }, [showError])

  const loadAll = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const profilePromise = supabase
      .from('profiles')
      .select(
        [
          'id',
          'role',
          'first_name',
          'last_name',
          'email',
          'profile_status',
          'is_active',
          'country_residence',
          'whatsapp_e164',
          'linkedin_url',
          'portfolio_url',
          'primary_role',
          'skills',
          'other_skills',
          'english_level',
          'document_number',
          'terms_version',
          'marketing_opt_in',
          'created_at',
          'updated_at',
        ].join(',')
      )
      .eq('id', userId)
      .maybeSingle()

    const applicationsPromise = supabase
      .from('applications')
      .select(
        'id, program_id, edition_id, status, applied_role, payment_status, created_at, programs(title, slug), program_editions(edition_name)'
      )
      .eq('applicant_profile_id', userId)
      .order('created_at', { ascending: false })

    const paymentsPromise = fetch(
      `/api/plataforma/admin/users/${userId}/payments`,
      {
        method: 'GET',
      }
    )
      .then(async (response) => {
        const payload = (await response.json()) as PaymentsApiResponse
        if (!response.ok || !payload.ok) {
          const message =
            typeof payload === 'object' && payload && 'message' in payload
              ? payload.message
              : 'No se pudieron cargar pagos'
          throw new Error(message)
        }
        return payload.payments
      })
      .catch((error) => ({ error }))

    const [profileRes, appsRes, paymentsRes] = await Promise.all([
      profilePromise,
      applicationsPromise,
      paymentsPromise,
    ])

    const profileData: unknown = profileRes.data
    if (profileRes.error || !isProfileRow(profileData)) {
      showErrorRef.current(
        'No se pudo cargar el perfil',
        profileRes.error?.message
      )
      setProfile(null)
    } else {
      setProfile(profileData)
    }

    if (appsRes.error) {
      showErrorRef.current(
        'No se pudieron cargar inscripciones',
        appsRes.error.message
      )
      setApplications([])
    } else {
      setApplications((appsRes.data ?? []) as ApplicationRow[])
    }

    if (
      paymentsRes &&
      typeof paymentsRes === 'object' &&
      'error' in paymentsRes
    ) {
      const message =
        paymentsRes.error instanceof Error
          ? paymentsRes.error.message
          : 'No se pudieron cargar pagos'
      showErrorRef.current('No se pudieron cargar pagos', message)
      setPayments([])
    } else {
      setPayments(paymentsRes as PaymentRow[])
    }

    setLoading(false)
  }, [userId])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const displayName = useMemo(() => {
    const name =
      `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim()
    return name || profile?.email || 'Usuario'
  }, [profile?.first_name, profile?.last_name, profile?.email])

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
          Cargando usuario…
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6 space-y-4">
        <Link
          href="/plataforma/admin/usuarios"
          className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver
        </Link>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
          Usuario no encontrado.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/plataforma/admin/usuarios"
            className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver
          </Link>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-slate-100">
              {displayName}
            </h1>
            <div className="text-sm text-slate-400">
              {textOrDash(profile.email)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="border border-slate-800 bg-slate-900 text-slate-200">
            {profile.role ?? 'talent'}
          </Badge>
          <Badge
            className={[
              'border',
              profile.is_active
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-900 text-slate-300 border-slate-800',
            ].join(' ')}
          >
            {profile.is_active ? 'Activo' : 'Desactivado'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs text-slate-400">Nombre</div>
                <div className="text-sm text-slate-100">{displayName}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Estado de perfil</div>
                <div className="text-sm text-slate-100">
                  {textOrDash(profile.profile_status)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">País</div>
                <div className="text-sm text-slate-100">
                  {textOrDash(profile.country_residence)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">WhatsApp</div>
                <div className="text-sm text-slate-100">
                  {textOrDash(profile.whatsapp_e164)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">LinkedIn</div>
                <div className="text-sm text-slate-100">
                  {textOrDash(profile.linkedin_url)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Portfolio</div>
                <div className="text-sm text-slate-100">
                  {textOrDash(profile.portfolio_url)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Rol principal</div>
                <div className="text-sm text-slate-100">
                  {textOrDash(profile.primary_role)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Inglés</div>
                <div className="text-sm text-slate-100">
                  {textOrDash(profile.english_level)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Documento</div>
                <div className="text-sm text-slate-100">
                  {textOrDash(profile.document_number)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Marketing</div>
                <div className="text-sm text-slate-100">
                  {profile.marketing_opt_in ? 'Opt-in' : 'Opt-out'}
                </div>
              </div>
            </div>

            <Separator className="border-slate-800" />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs text-slate-400">Skills</div>
                <div className="text-sm text-slate-100">
                  {profile.skills?.length ? profile.skills.join(', ') : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Otras skills</div>
                <div className="text-sm text-slate-100">
                  {textOrDash(profile.other_skills)}
                </div>
              </div>
            </div>

            <Separator className="border-slate-800" />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs text-slate-400">Creado</div>
                <div className="text-sm text-slate-100">
                  {formatDateTime(profile.created_at)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Actualizado</div>
                <div className="text-sm text-slate-100">
                  {formatDateTime(profile.updated_at)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <div className="text-xs text-slate-400">Inscripciones</div>
              <div className="text-lg font-semibold text-slate-100">
                {applications.length}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <div className="text-xs text-slate-400">Pagos</div>
              <div className="text-lg font-semibold text-slate-100">
                {payments.length}
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-800 text-slate-100"
              onClick={() => void loadAll()}
            >
              Recargar datos
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>Inscripciones</CardTitle>
        </CardHeader>
        <CardContent>
          {!applications.length ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
              Este usuario no tiene inscripciones.
            </div>
          ) : (
            <div
              className="rounded-lg border border-slate-800"
              style={{ contentVisibility: 'auto' }}
            >
              <div className="overflow-x-auto">
                <div className="min-w-[760px]">
                  <div className="grid grid-cols-12 gap-0 border-b border-slate-800 bg-slate-900/60 text-xs text-slate-300 font-medium">
                    <div className="col-span-4 px-3 py-2">Programa</div>
                    <div className="col-span-2 px-3 py-2">Edición</div>
                    <div className="col-span-2 px-3 py-2">Estado</div>
                    <div className="col-span-2 px-3 py-2">Pago</div>
                    <div className="col-span-2 px-3 py-2">Fecha</div>
                  </div>
                  {applications.map((row) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-12 items-center border-b border-slate-800 last:border-b-0 bg-slate-950"
                    >
                      <div className="col-span-4 min-w-0 px-3 py-3">
                        <div className="truncate text-sm font-medium text-slate-100">
                          {row.programs?.title ?? 'Programa'}
                        </div>
                        <div className="truncate text-xs text-slate-400">
                          {row.programs?.slug ?? '—'}
                        </div>
                      </div>
                      <div className="col-span-2 truncate px-3 py-3 text-sm text-slate-300">
                        {row.program_editions?.edition_name ?? '—'}
                      </div>
                      <div className="col-span-2 truncate px-3 py-3 text-sm text-slate-300">
                        {row.status}
                      </div>
                      <div className="col-span-2 truncate px-3 py-3 text-sm text-slate-300">
                        {row.payment_status ?? '—'}
                      </div>
                      <div className="col-span-2 truncate px-3 py-3 text-sm text-slate-300">
                        {formatDate(row.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle>Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {!payments.length ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
              Este usuario no tiene pagos registrados.
            </div>
          ) : (
            <div
              className="rounded-lg border border-slate-800"
              style={{ contentVisibility: 'auto' }}
            >
              <div className="overflow-x-auto">
                <div className="min-w-[860px]">
                  <div className="grid grid-cols-12 gap-0 border-b border-slate-800 bg-slate-900/60 text-xs text-slate-300 font-medium">
                    <div className="col-span-3 px-3 py-2">Programa</div>
                    <div className="col-span-2 px-3 py-2">Proveedor</div>
                    <div className="col-span-2 px-3 py-2">Estado</div>
                    <div className="col-span-2 px-3 py-2">Monto</div>
                    <div className="col-span-2 px-3 py-2">Propósito</div>
                    <div className="col-span-1 px-3 py-2">Fecha</div>
                  </div>
                  {payments.map((row) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-12 items-center border-b border-slate-800 last:border-b-0 bg-slate-950"
                    >
                      <div className="col-span-3 px-3 py-3">
                        <div className="truncate text-sm font-medium text-slate-100">
                          {row.programs?.title ?? 'Programa'}
                        </div>
                        <div className="truncate text-xs text-slate-400">
                          {row.edition_id ? `Edición ${row.edition_id}` : '—'}
                        </div>
                      </div>
                      <div className="col-span-2 truncate px-3 py-3 text-sm text-slate-300">
                        {row.provider ?? 'payphone'}
                      </div>
                      <div className="col-span-2 truncate px-3 py-3 text-sm text-slate-300">
                        {row.status}
                      </div>
                      <div className="col-span-2 truncate px-3 py-3 text-sm text-slate-300">
                        {formatMoney(row.amount_cents, row.currency)}
                      </div>
                      <div className="col-span-2 truncate px-3 py-3 text-sm text-slate-300">
                        {row.purpose}
                      </div>
                      <div className="col-span-1 px-3 py-3 text-sm text-slate-300">
                        {formatDate(row.paid_at ?? row.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
