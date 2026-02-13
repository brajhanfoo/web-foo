'use client'

import { Suspense, useEffect, useId, useState } from 'react'
import { HiRocketLaunch, HiEye, HiEyeSlash } from 'react-icons/hi2'
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
  const [showPassword, setShowPassword] = useState(false)

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

      const payload = (await response
        .json()
        .catch(() => null)) as ResendResponse | null

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
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center px-4 bg-black overflow-hidden">

      {/* Background decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,#77039F22,transparent_40%),radial-gradient(circle_at_80%_70%,#00CCA422,transparent_40%)] pointer-events-none" />

      <div className="relative w-full max-w-5xl grid md:grid-cols-2 gap-10 items-stretch">

        {/* PANEL IZQUIERDO */}
        <Card className="hidden md:flex flex-col justify-center rounded-3xl p-10 bg-[#0D0D0D] border border-[#77039F]/30 text-white shadow-[0_0_60px_#77039F20]">
          <h1 className="text-4xl font-bold leading-tight">
            Impulsa tu{" "}
            <span className="text-[#00CCA4]">carrera tech</span>.
          </h1>

          <p className="mt-6 max-w-lg text-lg text-white/60 leading-relaxed">
            Ingresa a tu espacio de trabajo y continúa tu evolución profesional.
            Accede a tu perfil, mentorías y red de contactos.
          </p>

          <div className="mt-12 max-w-xl rounded-2xl border border-[#77039F]/30 bg-gradient-to-br from-[#77039F]/20 to-transparent p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#77039F]/30 border border-[#77039F]/40">
                <HiRocketLaunch className="text-[#BDBE0B] text-xl" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">
                  Acceso inmediato
                </h3>
                <p className="mt-1 text-sm text-white/60">
                  Retoma tu aprendizaje donde lo dejaste.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* LOGIN */}
        <Card className="rounded-3xl p-8 bg-[#0D0D0D] border border-white/10 text-white shadow-[0_0_50px_#77039F20] backdrop-blur-xl">

          <h2 className="text-2xl font-semibold">
            Te damos la bienvenida
          </h2>

          <p className="text-white/50 text-sm mt-1">
            Ingresa tus credenciales para acceder.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">

            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor={emailId} className="text-sm text-white/70">
                Email
              </Label>
              <Input
                id={emailId}
                type="email"
                className="h-12 rounded-xl bg-black border border-white/10 text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-[#77039F]/60 focus-visible:border-[#77039F]"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (needsEmailConfirmation) setNeedsEmailConfirmation(false)
                }}
                placeholder="tu@email.com"
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label htmlFor={passwordId} className="text-sm text-white/70">
                Contraseña
              </Label>

              <div className="relative">
                <Input
                  id={passwordId}
                  type={showPassword ? 'text' : 'password'}
                  className="h-12 rounded-xl bg-black border border-white/10 text-white placeholder:text-white/30 pr-12 focus-visible:ring-2 focus-visible:ring-[#77039F]/60 focus-visible:border-[#77039F]"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-white/40 hover:text-[#00CCA4] transition"
                >
                  {showPassword ? (
                    <HiEyeSlash className="text-lg" />
                  ) : (
                    <HiEye className="text-lg" />
                  )}
                </button>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-xs text-white/50 hover:text-[#00CCA4] transition cursor-pointer"
                  onClick={() => router.push('/reset-password')}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </div>
            </div>


            {/* BOTÓN PRINCIPAL */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-[#00CCA4] text-black font-semibold hover:bg-[#00E0B3] transition shadow-[0_0_25px_#00CCA455] cursor-pointer"
            >
              {isSubmitting ? 'Iniciando...' : 'Iniciar sesión'}
            </Button>

            {/* REENVÍO VERIFICACIÓN */}
            {needsEmailConfirmation ? (
              <Button
                type="button"
                variant="outline"
                disabled={isResending || isCooldownActive || !email.trim()}
                onClick={resendVerification}
                className="w-full h-12 rounded-xl border border-[#77039F]/40 bg-[#77039F]/10 text-white hover:bg-[#77039F]/20 transition cursor-pointer"
              >
                {resendLabel}
              </Button>
            ) : null}

            {/* REGISTRO */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/registro')}
              className="w-full text-sm text-white/60 hover:text-white hover:bg-white/5 transition"
            >
              ¿No tienes cuenta?{" "}
              <span className="underline text-[#BDBE0B] ml-1 cursor-pointer">
                Regístrate
              </span>
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
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-black">
          <div className="text-white/70 animate-pulse">Cargando…</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
