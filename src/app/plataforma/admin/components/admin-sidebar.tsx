'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutGrid,
  Inbox,
  Users,
  GraduationCap,
  Settings,
  LogOut,
} from 'lucide-react'

import { useAuthStore } from '@/stores/auth-stores'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'

type SidebarLinkProperties = {
  href: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
}

function SidebarLink({ href, label, Icon }: SidebarLinkProperties) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={[
        'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
        isActive
          ? 'bg-emerald-500/20 text-emerald-200'
          : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800',
      ].join(' ')}
    >
      <span aria-hidden="true">
        <Icon className="h-4 w-4" />
      </span>
      <span>{label}</span>
    </Link>
  )
}

export function AdminSidebar() {
  const router = useRouter()
  const { showSuccess, showError } = useToastEnhanced()

  const profile = useAuthStore((state) => state.profile)
  const isBooting = useAuthStore((state) => state.isBooting)
  const signOut = useAuthStore((state) => state.signOut)

  async function handleSignOut() {
    try {
      await signOut()
      showSuccess('Sesión cerrada')
      router.push('/ingresar')
    } catch {
      showError('No se pudo cerrar sesión')
    }
  }

  const rawName = profile
    ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
    : ''
  const displayName = rawName || (isBooting ? 'Cargando…' : 'Admin')

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-slate-800 bg-slate-900 p-4">
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
        />
        <SidebarLink
          href="/plataforma/admin/postulaciones"
          label="Postulaciones"
          Icon={Inbox}
        />
        <SidebarLink
          href="/plataforma/admin/usuarios"
          label="Usuarios"
          Icon={Users}
        />
        <SidebarLink
          href="/plataforma/admin/programas"
          label="Programas"
          Icon={GraduationCap}
        />
      </nav>

      <div className="mt-auto space-y-2 pt-4">
        <SidebarLink
          href="/plataforma/admin/configuracion"
          label="Configuración"
          Icon={Settings}
        />

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          <span aria-hidden="true">
            <LogOut className="h-4 w-4" />
          </span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
