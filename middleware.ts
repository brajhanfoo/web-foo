import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function isPublicPath(pathname: string): boolean {
  const publicExactPaths = [
    '/',
    '/aboutus',
    '/services',
    '/programas',
    '/smart-projects',
    '/project-academy',
    '/registro',
    '/ingresar',
    '/auth/callback',
    '/reset-password',
    '/update-password',
    '/terminos-y-condiciones',
    '/politica-de-privacidad',
  ]
  const publicStartsWith = ['/_next', '/favicon', '/images', '/legal']

  const publicApiExactPaths = ['/api/auth/confirm']

  if (publicExactPaths.includes(pathname)) return true
  if (publicStartsWith.some((prefix) => pathname.startsWith(prefix)))
    return true
  if (publicApiExactPaths.includes(pathname)) return true

  return false
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  const isPlatformPath = pathname.startsWith('/plataforma')
  const isAdminPath = pathname.startsWith('/plataforma/admin')

  // público y no plataforma => pasa
  if (!isPlatformPath && isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // ✅ siempre creamos response para poder setear cookies correctamente
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // ✅ CLAVE: aplicar options correctamente
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  if (isPlatformPath) {
    const { data, error } = await supabase.auth.getUser()
    const user = data.user

    if (!user || error) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/ingresar'
      redirectUrl.searchParams.set('redirectTo', `${pathname}${search || ''}`)
      return NextResponse.redirect(redirectUrl)
    }

    if (isAdminPath) {
      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profErr || profile?.role !== 'super_admin') {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/plataforma'
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!.*\\..*).*)'],
}
