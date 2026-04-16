'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

import { ActivityTracker } from '@/components/auth/activity-tracker'

import { AdminSidebar } from './admin-sidebar'
import { AdminTopbar } from './admin-topbar'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!sidebarOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [sidebarOpen])

  return (
    <div
      className="h-screen overflow-hidden bg-slate-950 text-slate-100"
      style={{ colorScheme: 'dark' }}
    >
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-slate-100 focus:px-3 focus:py-2 focus:text-sm focus:text-slate-900 focus:shadow"
      >
        Saltar al contenido
      </a>

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
        <AdminSidebar
          className="h-full"
          onNavigate={() => setSidebarOpen(false)}
        />
      </aside>

      <div className="flex h-full min-h-0">
        <ActivityTracker />
        <div className="hidden h-full lg:block">
          <AdminSidebar className="h-full" />
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
          <main id="admin-main" className="px-4 py-6 md:px-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
