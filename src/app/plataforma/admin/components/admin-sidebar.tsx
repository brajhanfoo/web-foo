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
        isActive
          ? 'bg-emerald-500/15 text-emerald-200'
          : 'text-white/70 hover:text-white hover:bg-white/5',
      ].join(' ')}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  )
}

export function AdminSidebar() {
  const router = useRouter()
  const { showSuccess, showError } = useToastEnhanced()

  const profile = useAuthStore((state) => state.profile)
  const signOut = useAuthStore((state) => state.signOut)

  async function handleSignOut() {
    try {
      await signOut()
      showSuccess('Sesión cerrada')
      router.push('/ingresar')
    } catch (error: unknown) {
      showError('No se pudo cerrar sesión')
    }
  }

  const displayName = profile
    ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
    : 'Cargando...'

  return (
    <aside className="flex h-[calc(100vh-80px)] w-64 flex-col border-r border-white/10 bg-white/[0.03] p-4">
      <div className="mb-5">
        <div className="text-sm text-white/60">Admin</div>
        <div className="text-base font-semibold text-white">{displayName}</div>
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
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
