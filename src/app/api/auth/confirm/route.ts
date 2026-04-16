import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ConfirmBody = {
  code?: string
  next?: string
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ConfirmBody | null
  const code = typeof body?.code === 'string' ? body.code : ''

  if (!code) {
    return NextResponse.json(
      { success: false, error: 'missing_code' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message ?? 'exchange_failed' },
      { status: 400 }
    )
  }

  return NextResponse.json(
    { success: true, session_created: Boolean(data?.session) },
    { status: 200 }
  )
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/plataforma'

  if (!code) {
    const url = new URL('/auth/confirm', requestUrl)
    url.searchParams.set('error', 'missing_code')
    return NextResponse.redirect(url)
  }

  const url = new URL('/auth/confirm', requestUrl)
  url.searchParams.set('code', code)
  url.searchParams.set('next', next)
  return NextResponse.redirect(url)
}
