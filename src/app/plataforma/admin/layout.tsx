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
    <div className="min-h-screen bg-black">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <AdminTopbar />
          <main className="px-4 md:px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
