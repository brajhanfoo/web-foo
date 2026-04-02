'use client'

import { useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'

import { PlatformNotificationsMenu } from '@/components/platform/platform-notifications-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function titleFromPath(pathname: string): string {
  if (pathname === '/plataforma/talento') return 'Panel de Postulante'
  if (pathname.startsWith('/plataforma/talento/explorar')) return 'Explorar'
  if (
    pathname.startsWith('/plataforma/talento/postulaciones') ||
    pathname.startsWith('/plataforma/talento/mis-postulaciones')
  ) {
    return 'Mis Postulaciones'
  }
  if (pathname.startsWith('/plataforma/talento/perfil')) {
    return 'Mi Perfil Profesional'
  }
  if (pathname.startsWith('/plataforma/talento/soporte')) {
    return 'Soporte / Ayuda'
  }
  return 'Talento'
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? 'A'
  const b = parts[1]?.[0] ?? ''
  return (a + b).toUpperCase()
}

export function TalentTopBar({
  displayName,
  rightActionLabel = 'Editar perfil',
  rightActionHref = '/plataforma/talento/perfil',
  onMenuClick,
}: {
  displayName: string
  rightActionLabel?: string
  rightActionHref?: string
  onMenuClick?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()

  const title = useMemo(() => titleFromPath(pathname), [pathname])
  const initials = useMemo(() => initialsFromName(displayName), [displayName])

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-[1200px] items-center justify-between gap-3 px-4 py-2 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={onMenuClick}
            className="h-9 w-9 border border-white/10 bg-white/10 text-white hover:bg-white/15 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div className="min-w-0 text-sm font-semibold uppercase tracking-wide text-white">
            <span className="block truncate">{title}</span>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          <PlatformNotificationsMenu />

          <Button
            variant="secondary"
            className="hidden border border-white/10 bg-white/10 text-white hover:bg-white/15 sm:inline-flex"
            onClick={() => router.push(rightActionHref)}
          >
            {rightActionLabel}
          </Button>

          <Button
            variant="secondary"
            className="border border-white/10 bg-white/10 px-3 text-white hover:bg-white/15 sm:hidden"
            onClick={() => router.push(rightActionHref)}
          >
            Perfil
          </Button>

          <div className="hidden min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 md:flex">
            <div className="text-xs text-white/60">Bienvenido</div>
            <div className="truncate text-xs font-semibold text-white">
              Hola, {displayName.split(' ')[0] || 'Talento'}
            </div>
            <Badge className="ml-1 border border-white/10 bg-white/10 text-white">
              {initials}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  )
}
