'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

import { PlatformNotificationsMenu } from '@/components/platform/platform-notifications-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function titleFromPath(pathname: string): string {
  if (pathname === '/plataforma/docente') return 'Equipos y entregables'
  if (pathname.startsWith('/plataforma/docente/equipos'))
    return 'Workspace de equipo'
  if (pathname.startsWith('/plataforma/docente/actividad'))
    return 'Actividad de estudiantes'
  return 'Panel Docente'
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? 'D'
  const b = parts[1]?.[0] ?? ''
  return (a + b).toUpperCase()
}

export function DocenteTopbar({
  displayName,
  onMenuClick,
}: {
  displayName: string
  onMenuClick?: () => void
}) {
  const pathname = usePathname()
  const title = useMemo(() => titleFromPath(pathname), [pathname])
  const initials = useMemo(() => initialsFromName(displayName), [displayName])

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900 backdrop-blur-md">
      <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-9 w-9 border border-slate-800 text-slate-100 hover:bg-slate-800 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-100">
              {title}
            </div>
            <div className="truncate text-[11px] text-slate-400">
              Seguimiento docente · Foo Talent Group
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PlatformNotificationsMenu className="border-slate-800 bg-slate-800 hover:bg-slate-700" />
          <Badge className="border border-slate-800 bg-slate-800 text-slate-100">
            {initials}
          </Badge>
        </div>
      </div>
    </header>
  )
}
