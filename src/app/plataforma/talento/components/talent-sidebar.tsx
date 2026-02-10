'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutGrid,
  GraduationCap,
  Inbox,
  User,
  LogOut,
  HelpCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import Image from 'next/image'
import { LOGOWEB } from '@/lib/imagePaths'

type SidebarLinkProps = {
  href: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
}

function SidebarLink({ href, label, Icon }: SidebarLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={[
        'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
        isActive
          ? 'bg-white/10 text-white'
          : 'text-white/70 hover:text-white hover:bg-white/5',
      ].join(' ')}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  )
}

export function TalentSidebar({ displayName }: { displayName: string }) {
  const router = useRouter()
  const { showSuccess, showError } = useToastEnhanced()

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
      showSuccess('Sesión cerrada')
      router.push('/ingresar')
    } catch {
      showError('No se pudo cerrar sesión')
    }
  }

  return (
    <aside className="w-72 shrink-0 border-r border-white/10 bg-white/[0.03] p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 pt-1">
        <div className="leading-tight">
          <Image
            src={LOGOWEB}
            alt={LOGOWEB}
            width={50}
            height={30}
            className="w-14 h-8 md:w-24 md:h-16"
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="text-xs text-white/50">Panel de postulante</div>
        <div className="mt-1 text-sm font-semibold text-white truncate">
          {displayName}
        </div>
      </div>

      <nav className="mt-5 space-y-1">
        <SidebarLink
          href="/plataforma/talento"
          label="Inicio"
          Icon={LayoutGrid}
        />
        <SidebarLink
          href="/plataforma/talento/explorar"
          label="Explorar"
          Icon={GraduationCap}
        />
        <SidebarLink
          href="/plataforma/talento/mis-postulaciones"
          label="Mis Postulaciones"
          Icon={Inbox}
        />
        <SidebarLink
          href="/plataforma/talento/perfil"
          label="Mi Perfil"
          Icon={User}
        />
      </nav>

      <div className="mt-auto pt-6 space-y-2">
        <div className="h-px bg-white/10" />

        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
          onClick={() => router.push('/plataforma/talento/soporte')}
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
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
