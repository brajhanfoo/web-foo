'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { TalentSidebar } from './components/talent-sidebar'
import { TalentTopBar } from './components/talent-topbar'

type ProfileRole = 'talent' | 'admin' | 'super_admin' | 'staff'

type ProfileRow = {
  id: string
  role: ProfileRole
  first_name: string | null
  last_name: string | null
}

function textOrEmpty(v: string | null | undefined) {
  return (v ?? '').trim()
}

function buildName(p: ProfileRow | null, fallbackEmail?: string | null) {
  const a = textOrEmpty(p?.first_name)
  const b = textOrEmpty(p?.last_name)
  const full = `${a} ${b}`.trim()
  if (full) return full
  if (fallbackEmail) return fallbackEmail.split('@')[0] ?? 'Talento'
  return 'Talento'
}

export default function TalentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { showError } = useToastEnhanced()

  const [booting, setBooting] = useState(true)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  const showErrorRef = useRef(showError)
  useEffect(() => {
    showErrorRef.current = showError
  }, [showError])

  useEffect(() => {
    let cancelled = false

    async function run() {
      setBooting(true)

      const { data: userRes, error: userErr } = await supabase.auth.getUser()
      if (cancelled) return

      if (userErr || !userRes.user) {
        setBooting(false)
        router.replace('/ingresar')
        return
      }

      setEmail(userRes.user.email ?? null)

      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('id, role, first_name, last_name')
        .eq('id', userRes.user.id)
        .maybeSingle()

      if (cancelled) return

      if (profErr || !prof) {
        setBooting(false)
        showErrorRef.current('No se pudo cargar el perfil', profErr?.message)
        router.replace('/ingresar')
        return
      }

      // Gate por rol
      if (prof.role !== 'talent') {
        setBooting(false)
        router.replace('/plataforma') // o a donde quieras enviar no-talents
        return
      }

      setProfile(prof as ProfileRow)
      setBooting(false)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [router])

  const displayName = useMemo(() => buildName(profile, email), [profile, email])

  if (booting) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-sm text-white/60">Cargando…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex">
        <TalentSidebar displayName={displayName} />

        <div className="min-w-0 flex-1">
          <TalentTopBar displayName={displayName} />
          <main className="mx-auto max-w-[1200px] px-4 md:px-6 py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
