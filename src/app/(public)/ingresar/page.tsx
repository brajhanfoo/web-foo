'use client'

import { Suspense, useEffect, useId, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { mapSupabaseAuthErrorToEs } from '@/lib/supabase/auth-errors'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const RESEND_COOLDOWN_MS = 45_000

type ResendResponse =
  | {
      success: true
      message: string
      description?: string
    }
  | {
      success: false
      error: {
        title: string
        description?: string
      }
    }

function safeRedirectTo(value: string | null) {
  if (!value) return '/plataforma'
  if (!value.startsWith('/')) return '/plataforma'
  return value
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirectTo(searchParams.get('redirectTo'))
  const { showError, showSuccess } = useToastEnhanced()

  const emailId = useId()
  const passwordId = useId()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return
      if (data.user) router.replace(redirectTo)
    })
    return () => {
      cancelled = true
    }
  }, [router, redirectTo])

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

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setNeedsEmailConfirmation(false)
    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        const mapped = mapSupabaseAuthErrorToEs(error)
        showError(mapped.title, mapped.description)
        if (mapped.code === 'email-not-confirmed') {
          setNeedsEmailConfirmation(true)
        }
        return
      }

      if (data.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut()
        showError(
          'Cuenta no verificada',
          'Confirma tu correo para poder iniciar sesión. Revisa tu bandeja de entrada o spam.'
        )
        setNeedsEmailConfirmation(true)
        return
      }

      router.replace(redirectTo)
    } catch (error: unknown) {
      const mapped = mapSupabaseAuthErrorToEs(error)
      showError(mapped.title, mapped.description)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function resendVerification() {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      showError(
        'Ingresa tu correo',
        'Necesitamos tu email para reenviar la verificación.'
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

      const payload = (await response.json().catch(() => null)) as
        | ResendResponse
        | null

      if (!response.ok || !payload) {
        const mapped = mapSupabaseAuthErrorToEs(undefined, 'resend')
        showError(mapped.title, mapped.description)
        return
      }

      if (!payload.success) {
        showError(payload.error.title, payload.error.description)
        return
      }

      showSuccess(
        payload.message,
        payload.description ?? 'Revisa tu bandeja de entrada o spam.'
      )
      setCooldownUntil(Date.now() + RESEND_COOLDOWN_MS)
    } catch (error: unknown) {
      const mapped = mapSupabaseAuthErrorToEs(error, 'resend')
      showError(mapped.title, mapped.description)
    } finally {
      setIsResending(false)
    }
  }

  const isCooldownActive = cooldownUntil !== null
  const resendLabel = isResending
    ? 'Enviando...'
    : isCooldownActive
      ? 'Reenviar correo (espera)'
      : 'Reenviar correo de verificación'

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 bg-black">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-stretch">
        <Card className="hidden md:flex flex-col justify-center rounded-2xl p-8 bg-white/5 border border-white/10 text-white">
          <h1 className="text-3xl font-semibold text-amber-50">
            Impulsa tu <span className="text-emerald-400">carrera tech</span>.
          </h1>
          <p className="mt-3 text-white/70">
            Ingresa a tu espacio de trabajo y continúa tu evolución profesional.
          </p>
          <div className="mt-6 text-sm text-white/70">
            ✨ Acceso inmediato · Mentorías · Programas · Red de contactos
          </div>
        </Card>

        <Card className="rounded-2xl p-6 md:p-8 bg-black/40 border border-white/10 text-white backdrop-blur">
          <h2 className="text-xl font-semibold">Bienvenido de nuevo</h2>
          <p className="text-white/60 text-sm mt-1">
            Ingresa tus credenciales para acceder.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor={emailId} className="text-sm text-white/70">
                Email
              </Label>
              <Input
                id={emailId}
                type="email"
                className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-emerald-400/60"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (needsEmailConfirmation) setNeedsEmailConfirmation(false)
                }}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={passwordId} className="text-sm text-white/70">
                Contraseña
              </Label>
              <Input
                id={passwordId}
                type="password"
                className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-emerald-400/60"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-xs text-white/60 hover:text-white"
                  onClick={() => router.push('/reset-password')}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400"
            >
              {isSubmitting ? 'Iniciando...' : 'Iniciar sesión'}
            </Button>

            {needsEmailConfirmation ? (
              <Button
                type="button"
                variant="outline"
                disabled={isResending || isCooldownActive || !email.trim()}
                onClick={resendVerification}
                className="w-full h-11 rounded-xl border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
              >
                {resendLabel}
              </Button>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/registro')}
              className="w-full text-sm text-white/70 hover:text-white hover:bg-white/5"
            >
              ¿No tienes cuenta? <span className="underline">Regístrate</span>
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 bg-black">
          <div className="text-white">Cargando...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
