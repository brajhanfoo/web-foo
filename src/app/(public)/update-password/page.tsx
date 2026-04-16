'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getPasswordError } from '@/lib/validation/password'
import {
  HiOutlineShieldCheck,
  HiArrowLeft,
  HiCheck,
  HiEye,
  HiEyeSlash,
} from 'react-icons/hi2'

function UpdatePasswordPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requiredReset = searchParams.get('required') === '1'
  const redirectTo = searchParams.get('redirectTo') || '/plataforma'

  const [phase, setPhase] = useState<
    'boot' | 'validating' | 'ready' | 'saving' | 'done' | 'error'
  >('boot')
  const [message, setMessage] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setPhase('validating')
      setMessage(null)

      try {
        // ✅ Con PKCE + /api/auth/confirm ya NO viene #access_token en el hash.
        // El confirm intercambia el code por sesión y la guarda en cookies.
        // Acá sólo validamos que exista sesión.
        const { data, error } = await supabase.auth.getUser()

        if (cancelled) return

        if (error || !data.user) {
          setPhase('error')
          setMessage(
            'No se pudo validar el enlace o expiró. Volvé a solicitar el reset.'
          )
          return
        }

        setPhase('ready')
      } catch (e: any) {
        if (cancelled) return
        setPhase('error')
        setMessage(e?.message ?? 'No se pudo validar el enlace.')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  async function onSave() {
    setMessage(null)

    const nextPasswordError = getPasswordError(password)
    if (nextPasswordError) {
      setPasswordError(nextPasswordError)
      setMessage(nextPasswordError)
      return
    }
    if (password !== password2) {
      setConfirmPasswordError('Las contraseñas no coinciden.')
      setMessage('Las contraseñas no coinciden.')
      return
    }

    setPasswordError(null)
    setConfirmPasswordError(null)
    setPhase('saving')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      if (requiredReset) {
        await fetch('/api/auth/complete-password-reset', {
          method: 'POST',
        }).catch(() => null)
      } else {
        // flujo de recuperación por enlace
        await supabase.auth.signOut()
      }

      setPhase('done')
      // setTimeout(() => router.replace('/ingresar'), 400)
    } catch (e: any) {
      setPhase('ready')
      setMessage(e?.message ?? 'No se pudo actualizar la contraseña.')
    }
  }

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center px-4 overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,#77039F22,transparent_40%),radial-gradient(circle_at_80%_70%,#00CCA422,transparent_40%)] pointer-events-none" />

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-14 items-center">
        {/* Panel izquierdo */}
        <div className="hidden lg:flex flex-col justify-center text-white">
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Crea una <span className="text-[#00CCA4]">nueva contraseña</span>.
          </h1>

          <p className="mt-6 max-w-xl text-lg text-white/60 leading-relaxed">
            Estás a un paso de recuperar tu acceso. Define una nueva contraseña
            segura para continuar con tu evolución profesional.
          </p>

          <div className="mt-12 max-w-md rounded-2xl border border-[#77039F]/30 bg-gradient-to-br from-[#77039F]/20 to-transparent p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#77039F]/30 border border-[#77039F]/40">
                <HiOutlineShieldCheck className="text-[#BDBE0B] text-xl" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">
                  Acceso Renovado
                </h3>
                <p className="mt-1 text-sm text-white/60">
                  Actualización inmediata y segura.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="rounded-3xl border border-[#77039F]/30 bg-[#0D0D0D] p-8 shadow-[0_0_60px_#77039F20] backdrop-blur-xl text-white">
          <h2 className="text-2xl font-semibold">Restablecer contraseña</h2>

          <p className="mt-2 text-sm text-white/50">
            {phase === 'validating'
              ? 'Validando enlace...'
              : phase === 'ready'
                ? 'Ingresa y confirma tu nueva contraseña para recuperar el acceso a tu cuenta.'
                : phase === 'saving'
                  ? 'Actualizando contraseña...'
                  : phase === 'done'
                    ? 'Contraseña actualizada.'
                    : phase === 'error'
                      ? 'No se pudo validar el enlace.'
                      : ''}
          </p>

          {message && (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              {message}
            </div>
          )}

          {phase === 'ready' && (
            <div className="mt-8 space-y-5">
              {/* Nueva contraseña */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full rounded-xl bg-black border px-4 py-3 pr-12 text-white placeholder:text-white/30 outline-none focus:border-[#77039F] focus:ring-2 focus:ring-[#77039F]/40 transition ${
                    passwordError ? 'border-red-500/70' : 'border-white/10'
                  }`}
                  value={password}
                  onChange={(e) => {
                    const next = e.target.value
                    setPassword(next)
                    setPasswordError(getPasswordError(next))
                    setConfirmPasswordError(
                      password2 && next !== password2
                        ? 'Las contraseñas no coinciden.'
                        : null
                    )
                  }}
                  placeholder="Nueva contraseña"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-4 flex items-center text-white/40 hover:text-[#00CCA4] transition cursor-pointer"
                >
                  {showPassword ? (
                    <HiEyeSlash className="text-lg" />
                  ) : (
                    <HiEye className="text-lg" />
                  )}
                </button>
              </div>

              {passwordError && (
                <p className="text-xs text-red-400">{passwordError}</p>
              )}

              {/* Confirmar contraseña */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`w-full rounded-xl bg-black border px-4 py-3 pr-12 text-white placeholder:text-white/30 outline-none focus:border-[#77039F] focus:ring-2 focus:ring-[#77039F]/40 transition ${
                    confirmPasswordError
                      ? 'border-red-500/70'
                      : 'border-white/10'
                  }`}
                  value={password2}
                  onChange={(e) => {
                    const next = e.target.value
                    setPassword2(next)
                    setConfirmPasswordError(
                      next && next !== password
                        ? 'Las contraseñas no coinciden.'
                        : null
                    )
                  }}
                  placeholder="Confirmar contraseña"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-4 flex items-center text-white/40 hover:text-[#00CCA4] transition cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <HiEyeSlash className="text-lg" />
                  ) : (
                    <HiEye className="text-lg" />
                  )}
                </button>
              </div>

              {confirmPasswordError && (
                <p className="text-xs text-red-400">{confirmPasswordError}</p>
              )}

              <button
                onClick={onSave}
                disabled={phase !== 'ready'}
                className="w-full rounded-xl py-3 font-semibold text-black bg-[#00CCA4] hover:bg-[#00E0B3] transition shadow-[0_0_25px_#00CCA455] disabled:opacity-60 cursor-pointer"
              >
                Actualizar contraseña
              </button>

              <div className="pt-6 border-t border-white/10 text-center">
                <button
                  onClick={() => router.replace('/ingresar')}
                  className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-[#00CCA4] transition cursor-pointer"
                >
                  <HiArrowLeft className="text-base" />
                  Volver al inicio de sesión
                </button>
              </div>
            </div>
          )}

          {/* Modal éxito */}
          {phase === 'done' && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md">
              <div className="relative w-full max-w-md mx-4 rounded-3xl border border-[#77039F]/30 bg-[#0D0D0D] p-10 text-center shadow-[0_0_80px_#00CCA455]">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#00CCA4]/20 border border-[#00CCA4]/40 shadow-[0_0_60px_#00CCA455]">
                  <HiCheck className="text-5xl text-[#00CCA4]" />
                </div>

                <h2 className="mt-8 text-3xl font-semibold text-white">
                  ¡Contraseña actualizada!
                </h2>

                <p className="mt-4 text-white/60 leading-relaxed">
                  Tu contraseña ha sido restablecida correctamente. Ya puedes
                  acceder con tus nuevas credenciales.
                </p>

                <button
                  onClick={() =>
                    router.replace(requiredReset ? redirectTo : '/ingresar')
                  }
                  className="mt-10 w-full rounded-xl py-3 font-semibold text-black bg-[#00CCA4] hover:bg-[#00E0B3] transition shadow-[0_0_25px_#00CCA455] cursor-pointer"
                >
                  {requiredReset
                    ? 'Continuar a la plataforma'
                    : 'Ir al inicio de sesión'}
                </button>
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div className="mt-6">
              <button
                onClick={() => router.replace('/reset-password')}
                className="w-full rounded-xl py-3 text-sm border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 transition cursor-pointer"
              >
                Volver a solicitar reset
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function UpdatePasswordPageFallback() {
  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center px-4">
      <p className="text-sm text-white/60">Cargando...</p>
    </div>
  )
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<UpdatePasswordPageFallback />}>
      <UpdatePasswordPageContent />
    </Suspense>
  )
}
