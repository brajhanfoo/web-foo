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
    .select('role, password_reset_required')
    .eq('id', userId)
    .maybeSingle()

  if (!profile?.role) {
    redirect('/ingresar')
  }

  if (profile.password_reset_required) {
    redirect('/update-password?required=1&redirectTo=%2Fplataforma')
  }

  // 3. redirect por rol
  switch (profile.role) {
    case 'admin':
    case 'super_admin':
      redirect('/plataforma/admin')

    case 'docente':
      redirect('/plataforma/docente')

    case 'talent':
      redirect('/plataforma/talento')

    case 'staff':
      redirect('/plataforma/staff')

    default:
      redirect('/ingresar')
  }
}
