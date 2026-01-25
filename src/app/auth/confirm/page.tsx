import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ConfirmPageSearchParams = {
  code?: string
  error?: string
  error_code?: string
  error_description?: string
  next?: string
}

type ConfirmPageProps = {
  searchParams: ConfirmPageSearchParams
}

function safeNextPath(maybePath: string | undefined): string {
  if (!maybePath) return '/plataforma'
  if (!maybePath.startsWith('/')) return '/plataforma'
  return maybePath
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const errorMessageFromProvider =
    searchParams.error_description ||
    searchParams.error ||
    (searchParams.error_code ? `Error: ${searchParams.error_code}` : null)

  if (errorMessageFromProvider) {
    const encoded = encodeURIComponent(errorMessageFromProvider)
    redirect(`/ingresar?error=${encoded}`)
  }

  const code = searchParams.code
  if (!code) {
    redirect(
      '/ingresar?error=' + encodeURIComponent('Falta el parámetro code.')
    )
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    redirect(
      '/ingresar?error=' +
        encodeURIComponent(error.message || 'No se pudo confirmar el email.')
    )
  }

  const nextPath = safeNextPath(searchParams.next)
  redirect(nextPath)
}
