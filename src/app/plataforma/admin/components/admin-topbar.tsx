'use client'

import { useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Search } from 'lucide-react'

import { PlatformNotificationsMenu } from '@/components/platform/platform-notifications-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth-stores'

function textOrEmpty(v: string | null | undefined) {
  return (v ?? '').trim()
}

export function AdminTopbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname()
  const bootAuth = useAuthStore((s) => s.bootAuth)
  const profile = useAuthStore((s) => s.profile)

  const displayName = useMemo(() => {
    const n =
      `${textOrEmpty(profile?.first_name)} ${textOrEmpty(profile?.last_name)}`.trim()
    return n || 'Admin'
  }, [profile?.first_name, profile?.last_name])

  const title = useMemo(() => {
    if (pathname.includes('/postulaciones')) return 'Postulaciones'
    if (pathname.includes('/usuarios')) return 'Usuarios'
    if (pathname.includes('/docentes')) return 'Docentes'
    if (pathname.includes('/actividad')) return 'Actividad'
    if (pathname.includes('/entregables')) return 'Entregables'
    if (pathname.includes('/programas')) return 'Programas'
    if (pathname.includes('/configuracion')) return 'Configuracion'
    return 'Panel de Admin'
  }, [pathname])

  useEffect(() => {
    void bootAuth()
  }, [bootAuth])

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900 backdrop-blur-md">
      <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={onMenuClick}
            className="h-9 w-9 border border-slate-800 bg-slate-800 text-slate-100 hover:bg-slate-700 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </Button>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-100">
              {title}
            </div>
            <div className="truncate text-[11px] text-slate-400">
              Gestion interna · Foo Talent Group
            </div>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 md:flex lg:max-w-[360px]">
          <div className="relative w-full min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar..."
              name="admin-search"
              aria-label="Buscar en admin"
              autoComplete="off"
              className="border-slate-800 bg-slate-900 pl-9 text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PlatformNotificationsMenu className="border-slate-800 bg-slate-800 hover:bg-slate-700" />
          <Badge className="border border-slate-800 bg-slate-800 text-slate-100">
            Admin
          </Badge>

          <Button
            variant="secondary"
            className="hidden border border-slate-800 bg-slate-800 text-slate-100 hover:bg-slate-700 sm:inline-flex"
          >
            Hola, {displayName}
          </Button>
        </div>
      </div>
    </header>
  )
}
