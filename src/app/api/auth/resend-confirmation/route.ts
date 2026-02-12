import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSiteUrl } from '@/lib/site-url'
import { mapSupabaseAuthErrorToEs } from '@/lib/supabase/auth-errors'

type ResendBody = {
  email?: string
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ResendBody | null
  const email = typeof body?.email === 'string' ? body.email.trim() : ''

  if (!email) {
    return NextResponse.json(
      {
        success: false,
        error: {
          title: 'Email requerido',
          description: 'Ingresa tu correo para reenviar la verificación.',
        },
      },
      { status: 400 }
    )
  }

  const siteUrl = getSiteUrl()
  const emailRedirectTo = siteUrl
    ? `${siteUrl}/auth/confirm?next=/plataforma`
    : undefined

  const { error } = await supabaseAdmin.auth.resend({
    type: 'signup',
    email,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  })

  if (error) {
    const mapped = mapSupabaseAuthErrorToEs(error, 'resend')
    return NextResponse.json(
      {
        success: false,
        error: {
          title: mapped.title,
          description: mapped.description,
        },
      },
      { status: 400 }
    )
  }

  return NextResponse.json(
    {
      success: true,
      message: 'Correo enviado',
      description: 'Te enviamos un enlace para confirmar tu cuenta.',
    },
    { status: 200 }
  )
}
