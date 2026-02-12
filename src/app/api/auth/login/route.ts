import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  enforceAuthRateLimit,
  getRequestIp,
  logAuthSecurityEvent,
} from '@/lib/auth/enforce-auth-rate-limit'

export const runtime = 'nodejs'

type LoginBody = {
  email?: string
  password?: string
}

const GENERIC_INVALID_MESSAGE = 'Correo o contraseña incorrectos.'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginBody | null
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const ip = getRequestIp(request)
  const userAgent = request.headers.get('user-agent') ?? undefined

  const rateLimit = await enforceAuthRateLimit({
    action: 'login_attempt',
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

  if (!email || !password) {
    await logAuthSecurityEvent({
      action: 'login_attempt',
      ip,
      email,
      result: 'invalid',
      userAgent,
    })

    return NextResponse.json(
      { success: false, message: GENERIC_INVALID_MESSAGE },
      { status: 401 }
    )
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  })

  const isConfirmed = Boolean(data?.user?.email_confirmed_at)

  if (error || !data?.session || !isConfirmed) {
    await logAuthSecurityEvent({
      action: 'login_attempt',
      ip,
      email,
      result: 'invalid',
      userAgent,
    })

    return NextResponse.json(
      { success: false, message: GENERIC_INVALID_MESSAGE },
      { status: 401 }
    )
  }

  await logAuthSecurityEvent({
    action: 'login_attempt',
    ip,
    email,
    result: 'allowed',
    userAgent,
  })

  return NextResponse.json(
    { success: true, session: data.session },
    { status: 200 }
  )
}
