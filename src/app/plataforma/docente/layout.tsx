import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import { DocenteShell } from './components/docente-shell'

function displayName(firstName: string | null, lastName: string | null, fallback: string) {
  const name = `${firstName ?? ''} ${lastName ?? ''}`.trim()
  return name || fallback
}

export default async function DocenteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/ingresar')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name, last_name')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role ?? null
  const allowed = role === 'docente' || role === 'admin' || role === 'super_admin'
  if (!allowed) {
    redirect('/plataforma')
  }

  const name = displayName(
    profile?.first_name ?? null,
    profile?.last_name ?? null,
    user.email?.split('@')[0] ?? 'Docente'
  )

  return <DocenteShell displayName={name}>{children}</DocenteShell>
}

