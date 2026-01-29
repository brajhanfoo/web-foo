import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function safeNextPath(maybePath: string | undefined): string {
  if (!maybePath) return '/plataforma'
  if (!maybePath.startsWith('/')) return '/plataforma'
  return maybePath
}

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // Await searchParams en Next.js 15+
  const sp = await searchParams

  const code = typeof sp.code === 'string' ? sp.code : undefined
  const next = typeof sp.next === 'string' ? sp.next : undefined
  const error = typeof sp.error === 'string' ? sp.error : undefined
  const error_code =
    typeof sp.error_code === 'string' ? sp.error_code : undefined
  const error_description =
    typeof sp.error_description === 'string' ? sp.error_description : undefined

  const errorMessageFromProvider =
    error_description || error || (error_code ? `Error: ${error_code}` : null)

  if (errorMessageFromProvider) {
    const encoded = encodeURIComponent(errorMessageFromProvider)
    redirect(`/ingresar?error=${encoded}`)
  }

  if (!code) {
    redirect(
      '/ingresar?error=' + encodeURIComponent('Falta el parámetro code.')
    )
  }

  const supabase = await createClient()
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    redirect(
      '/ingresar?error=' +
        encodeURIComponent(
          exchangeError.message || 'No se pudo confirmar el email.'
        )
    )
  }

  const nextPath = safeNextPath(next)
  redirect(nextPath)
}
