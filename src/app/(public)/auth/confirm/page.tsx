'use client'

import { Suspense, useEffect, useId, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

type ResendResponse =
  | {
      success: true
      message: string
      description?: string
    }
  | {
      success: false
      retry_after_seconds?: number
    }

const REDIRECT_SECONDS = 3
const RESEND_COOLDOWN_MS = 60_000
const MAX_RETRY_AFTER_SECONDS = 600

function formatRetryMinutes(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  if (minutes >= 60) {
    const hours = Math.ceil(minutes / 60)
    return hours === 1 ? '1 hora' : `${hours} horas`
  }
  return minutes === 1 ? '1 minuto' : `${minutes} minutos`
}

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
  const { showSuccess, showError } = useToastEnhanced()
  const showSuccessRef = useRef(showSuccess)
  const showErrorRef = useRef(showError)
  const redirectStartedRef = useRef(false)
  const resendEmailId = useId()

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
  const [resendEmail, setResendEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)

  useEffect(() => {
    showSuccessRef.current = showSuccess
    showErrorRef.current = showError
  }, [showError, showSuccess])

  useEffect(() => {
    if (!cooldownUntil) return
    const remaining = cooldownUntil - Date.now()
    if (remaining <= 0) {
      setCooldownUntil(null)
      return
    }
    const timer = window.setTimeout(() => {
      setCooldownUntil(null)
    }, remaining)
    return () => window.clearTimeout(timer)
  }, [cooldownUntil])

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
  const isCooldownActive = cooldownUntil !== null
  const resendDisabled =
    isResending || isCooldownActive || !resendEmail.trim()
  const resendLabel = isResending
    ? 'Enviando...'
    : isCooldownActive
      ? 'Reenviar correo (espera)'
      : 'Reenviar correo de verificación'

  async function resendConfirmation() {
    const trimmedEmail = resendEmail.trim()
    if (!trimmedEmail) {
      showErrorRef.current(
        'Ingresa tu correo',
        'Necesitamos tu email para reenviar la confirmación.'
      )
      return
    }

    setIsResending(true)
    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      })

      const payload = (await response
        .json()
        .catch(() => null)) as ResendResponse | null

      if (response.status === 429) {
        const retryAfter =
          payload && !payload.success
            ? Number(payload.retry_after_seconds ?? 60)
            : 60
        const seconds = Math.min(
          Math.max(retryAfter, 1),
          MAX_RETRY_AFTER_SECONDS
        )
        setCooldownUntil(Date.now() + seconds * 1000)
        showErrorRef.current(
          'Demasiados intentos',
          `Intenta nuevamente en ${formatRetryMinutes(seconds)}.`
        )
        return
      }

      showSuccessRef.current(
        payload && payload.success && payload.message
          ? payload.message
          : 'Si el correo existe, enviaremos un enlace.',
        payload && payload.success && payload.description
          ? payload.description
          : 'Revisa tu bandeja de entrada o spam.'
      )
      setCooldownUntil(Date.now() + RESEND_COOLDOWN_MS)
    } catch {
      showErrorRef.current(
        'No pudimos reenviar el correo',
        'Intenta nuevamente en unos minutos.'
      )
    } finally {
      setIsResending(false)
    }
  }

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
            {status === 'error' ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={resendEmailId} className="text-sm text-white/70">
                    Email
                  </Label>
                  <Input
                    id={resendEmailId}
                    type="email"
                    className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-emerald-400/60"
                    value={resendEmail}
                    onChange={(event) => setResendEmail(event.target.value)}
                    placeholder="tu@email.com"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={resendDisabled}
                  onClick={resendConfirmation}
                  className="w-full h-11 rounded-xl border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                >
                  {resendLabel}
                </Button>
              </div>
            ) : null}
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
