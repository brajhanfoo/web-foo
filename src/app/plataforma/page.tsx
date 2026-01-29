// src/app/plataforma/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function PlataformaIndexPage() {
  const supabase = await createClient()

  // 1. sesión
  const { data: userRes } = await supabase.auth.getUser()

  if (!userRes.user) {
    redirect('/ingresar')
  }

  const userId = userRes.user.id

  // 2. rol (consulta mínima)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (!profile?.role) {
    redirect('/ingresar')
  }

  // 3. redirect por rol
  switch (profile.role) {
    case 'admin':
    case 'super_admin':
      redirect('/plataforma/admin')

    case 'talent':
      redirect('/plataforma/talento')

    case 'staff':
      redirect('/plataforma/staff')

    default:
      redirect('/ingresar')
  }
}
