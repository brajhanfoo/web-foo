'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { supabase } from '@/lib/supabase/client'

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
  const pathname = usePathname()
  const { showError } = useToastEnhanced()

  const [booting, setBooting] = useState(true)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

      const canViewWorkspace =
        (prof.role === 'admin' || prof.role === 'super_admin') &&
        pathname.startsWith('/plataforma/talento/mis-postulaciones/') &&
        pathname.endsWith('/workspace')

      if (prof.role !== 'talent' && !canViewWorkspace) {
        setBooting(false)
        router.replace('/plataforma')
        return
      }

      setProfile(prof as ProfileRow)
      setBooting(false)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [pathname, router])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!sidebarOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [sidebarOpen])

  const displayName = useMemo(() => buildName(profile, email), [profile, email])

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-sm text-white/60">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div
        className={[
          'fixed inset-0 z-40 bg-black/70 transition-opacity duration-200 lg:hidden',
          sidebarOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 max-w-[85vw] transition-transform duration-200 lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <TalentSidebar
          displayName={displayName}
          className="h-full"
          onNavigate={() => setSidebarOpen(false)}
        />
      </aside>

      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <TalentSidebar displayName={displayName} className="h-screen" />
        </div>

        <div className="min-w-0 flex-1">
          <TalentTopBar
            displayName={displayName}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
