'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Activity, LayoutGrid, LogOut } from 'lucide-react'

import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { supabase } from '@/lib/supabase/client'

type SidebarLinkProps = {
  href: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
  onNavigate?: () => void
}

function SidebarLink({ href, label, Icon, onNavigate }: SidebarLinkProps) {
  const pathname = usePathname()
  const active =
    pathname === href ||
    (href !== '/plataforma/docente' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={[
        'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
        active
          ? 'bg-emerald-500/20 text-emerald-200'
          : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100',
      ].join(' ')}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  )
}

export function DocenteSidebar({
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
      showSuccess('Sesión cerrada')
      router.push('/ingresar')
      onNavigate?.()
    } catch {
      showError('No se pudo cerrar sesión')
    }
  }

  return (
    <aside
      className={[
        'flex h-full w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-900 p-4',
        className ?? '',
      ].join(' ')}
    >
      <div className="mb-5">
        <div className="text-sm text-slate-300">Panel Docente</div>
        <div className="truncate text-base font-semibold text-slate-100">
          {displayName}
        </div>
      </div>

      <nav className="space-y-2">
        <SidebarLink
          href="/plataforma/docente"
          label="Inicio"
          Icon={LayoutGrid}
          onNavigate={onNavigate}
        />
        <SidebarLink
          href="/plataforma/docente/actividad"
          label="Actividad"
          Icon={Activity}
          onNavigate={onNavigate}
        />
      </nav>

      <div className="mt-auto space-y-2 pt-4">
        <div className="h-px bg-slate-800" />
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-slate-100 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
