'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type ConfirmResponse =
  | {
      success: true
      session_created: boolean
    }
  | {
      success: false
      error?: string
    }

type ConfirmStatus = 'loading' | 'success' | 'error'

const REDIRECT_SECONDS = 3

function safeNextPath(maybePath: string | null): string {
  if (!maybePath) return '/plataforma'
  if (!maybePath.startsWith('/')) return '/plataforma'
  return maybePath
}

function getRedirectLabel(target: string) {
  if (target === '/plataforma') return 'al dashboard'
  return 'a la seccion solicitada'
}

function ConfirmClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showSuccess } = useToastEnhanced()
  const showSuccessRef = useRef(showSuccess)
  const redirectStartedRef = useRef(false)

  const code = searchParams.get('code')
  const nextPath = safeNextPath(searchParams.get('next'))
  const providerError =
    searchParams.get('error_description') ??
    searchParams.get('error') ??
    searchParams.get('error_code')

  const [status, setStatus] = useState<ConfirmStatus>('loading')
  const [message, setMessage] = useState('Confirmando tu cuenta...')
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null)
  const [redirectSeconds, setRedirectSeconds] = useState<number | null>(null)

  useEffect(() => {
    showSuccessRef.current = showSuccess
  }, [showSuccess])

  useEffect(() => {
    let cancelled = false

    function startRedirect(target: string) {
      if (redirectStartedRef.current) return
      redirectStartedRef.current = true
      setRedirectTarget(target)
      setRedirectSeconds(REDIRECT_SECONDS)
    }

    async function resolveMissingOrError() {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return

      if (data.session) {
        setStatus('success')
        setMessage('Cuenta confirmada correctamente.')
        showSuccessRef.current('Cuenta confirmada y sesión iniciada')
        startRedirect(nextPath)
        return
      }

      setStatus('error')
      setMessage('Este enlace ya fue usado o expiró.')
    }

    if (providerError || !code) {
      void resolveMissingOrError()
      return () => {
        cancelled = true
      }
    }

    async function run() {
      setStatus('loading')
      setMessage('Confirmando tu cuenta...')
      try {
        const response = await fetch('/api/auth/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, next: nextPath }),
        })

        const payload = (await response
          .json()
          .catch(() => null)) as ConfirmResponse | null

        if (cancelled) return

        if (!response.ok || !payload || !payload.success) {
          await resolveMissingOrError()
          return
        }

        if (payload.session_created) {
          setStatus('success')
          setMessage('Cuenta confirmada correctamente.')
          showSuccessRef.current('Cuenta confirmada y sesión iniciada')
          startRedirect(nextPath)
          return
        }

        setStatus('success')
        setMessage(
          'Cuenta confirmada correctamente. Inicia sesión para continuar.'
        )
      } catch {
        if (cancelled) return
        await resolveMissingOrError()
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [code, nextPath, providerError])

  useEffect(() => {
    if (!redirectTarget || redirectSeconds === null) return
    if (redirectSeconds <= 0) {
      router.replace(redirectTarget)
      return
    }

    const timer = window.setTimeout(() => {
      setRedirectSeconds((previous) =>
        previous === null ? null : Math.max(previous - 1, 0)
      )
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [redirectSeconds, redirectTarget, router])

  const isLoading = status === 'loading'
  const isRedirecting = redirectSeconds !== null && redirectTarget !== null

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 bg-black">
      <Card className="w-full max-w-lg rounded-2xl border border-white/10 bg-black/40 text-white p-6 md:p-8">
        <h1 className="text-2xl font-semibold">Confirmación de cuenta</h1>
        <p className="mt-2 text-white/70">{message}</p>

        {isRedirecting ? (
          <p className="mt-3 text-sm text-white/60">
            Serás redirigido {getRedirectLabel(redirectTarget)} en{' '}
            {redirectSeconds} segundos.
          </p>
        ) : null}

        {isLoading ? (
          <div className="mt-6 text-sm text-white/60">Procesando…</div>
        ) : !isRedirecting ? (
          <div className="mt-6 flex flex-col gap-3">
            <Button
              type="button"
              onClick={() => router.push('/ingresar')}
              className="w-full h-11 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400"
            >
              Ir a iniciar sesión
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 bg-black">
          <div className="text-white">Cargando...</div>
        </div>
      }
    >
      <ConfirmClient />
    </Suspense>
  )
}

