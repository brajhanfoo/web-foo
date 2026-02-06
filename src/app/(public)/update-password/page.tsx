'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getPasswordError } from '@/lib/validation/password'

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
      setTimeout(() => router.replace('/ingresar'), 400)
    } catch (e: any) {
      setPhase('ready')
      setMessage(e?.message ?? 'No se pudo actualizar la contraseña.')
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 bg-black">
      <div className="w-full max-w-md rounded-2xl p-6 bg-black/40 border border-white/10 backdrop-blur text-white">
        <h1 className="text-xl font-semibold">Actualizar contraseña</h1>
        <p className="text-white/60 text-sm mt-1">
          {phase === 'validating'
            ? 'Validando enlace...'
            : phase === 'ready'
              ? 'Elegí tu nueva contraseña.'
              : phase === 'saving'
                ? 'Guardando...'
                : phase === 'done'
                  ? 'Contraseña actualizada. Redirigiendo...'
                  : phase === 'error'
                    ? 'No se pudo validar el enlace.'
                    : ''}
        </p>

        {message ? (
          <div className="mt-4 text-sm text-white/90 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            {message}
          </div>
        ) : null}

        {phase === 'ready' ? (
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-white/70">Nueva contraseña</label>
              <input
                type="password"
                className={`mt-1 w-full rounded-xl bg-white/5 border px-4 py-3 outline-none focus:border-emerald-400/60 ${
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
                placeholder="••••••••"
              />
              {passwordError ? (
                <p className="mt-1 text-xs text-red-400">{passwordError}</p>
              ) : null}
            </div>

            <div>
              <label className="text-sm text-white/70">
                Repetir contraseña
              </label>
              <input
                type="password"
                className={`mt-1 w-full rounded-xl bg-white/5 border px-4 py-3 outline-none focus:border-emerald-400/60 ${
                  confirmPasswordError ? 'border-red-500/70' : 'border-white/10'
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
                placeholder="••••••••"
              />
              {confirmPasswordError ? (
                <p className="mt-1 text-xs text-red-400">
                  {confirmPasswordError}
                </p>
              ) : null}
            </div>

            <button
              onClick={onSave}
              className="w-full rounded-xl py-3 font-semibold bg-emerald-500 hover:bg-emerald-400 text-black disabled:opacity-60"
              disabled={phase !== 'ready'}
            >
              Guardar contraseña
            </button>
          </div>
        ) : null}

        {phase === 'error' ? (
          <div className="mt-6">
            <button
              onClick={() => router.replace('/reset-password')}
              className="w-full rounded-xl py-3 text-sm border border-white/10 bg-white/5 hover:bg-white/10 text-white/80"
            >
              Volver a solicitar reset
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
