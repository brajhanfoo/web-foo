import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { ok: false, message: 'No autenticado' },
      { status: 401 }
    )
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      password_reset_required: false,
      last_login_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo completar el proceso.' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true })
}
