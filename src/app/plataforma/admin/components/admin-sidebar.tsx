'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  GraduationCap,
  Inbox,
  LayoutGrid,
  LogOut,
  Settings,
  Users,
} from 'lucide-react'

import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { useAuthStore } from '@/stores/auth-stores'

type SidebarLinkProperties = {
  href: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
  onNavigate?: () => void
}

function SidebarLink({
  href,
  label,
  Icon,
  onNavigate,
}: SidebarLinkProperties) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={[
        'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
        isActive
          ? 'bg-emerald-500/20 text-emerald-200'
          : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100',
      ].join(' ')}
    >
      <span aria-hidden="true">
        <Icon className="h-4 w-4" />
      </span>
      <span>{label}</span>
    </Link>
  )
}

export function AdminSidebar({
  className,
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  const router = useRouter()
  const { showError, showSuccess } = useToastEnhanced()

  const profile = useAuthStore((state) => state.profile)
  const isBooting = useAuthStore((state) => state.isBooting)
  const signOut = useAuthStore((state) => state.signOut)

  async function handleSignOut() {
    try {
      await signOut()
      showSuccess('Sesion cerrada')
      router.push('/ingresar')
      onNavigate?.()
    } catch {
      showError('No se pudo cerrar sesion')
    }
  }

  const rawName = profile
    ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
    : ''
  const displayName = rawName || (isBooting ? 'Cargando...' : 'Admin')

  return (
    <aside
      className={[
        'flex h-full min-h-0 w-64 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900 p-4',
        className ?? '',
      ].join(' ')}
    >
      <div className="mb-5">
        <div className="text-sm text-slate-300">Admin</div>
        <div className="text-base font-semibold text-slate-100">
          {displayName}
        </div>
      </div>

      <nav className="space-y-2">
        <SidebarLink
          href="/plataforma/admin"
          label="Inicio"
          Icon={LayoutGrid}
          onNavigate={onNavigate}
        />
        <SidebarLink
          href="/plataforma/admin/postulaciones"
          label="Postulaciones"
          Icon={Inbox}
          onNavigate={onNavigate}
        />
        <SidebarLink
          href="/plataforma/admin/usuarios"
          label="Usuarios"
          Icon={Users}
          onNavigate={onNavigate}
        />
        <SidebarLink
          href="/plataforma/admin/programas"
          label="Programas"
          Icon={GraduationCap}
          onNavigate={onNavigate}
        />
      </nav>

      <div className="mt-auto space-y-2 pt-4">
        <SidebarLink
          href="/plataforma/admin/configuracion"
          label="Configuracion"
          Icon={Settings}
          onNavigate={onNavigate}
        />

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          <span aria-hidden="true">
            <LogOut className="h-4 w-4" />
          </span>
          <span>Cerrar sesion</span>
        </button>
      </div>
    </aside>
  )
}
