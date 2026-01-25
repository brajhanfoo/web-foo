'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const redirectTo = sp.get('redirectTo') || '/plataforma'

  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    // si ya está logueado, adentro
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(redirectTo)
    })
    // deps estables: redirectTo cambia solo por URL, está bien
  }, [router, redirectTo])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      })
      if (error) throw error

      // Bloqueo si email no verificado (PRD)
      if (data.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut()
        setMsg('Debes verificar tu email antes de ingresar.')
        return
      }

      router.replace(redirectTo)
    } catch (err: any) {
      setMsg(err?.message ?? 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  async function resendVerification() {
    setMsg(null)
    if (!email) {
      setMsg('Ingresa tu email para reenviar verificación.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      if (error) throw error
      setMsg('Listo. Revisa tu correo para verificar tu cuenta.')
    } catch (err: any) {
      setMsg(err?.message ?? 'No se pudo reenviar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 bg-black">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-stretch">
        <div className="hidden md:flex flex-col justify-center rounded-2xl p-8 bg-white/5 border border-white/10">
          <h1 className="text-3xl font-semibold text-amber-50">
            Impulsa tu <span className="text-emerald-400">carrera tech</span>.
          </h1>
          <p className="mt-3 text-white/70">
            Ingresa a tu espacio de trabajo y continúa tu evolución profesional.
          </p>
          <div className="mt-6 text-sm text-white/70">
            ✨ Acceso inmediato · Mentorías · Programas · Red de contactos
          </div>
        </div>

        <div className="rounded-2xl p-6 md:p-8 bg-black/40 border border-white/10 backdrop-blur">
          <h2 className="text-xl font-semibold">Bienvenido de nuevo</h2>
          <p className="text-white/60 text-sm mt-1">
            Ingresa tus credenciales para acceder.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-white/70">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-emerald-400/60"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="text-sm text-white/70">Contraseña</label>
              <input
                type="password"
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-emerald-400/60"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                required
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  className="text-xs text-white/60 hover:text-white underline"
                  onClick={() => router.push('/reset-password')}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            {msg && (
              <div className="text-sm text-white/80 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                {msg}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl py-3 font-semibold bg-emerald-500 hover:bg-emerald-400 text-black disabled:opacity-60"
            >
              {loading ? 'Iniciando...' : 'Iniciar sesión'}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={resendVerification}
              className="w-full rounded-xl py-3 text-sm border border-white/10 bg-white/5 hover:bg-white/10 text-white/80"
            >
              Reenviar verificación de email
            </button>

            <button
              type="button"
              onClick={() => router.push('/registro')}
              className="w-full text-sm text-white/70 hover:text-white"
            >
              ¿No tienes cuenta? <span className="underline">Regístrate</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
