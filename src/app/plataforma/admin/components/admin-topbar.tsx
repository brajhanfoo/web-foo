'use client'

import { useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'

import { useAuthStore } from '@/stores/auth-stores'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function textOrEmpty(v: string | null | undefined) {
  return (v ?? '').trim()
}

export function AdminTopbar() {
  const pathname = usePathname()
  const bootAuth = useAuthStore((s) => s.bootAuth)
  const profile = useAuthStore((s) => s.profile)

  const displayName = useMemo(() => {
    const n =
      `${textOrEmpty(profile?.first_name)} ${textOrEmpty(profile?.last_name)}`.trim()
    return n || 'Admin'
  }, [profile?.first_name, profile?.last_name])

  // Título simple basado en ruta (opcional)
  const title = useMemo(() => {
    if (pathname.includes('/postulaciones')) return 'Postulaciones'
    if (pathname.includes('/usuarios')) return 'Usuarios'
    if (pathname.includes('/programas')) return 'Programas'
    if (pathname.includes('/configuracion')) return 'Configuración'
    return 'Panel de Admin'
  }, [pathname])

  useEffect(() => {
    void bootAuth()
  }, [bootAuth])

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900 backdrop-blur-md">
      <div className="h-14 px-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-100 truncate">
            {title}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Gestión interna · Foo Talent Group
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 min-w-[320px]">
          <div className="relative w-full">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Buscar…"
              name="admin-search"
              aria-label="Buscar en admin"
              autoComplete="off"
              className="pl-9 bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-slate-800 text-slate-100 border border-slate-800">
            Admin
          </Badge>

          <Button
            variant="secondary"
            className="bg-slate-800 hover:bg-slate-700 border border-slate-800 text-slate-100"
          >
            Hola, {displayName}
          </Button>
        </div>
      </div>
    </header>
  )
}
