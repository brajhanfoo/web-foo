'use client'

import { useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

function titleFromPath(pathname: string): string {
  if (pathname === '/plataforma/talento') return 'Panel de Postulante'
  if (pathname.startsWith('/plataforma/talento/explorar')) return 'Explorar'
  if (pathname.startsWith('/plataforma/talento/postulaciones'))
    return 'Mis Postulaciones'
  if (pathname.startsWith('/plataforma/talento/perfil'))
    return 'Mi Perfil Profesional'
  if (pathname.startsWith('/plataforma/talento/soporte'))
    return 'Soporte / Ayuda'
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
  rightActionHref = '/plataforma/talents/perfil',
}: {
  displayName: string
  rightActionLabel?: string
  rightActionHref?: string
}) {
  const pathname = usePathname()
  const router = useRouter()

  const title = useMemo(() => titleFromPath(pathname), [pathname])
  const initials = useMemo(() => initialsFromName(displayName), [displayName])

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 md:px-6">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white uppercase tracking-wide">
            {title}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            className="bg-white/10 hover:bg-white/15 border border-white/10 text-white"
            onClick={() => router.push(rightActionHref)}
          >
            {rightActionLabel}
          </Button>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
            <div className="text-xs text-white/60">Bienvenido</div>
            <div className="text-xs text-white font-semibold">
              Hola, {displayName.split(' ')[0] || 'Talento'} 👋
            </div>
            <Badge className="ml-2 bg-white/10 text-white border border-white/10">
              {initials}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  )
}
