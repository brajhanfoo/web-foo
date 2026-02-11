'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

type ProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  country_residence: string | null
  whatsapp_e164: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  primary_role: string | null
  skills: string[] | null
  english_level: string | null
  document_number: string | null
}

type ApplicationSummaryRow = {
  id: string
  program_id: string
  program_title: string | null
  status: string | null
}

function textOrEmpty(v: string | null | undefined) {
  return (v ?? '').trim()
}

function isNonEmpty(v: string | null | undefined) {
  return textOrEmpty(v).length > 0
}

function isNonEmptyArray(v: unknown) {
  return (
    Array.isArray(v) &&
    v.filter((x) => typeof x === 'string' && x.trim()).length > 0
  )
}

function calcProfileCompletion(p: ProfileRow | null) {
  // Campos “completables” por el usuario (ajustá a tu regla final)
  const checks = [
    isNonEmpty(p?.first_name),
    isNonEmpty(p?.last_name),
    isNonEmpty(p?.country_residence),
    isNonEmpty(p?.whatsapp_e164),
    isNonEmpty(p?.linkedin_url),
    isNonEmpty(p?.portfolio_url),
    isNonEmpty(p?.primary_role),
    isNonEmptyArray(p?.skills),
    isNonEmpty(p?.english_level),
    isNonEmpty(p?.document_number),
  ]

  const total = checks.length
  const ok = checks.filter(Boolean).length
  const pct = total === 0 ? 0 : Math.round((ok / total) * 100)

  return { pct, ok, total }
}

export default function TalentHomePage() {
  const router = useRouter()
  const { showError } = useToastEnhanced()

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [latestApplication, setLatestApplication] =
    useState<ApplicationSummaryRow | null>(null)

  const showErrorRef = useRef(showError)
  useEffect(() => {
    showErrorRef.current = showError
  }, [showError])

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)

      const { data: userRes, error: userErr } = await supabase.auth.getUser()
      if (cancelled) return

      if (userErr || !userRes.user) {
        setLoading(false)
        router.replace('/ingresar')
        return
      }

      const uid = userRes.user.id
      setUserId(uid)

      // Perfil
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select(
          'id,first_name,last_name,country_residence,whatsapp_e164,linkedin_url,portfolio_url,primary_role,skills,english_level,document_number'
        )
        .eq('id', uid)
        .maybeSingle()

      if (cancelled) return

      if (profErr) {
        setLoading(false)
        showErrorRef.current('No se pudo cargar el perfil', profErr.message)
        return
      }

      setProfile((prof ?? null) as ProfileRow | null)

      // Inscripción = existe al menos 1 application del usuario
      const { data: apps, error: appsErr } = await supabase
        .from('applications')
        .select('id, program_id, status, created_at, programs(title)')
        .eq('applicant_profile_id', uid)
        .order('created_at', { ascending: false })
        .limit(1)

      if (cancelled) return

      if (appsErr) {
        showErrorRef.current(
          'No se pudieron cargar las inscripciones',
          appsErr.message
        )
        setLatestApplication(null)
        setLoading(false)
        return
      }

      const row = (Array.isArray(apps) && apps.length ? apps[0] : null) as
        | {
            id: string
            program_id: string
            status: string | null
            programs?: { title?: string | null } | null
          }
        | null

      setLatestApplication(
        row
          ? {
              id: String(row.id),
              program_id: String(row.program_id),
              program_title:
                typeof row.programs?.title === 'string'
                  ? row.programs?.title
                  : null,
              status: typeof row.status === 'string' ? row.status : null,
            }
          : null
      )

      setLoading(false)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [router])

  const { pct: profilePct } = useMemo(
    () => calcProfileCompletion(profile),
    [profile]
  )
  const profileComplete = profilePct >= 100

  const enrolledCount = useMemo(() => {
    // Mínimo para "tiene inscripciones": existe al menos 1 application
    const n = latestApplication ? 1 : 0
    return Math.max(0, Math.min(1, n))
  }, [latestApplication])

  return (
    <div className="space-y-5">
      {/* Banner */}
      <Card className="bg-black/40 border-white/10 backdrop-blur-md overflow-hidden">
        <CardContent className="p-5 md:p-6">
          {loading ? (
            <div className="text-sm text-white/60">Cargando…</div>
          ) : enrolledCount === 0 ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-white/10 text-white border border-white/10">
                    Estado: Nuevo
                  </Badge>
                  <Badge className="bg-emerald-500/10 text-emerald-200 border border-emerald-500/20">
                    Sin inscripción
                  </Badge>
                </div>

                <div className="text-xl md:text-2xl font-semibold text-white">
                  🚀 Aún no estás inscrito en ningún programa.
                </div>
                <div className="text-sm text-white/60 mt-1">
                  Explora nuestros entornos de simulación y comienza a validar
                  tu seniority.
                </div>
              </div>

              <Button
                className="bg-[#00CCA4] text-black hover:bg-[#00b695]"
                onClick={() => router.push('/plataforma/talento/explorar')}
              >
                Explorar Programas →
              </Button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-white/10 text-white border border-white/10">
                    Estado: Activo
                  </Badge>
                  <Badge className="bg-emerald-500/10 text-emerald-200 border border-emerald-500/20">
                    Inscrito
                  </Badge>
                </div>

                <div className="text-xl md:text-2xl font-semibold text-white">
                  ✅ Estás inscrito en{' '}
                  {latestApplication?.program_title ?? 'un programa'}.
                </div>
                <div className="text-sm text-white/60 mt-1">
                  Seguimiento: {latestApplication?.status ?? 'en curso'}.
                </div>
              </div>

              <Button
                variant="secondary"
                className="bg-white/10 hover:bg-white/15 border border-white/10 text-white"
                onClick={() => router.push('/plataforma/talento/explorar')}
              >
                Ver programa →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mis Programas */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-md overflow-hidden">
          <CardContent className="p-5">
            <div className="text-[11px] text-white/50 uppercase tracking-widest">
              Dashboard
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              Mis Programas
            </div>

            <Separator className="my-4 border-white/10" />

            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-3xl font-semibold text-white">
                  {enrolledCount}
                </div>
                <div className="text-xs text-white/50 mt-1">Activos</div>
              </div>

              <Button
                variant="secondary"
                className="bg-white/10 hover:bg-white/15 border border-white/10 text-white"
                onClick={() => router.push('/plataforma/talento/explorar')}
              >
                Ver →
              </Button>
            </div>

            {enrolledCount > 1 ? (
              <div className="mt-3 text-xs text-amber-200">
                ⚠️ Tenés más de 1 inscripción (esto no debería pasar).
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Perfil */}
        <Card
          className={[
            'border backdrop-blur-md overflow-hidden',
            profileComplete
              ? 'bg-black/40 border-white/10'
              : 'bg-amber-500/5 border-amber-500/20',
          ].join(' ')}
        >
          <CardContent className="p-5">
            <div className="text-[11px] text-white/50 uppercase tracking-widest">
              Profile Strength
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              Mi Perfil Profesional
            </div>

            <Separator className="my-4 border-white/10" />

            <div className="flex items-center justify-between gap-3">
              <div className="text-3xl font-semibold text-white">
                {profilePct}%
              </div>
              {!profileComplete ? (
                <Badge className="bg-amber-500/10 text-amber-200 border border-amber-500/20">
                  Aún incompleto
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/10 text-emerald-200 border border-emerald-500/20">
                  Completo
                </Badge>
              )}
            </div>

            <div className="mt-4 h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className={[
                  'h-full rounded-full transition-all',
                  profileComplete ? 'bg-emerald-400/80' : 'bg-amber-400/80',
                ].join(' ')}
                style={{ width: `${Math.max(0, Math.min(100, profilePct))}%` }}
              />
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                className="bg-white text-black hover:bg-white/90"
                onClick={() => router.push('/plataforma/talento/perfil')}
              >
                Completar / Editar →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Soporte */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-md overflow-hidden">
          <CardContent className="p-5">
            <div className="text-[11px] text-white/50 uppercase tracking-widest">
              Help Center
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              Soporte / Ayuda
            </div>

            <Separator className="my-4 border-white/10" />

            <div className="text-sm text-white/60">
              ¿Tienes dudas sobre tu proceso?
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="secondary"
                className="bg-white/10 hover:bg-white/15 border border-white/10 text-white"
                onClick={() => router.push('/plataforma/talento/soporte')}
              >
                Abrir →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
