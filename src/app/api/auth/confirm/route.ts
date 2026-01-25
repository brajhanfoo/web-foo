import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(
      new URL('/ingresar?error=missing_code', requestUrl)
    )
  }

  const supabaseServerClient = await createClient()
  const { error } = await supabaseServerClient.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/ingresar?error=${encodeURIComponent(error.message)}`,
        requestUrl
      )
    )
  }

  return NextResponse.redirect(new URL('/plataforma', requestUrl))
}
