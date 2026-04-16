import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'

import { sendTransactionalEmail } from '@/lib/platform/email'
import { isAdminRole, requirePlatformProfile } from '@/lib/platform/security'
import { supabaseAdmin } from '@/lib/supabase/admin'

function generateTemporaryPassword(): string {
  const token = randomBytes(6).toString('hex')
  return `Tmp#${token}A1`
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ docenteId?: string }> }
) {
  const auth = await requirePlatformProfile()
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status }
    )
  }
  if (!isAdminRole(auth.profile.role)) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos.' },
      { status: 403 }
    )
  }

  const { docenteId } = await context.params
  const targetId = String(docenteId ?? '').trim()
  if (!targetId) {
    return NextResponse.json(
      { ok: false, message: 'docenteId inválido.' },
      { status: 400 }
    )
  }

  const temporaryPassword = generateTemporaryPassword()
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    targetId,
    {
      password: temporaryPassword,
    }
  )

  if (authError) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo resetear la contraseña.' },
      { status: 400 }
    )
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ password_reset_required: true })
    .eq('id', targetId)
    .eq('role', 'docente')
    .select('email, first_name')
    .maybeSingle()

  if (profileError) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo actualizar bandera de reset.' },
      { status: 400 }
    )
  }

  if (profile?.email) {
    await sendTransactionalEmail({
      to: [profile.email],
      subject: 'Nueva contraseña temporal | Foo Talent Group',
      text: [
        `Hola ${profile.first_name ?? ''},`,
        'Se generó una nueva contraseña temporal para tu cuenta docente.',
        `Contraseña temporal: ${temporaryPassword}`,
        'En tu próximo ingreso deberás actualizarla.',
      ].join('\n'),
    })
  }

  return NextResponse.json({ ok: true, temporary_password: temporaryPassword })
}
