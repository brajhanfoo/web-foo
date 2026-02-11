import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import { AdminSidebar } from './components/admin-sidebar'
import { AdminTopbar } from './components/admin-topbar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1) sesión
  const { data: userRes } = await supabase.auth.getUser()
  const user = userRes.user
  if (!user) redirect('/ingresar')

  // 2) rol
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role ?? null
  if (role !== 'admin' && role !== 'super_admin') redirect('/plataforma')

  // 3) layout visual (tu mismo layout)
  return (
    <div
      className="h-screen overflow-hidden bg-slate-950 text-slate-100"
      style={{ colorScheme: 'dark' }}
    >
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-slate-100 focus:px-3 focus:py-2 focus:text-sm focus:text-slate-900 focus:shadow"
      >
        Saltar al contenido
      </a>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="hidden lg:block h-full">
          <AdminSidebar />
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
          <AdminTopbar />
          <main id="admin-main" className="px-4 md:px-6 py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
