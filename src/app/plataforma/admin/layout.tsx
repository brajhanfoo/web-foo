import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import { AdminShell } from './components/admin-shell'

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

  return <AdminShell>{children}</AdminShell>
}

