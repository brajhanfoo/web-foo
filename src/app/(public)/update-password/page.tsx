'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getPasswordError } from '@/lib/validation/password'
import { HiOutlineShieldCheck, HiArrowLeft, HiCheck, HiEye, HiEyeSlash } from 'react-icons/hi2'

export default function UpdatePasswordPage() {
  const router = useRouter()

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

      // recomendado: cerrar sesión recovery y volver a login limpio
      await supabase.auth.signOut()

      setPhase('done')
      // setTimeout(() => router.replace('/ingresar'), 400)

    } catch (e: any) {
      setPhase('ready')
      setMessage(e?.message ?? 'No se pudo actualizar la contraseña.')
    }
  }

  return (
   <div className="min-h-screen bg-black flex items-center justify-center px-4">
    <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">

      {/* Panel izquierdo */}
      <div className="hidden lg:flex flex-col justify-center">
        <h1 className="text-5xl font-bold leading-tight tracking-tight text-white">
          Crea una{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
            nueva contraseña
          </span>
          .
        </h1>

        <p className="mt-6 max-w-xl text-lg text-gray-400 leading-relaxed">
          Estás a un paso de recuperar tu acceso. Define una nueva contraseña
          segura para continuar con tu evolución profesional.
        </p>

        <div className="mt-10 max-w-md rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent p-5 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <HiOutlineShieldCheck className="text-emerald-400 text-xl" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">
                Acceso Renovado
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Actualización inmediata y segura.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="relative rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-transparent to-purple-500/10 p-[1px] shadow-[0_0_40px_rgba(16,185,129,0.15)]">
        <div className="rounded-3xl bg-black/70 backdrop-blur-xl p-8 text-white">
          <h2 className="text-2xl font-semibold">
            Restablecer contraseña
          </h2>

          <p className="mt-2 text-sm text-gray-400">
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
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
              {message}
            </div>
          )}

          {phase === 'ready' && (
            <div className="mt-8 space-y-5">

              {/* Nueva contraseña */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full rounded-xl bg-black/40 border px-4 py-3 pr-12 text-white placeholder:text-white/30 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition ${
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
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/40 hover:text-emerald-400 transition"
                >
                  {showPassword ? (
                    <HiEyeSlash className="text-lg" />
                  ) : (
                    <HiEye className="text-lg" />
                  )}
                </button>
              </div>

              {passwordError && (
                <p className="mt-1 text-xs text-red-400">
                  {passwordError}
                </p>
              )}

              {/* Confirmar contraseña */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`w-full rounded-xl bg-black/40 border px-4 py-3 pr-12 text-white placeholder:text-white/30 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition ${
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
                  onClick={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/40 hover:text-emerald-400 transition"
                >
                  {showConfirmPassword ? (
                    <HiEyeSlash className="text-lg" />
                  ) : (
                    <HiEye className="text-lg" />
                  )}
                </button>
              </div>

              {confirmPasswordError && (
                <p className="mt-1 text-xs text-red-400">
                  {confirmPasswordError}
                </p>
              )}

              <button
                onClick={onSave}
                disabled={phase !== 'ready'}
                className="w-full rounded-xl py-3 font-semibold text-black bg-[#00CCA4] hover:opacity-90 transition disabled:opacity-60"
              >
                Actualizar contraseña
              </button>

              <div className="pt-4 border-t border-white/10 text-center">
                <button
                  onClick={() => router.replace('/ingresar')}
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition"
                >
                  <HiArrowLeft className="text-base" />
                  Volver al inicio de sesión
                </button>
              </div>
            </div>
          )}

          {/* Modal éxito */}
          {phase === 'done' && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">

              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-500/5" />

              <div className="relative w-full max-w-md mx-4 rounded-3xl border border-emerald-400/30 bg-black/95 p-[1px] shadow-[0_0_80px_rgba(16,185,129,0.35)]">
                <div className="rounded-3xl bg-black px-10 py-12 text-center text-white">

                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/30 shadow-[0_0_60px_rgba(16,185,129,0.4)]">
                    <HiCheck className="text-5xl text-emerald-400" />
                  </div>

                  <h2 className="mt-8 text-3xl font-semibold">
                    ¡Contraseña actualizada!
                  </h2>

                  <p className="mt-4 text-gray-400 leading-relaxed">
                    Tu contraseña ha sido restablecida correctamente.
                    Ya puedes acceder a tu cuenta con tus nuevas credenciales.
                  </p>

                  <button
                    onClick={() => router.replace('/ingresar')}
                    className="mt-10 w-full rounded-xl py-3 font-semibold text-black bg-[#00CCA4] hover:opacity-90 transition shadow-lg shadow-emerald-500/30 cursor-pointer"
                  >
                    Ir al inicio de sesión
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div className="mt-6">
              <button
                onClick={() => router.replace('/reset-password')}
                className="w-full rounded-xl py-3 text-sm border border-white/10 bg-white/5 hover:bg-white/10 text-white/80"
              >
                Volver a solicitar reset
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  )
}
