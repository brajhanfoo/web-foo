'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// import { Separator } from '@/components/ui/separator'
import { HiOutlineCodeBracketSquare, HiOutlineUserCircle, HiOutlineLifebuoy } from 'react-icons/hi2'



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

      const row = (Array.isArray(apps) && apps.length ? apps[0] : null) as {
        id: string
        program_id: string
        status: string | null
        programs?: { title?: string | null } | null
      } | null

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
      <Card
        className={`relative overflow-hidden rounded-3xl border transition-all duration-300
  ${enrolledCount === 0
            ? 'border-[#77039F]/40 bg-gradient-to-r from-black via-[#120018] to-black'
            : 'border-[#BDBE0B]/40 bg-gradient-to-r from-black via-[#151600] to-black'
          }`}
      >
        <CardContent className="p-6 md:p-8">

          {loading ? (
            <div className="text-sm text-white/60">Cargando…</div>
          ) : enrolledCount === 0 ? (

            /* ---------- SIN INSCRIPCIÓN ---------- */
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-white/5 text-white border border-white/10">
                    Estado: Nuevo
                  </Badge>

                  <Badge className="bg-[#00CCA4]/10 text-[#00CCA4] border border-[#00CCA4]/30">
                    Sin inscripción
                  </Badge>
                </div>

                <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
                  Aún no estás inscrito en ningún programa.
                </h2>

                <p className="mt-3 text-sm md:text-base text-white/60 max-w-xl">
                  Explora nuestros entornos de simulación y comienza a validar tu seniority.
                </p>
              </div>

              <Button
                className="cursor-pointer bg-[#00CCA4] text-black hover:bg-[#00E0B3] transition-all duration-300 shadow-[0_0_30px_rgba(0,204,164,0.45)]"
                onClick={() => router.push('/plataforma/talento/explorar')}
              >
                Explorar Programas →
              </Button>
            </div>

          ) : (

            /* ---------- INSCRITO ---------- */
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-white/5 text-white border border-white/10">
                    Estado: Activo
                  </Badge>

                  <Badge className="bg-[#BDBE0B]/10 text-[#BDBE0B] border border-[#BDBE0B]/30">
                    Inscrito
                  </Badge>
                </div>

                <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
                  Estás inscrito en {latestApplication?.program_title ?? 'un programa'}.
                </h2>

                <p className="mt-3 text-sm md:text-base text-white/60">
                  Seguimiento en proceso.
                </p>
              </div>

              <Button
                className="cursor-pointer bg-[#BDBE0B] text-black hover:bg-[#d6d712] transition-all duration-300 shadow-[0_0_30px_rgba(189,190,11,0.45)]"
                onClick={() => router.push('/plataforma/talento/mis-postulaciones')}
              >
                Ver mis postulaciones →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* ================= MIS PROGRAMAS ================= */}
        <Card className="bg-black border border-white/10 rounded-xl">
          <CardContent className="p-5">

            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest">
                  Dashboard
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  Mis Programas
                </div>
              </div>

              <HiOutlineCodeBracketSquare className="text-xl text-[#00CCA4]" />
            </div>

            <div className="mt-6 flex items-end justify-between">
              <div>
                <div className="text-4xl font-semibold text-white">
                  {enrolledCount}
                </div>
                <div className="text-xs text-[#00CCA4] mt-1">
                  Activos
                </div>
              </div>

              <Button
                className="cursor-pointer
  border border-[#00CCA4]
  text-[#00CCA4]
  bg-transparent
  hover:bg-[#00CCA4]
  hover:text-black
  h-9 px-4 transition-all duration-300"
                onClick={() => router.push('/plataforma/talento/explorar')}
              >
                Ver →
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* ================= PERFIL ================= */}
        <Card className="bg-black border border-white/10 rounded-xl">
          <CardContent className="p-5">

            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest">
                  Profile Strength
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  Mi Perfil Profesional
                </div>
              </div>

              <HiOutlineUserCircle className="text-xl text-[#77039F]" />
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-2xl font-semibold text-white">
                {profilePct}%
              </div>

              {!profileComplete && (
                <span className="text-xs text-red-400 border border-red-400/30 px-2 py-1 rounded-md">
                  ⚠ Incompleto
                </span>
              )}
            </div>

            {/* Barra progreso estilo original */}
            <div className="mt-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#77039F] transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, profilePct))}%` }}
              />
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                className="cursor-pointer
  border border-[#77039F]
  text-[#77039F]
  bg-transparent
  hover:bg-[#77039F]
  hover:text-white
  h-9 px-4 transition-all duration-300"
                onClick={() => router.push('/plataforma/talento/perfil')}
              >
                Editar →
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* ================= SOPORTE ================= */}
        <Card className="bg-black border border-white/10 rounded-xl">
          <CardContent className="p-5">

            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest">
                  Help Center
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  Soporte / Ayuda
                </div>
              </div>

              <HiOutlineLifebuoy className="text-xl text-[#BDBE0B]" />
            </div>

            <div className="mt-6 text-sm text-white/60">
              ¿Tienes dudas sobre tu proceso?
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                className="cursor-pointer
  border border-[#BDBE0B]
  text-[#BDBE0B]
  bg-transparent
  hover:bg-[#BDBE0B]
  hover:text-black
  h-9 px-4 transition-all duration-300"
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
