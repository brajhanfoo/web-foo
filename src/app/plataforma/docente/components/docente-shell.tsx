'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

import { ActivityTracker } from '@/components/auth/activity-tracker'

import { DocenteSidebar } from './docente-sidebar'
import { DocenteTopbar } from './docente-topbar'

export function DocenteShell({
  displayName,
  children,
}: {
  displayName: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!sidebarOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [sidebarOpen])

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100">
      <ActivityTracker />

      <div
        className={[
          'fixed inset-0 z-40 bg-black/70 transition-opacity duration-200 lg:hidden',
          sidebarOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <DocenteSidebar
          displayName={displayName}
          className="h-full"
          onNavigate={() => setSidebarOpen(false)}
        />
      </aside>

      <div className="flex h-full min-h-0">
        <div className="hidden h-full lg:block">
          <DocenteSidebar displayName={displayName} className="h-full" />
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <DocenteTopbar
            displayName={displayName}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="px-4 py-6 md:px-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
