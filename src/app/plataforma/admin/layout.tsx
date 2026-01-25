'use client'

import { useEffect, useRef } from 'react'
import { AdminSidebar } from './components/admin-sidebar'
import { useAuthStore } from '@/stores/auth-stores'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const bootAuth = useAuthStore((state) => state.bootAuth)
  const isBooting = useAuthStore((state) => state.isBooting)

  const hasBootedRef = useRef(false)

  useEffect(() => {
    if (hasBootedRef.current) return
    hasBootedRef.current = true
    void bootAuth()
  }, [bootAuth])

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-black">
      <AdminSidebar />

      <main className="flex-1 p-6">
        {isBooting ? (
          <div className="text-white/70">Cargando...</div>
        ) : (
          children
        )}
      </main>
    </div>
  )
}
