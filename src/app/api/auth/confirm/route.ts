import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/plataforma' // ✅ default

  if (!code) {
    const url = new URL('/ingresar', requestUrl)
    url.searchParams.set('error', 'missing_code')
    return NextResponse.redirect(url)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const url = new URL('/ingresar', requestUrl)
    url.searchParams.set('error', error.message)
    return NextResponse.redirect(url)
  }

  return NextResponse.redirect(new URL(next, requestUrl))
}
