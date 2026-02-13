import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (!code) {
    return NextResponse.redirect(
      `${origin}/ingresar?error=oauth_exchange_failed`
    )
  }

  const cookieStore = await cookies()
  const cookiesToSet: Array<{
    name: string
    value: string
    options?: any
  }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(newCookies) {
          cookiesToSet.push(...newCookies)
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  const redirectUrl = error
    ? `${origin}/ingresar?error=oauth_exchange_failed`
    : `${origin}/plataforma/talento`

  const response = NextResponse.redirect(redirectUrl)
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}
