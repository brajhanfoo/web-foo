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
  if (publicStartsWith.some((prefix) => pathname.startsWith(prefix))) {
    return true
  }
  if (publicApiExactPaths.includes(pathname)) return true

  return false
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const isPlatformPath = pathname.startsWith('/plataforma')
  const isAdminPath = pathname.startsWith('/plataforma/admin')
  const isDocentePath = pathname.startsWith('/plataforma/docente')

  if (!isPlatformPath && isPublicPath(pathname)) {
    return NextResponse.next()
  }

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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_active, password_reset_required')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile?.role || profile.is_active === false) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/ingresar'
      return NextResponse.redirect(redirectUrl)
    }

    if (profile.password_reset_required && pathname !== '/update-password') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/update-password'
      redirectUrl.searchParams.set('required', '1')
      redirectUrl.searchParams.set('redirectTo', `${pathname}${search || ''}`)
      return NextResponse.redirect(redirectUrl)
    }

    if (isAdminPath) {
      const isAdminLevel =
        profile.role === 'admin' || profile.role === 'super_admin'
      if (!isAdminLevel) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/plataforma'
        return NextResponse.redirect(redirectUrl)
      }
    }

    if (isDocentePath) {
      const isDocenteLevel =
        profile.role === 'docente' ||
        profile.role === 'admin' ||
        profile.role === 'super_admin'
      if (!isDocenteLevel) {
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

