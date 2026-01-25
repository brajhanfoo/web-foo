import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ProfileRow = {
  role: string | null
  full_name: string | null
}

export default async function PlataformaPage() {
  const supabaseServerClient = await createClient()

  const { data: userResponse, error: getUserError } =
    await supabaseServerClient.auth.getUser()

  if (getUserError) {
    // Si falla getUser por sesión/cookies, mandamos a login
    redirect('/ingresar')
  }

  const authenticatedUser = userResponse.user

  if (!authenticatedUser) {
    // No hay sesión -> no puede entrar a /plataforma
    redirect('/ingresar')
  }

  const { data: profileRow } = await supabaseServerClient
    .from('profiles')
    .select('role, first_name, last_name')
    .eq('id', authenticatedUser.id)
    .maybeSingle<ProfileRow>()

  const displayName = profileRow?.full_name?.trim()
    ? profileRow.full_name
    : (authenticatedUser.email ?? 'Usuario')

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Hola {displayName} 👋</h1>

      <p className="text-white/70">
        Rol:{' '}
        <span className="font-medium">{profileRow?.role ?? 'sin_rol'}</span>
      </p>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        Dashboard MVP: aquí va el “banner por estado” del PRD y accesos.
      </div>
    </div>
  )
}
