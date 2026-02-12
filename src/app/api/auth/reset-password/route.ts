import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSiteUrl } from '@/lib/site-url'
import {
  enforceAuthRateLimit,
  getRequestIp,
  logAuthSecurityEvent,
} from '@/lib/auth/enforce-auth-rate-limit'

export const runtime = 'nodejs'

type ResetPasswordBody = {
  email?: string
}

const GENERIC_MESSAGE =
  'Si el correo existe, enviaremos un enlace para recuperar tu contraseña.'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | ResetPasswordBody
    | null
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const ip = getRequestIp(request)
  const userAgent = request.headers.get('user-agent') ?? undefined

  const rateLimit = await enforceAuthRateLimit({
    action: 'reset_password',
    ip,
    email,
    userAgent,
  })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, retry_after_seconds: rateLimit.retryAfterSeconds ?? 60 },
      { status: 429 }
    )
  }

  const siteUrl = getSiteUrl()
  const redirectTo = siteUrl
    ? `${siteUrl}/api/auth/confirm?next=/update-password`
    : undefined

  let result: 'sent' | 'error' = 'error'

  if (email && redirectTo) {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
    result = error ? 'error' : 'sent'
  }

  await logAuthSecurityEvent({
    action: 'reset_password',
    ip,
    email,
    result,
    userAgent,
  })

  return NextResponse.json(
    { success: true, message: GENERIC_MESSAGE },
    { status: 200 }
  )
}
