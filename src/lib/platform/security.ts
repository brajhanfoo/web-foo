import { createClient } from '@/lib/supabase/server'

export type AppRole = 'talent' | 'docente' | 'staff' | 'admin' | 'super_admin'

export type ProfileAuth = {
  id: string
  role: AppRole
  is_active: boolean
  password_reset_required: boolean
}

export async function requirePlatformProfile(): Promise<
  | {
      ok: true
      profile: ProfileAuth
    }
  | {
      ok: false
      status: number
      message: string
    }
> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false, status: 401, message: 'No autenticado' }
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, is_active, password_reset_required')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profileRow?.role) {
    return { ok: false, status: 403, message: 'Perfil no disponible' }
  }

  const profile: ProfileAuth = {
    id: profileRow.id,
    role: profileRow.role as AppRole,
    is_active: profileRow.is_active !== false,
    password_reset_required: Boolean(profileRow.password_reset_required),
  }

  if (!profile.is_active) {
    return { ok: false, status: 403, message: 'Usuario inactivo' }
  }

  if (profile.password_reset_required) {
    return {
      ok: false,
      status: 423,
      message: 'Debes actualizar tu contraseña para continuar.',
    }
  }

  return { ok: true, profile }
}

export function isAdminRole(role: AppRole): boolean {
  return role === 'admin' || role === 'super_admin'
}

export function canManageTasks(role: AppRole): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'docente'
}
