'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  GraduationCap,
  HelpCircle,
  Inbox,
  LayoutGrid,
  LogOut,
  User,
} from 'lucide-react'

import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { LOGOWEB } from '@/lib/imagePaths'
import { supabase } from '@/lib/supabase/client'

type SidebarLinkProps = {
  href: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
  onNavigate?: () => void
}

function SidebarLink({ href, label, Icon, onNavigate }: SidebarLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={[
        'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
        isActive
          ? 'bg-white/10 text-white'
          : 'text-white/70 hover:bg-white/5 hover:text-white',
      ].join(' ')}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  )
}

export function TalentSidebar({
  displayName,
  className,
  onNavigate,
}: {
  displayName: string
  className?: string
  onNavigate?: () => void
}) {
  const router = useRouter()
  const { showError, showSuccess } = useToastEnhanced()

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
      showSuccess('Sesion cerrada')
      router.push('/ingresar')
      onNavigate?.()
    } catch {
      showError('No se pudo cerrar sesion')
    }
  }

  return (
    <aside
      className={[
        'flex h-full w-72 shrink-0 flex-col border-r border-white/10 bg-white/[0.03] p-4',
        className ?? '',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 px-2 pt-1">
        <div className="leading-tight">
          <Image
            src={LOGOWEB}
            alt={LOGOWEB}
            width={50}
            height={30}
            className="h-8 w-14 md:h-16 md:w-24"
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="text-xs text-white/50">Panel de postulante</div>
        <div className="mt-1 truncate text-sm font-semibold text-white">
          {displayName}
        </div>
      </div>

      <nav className="mt-5 space-y-1">
        <SidebarLink
          href="/plataforma/talento"
          label="Inicio"
          Icon={LayoutGrid}
          onNavigate={onNavigate}
        />
        <SidebarLink
          href="/plataforma/talento/explorar"
          label="Explorar"
          Icon={GraduationCap}
          onNavigate={onNavigate}
        />
        <SidebarLink
          href="/plataforma/talento/mis-postulaciones"
          label="Mis programas"
          Icon={Inbox}
          onNavigate={onNavigate}
        />
        <SidebarLink
          href="/plataforma/talento/perfil"
          label="Mi Perfil"
          Icon={User}
          onNavigate={onNavigate}
        />
      </nav>

      <div className="mt-auto space-y-2 pt-6">
        <div className="h-px bg-white/10" />

        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
          onClick={() => {
            router.push('/plataforma/talento/soporte')
            onNavigate?.()
          }}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Ayuda / Soporte</span>
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesion</span>
        </button>
      </div>
    </aside>
  )
}
