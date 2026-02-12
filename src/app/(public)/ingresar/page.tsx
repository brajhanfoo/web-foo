'use client'
import { HiRocketLaunch, HiEye, HiEyeSlash } from 'react-icons/hi2'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/plataforma'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(redirectTo)
    })
  }, [router, redirectTo])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      if (data.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut()
        setMessage('Debes verificar tu correo antes de ingresar.')
        return
      }

      router.replace(redirectTo)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'No se pudo iniciar sesión.'
      setMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // async function resendVerification() {
  //   setMessage(null)
  //   if (!email) {
  //     setMessage('Ingresa tu email para reenviar la verificación.')
  //     return
  //   }
  //   setLoading(true)
  //   try {
  //     const { error } = await supabase.auth.resend({
  //       type: 'signup',
  //       email,
  //     })
  //     if (error) throw error
  //     setMessage('Te enviamos un correo para verificar tu cuenta.')
  //   } catch (error: unknown) {
  //     const errorMessage =
  //       error instanceof Error ? error.message : 'No se pudo reenviar.'
  //     setMessage(errorMessage)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-black px-4 flex items-center justify-center">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-10">
        {/* Panel izquierdo */}
        <div className="hidden md:flex flex-col justify-center">
          <h1 className="text-5xl font-bold tracking-tight text-white leading-tight">
            Impulsa tu{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
              carrera tech
            </span>
            .
          </h1>

          <p className="mt-6 max-w-lg text-lg text-gray-400 leading-relaxed">
            Ingresa a tu espacio de trabajo y continúa tu evolución profesional.
            Accede a tu perfil, mentorías y red de contactos.
          </p>

          <div className="mt-10 max-w-xl rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent p-5 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
                <HiRocketLaunch className="text-purple-400 text-xl" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">
                  Acceso Inmediato
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  Retoma tu aprendizaje donde lo dejaste.
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* Panel derecho */}
        <div className="relative rounded-3xl p-8 md:p-10 bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
          <h2 className="text-2xl font-semibold text-white">
            Te damos la bienvenida
          </h2>
          <p className="mt-1 text-sm text-white/60">
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="text-sm text-white/70">Correo electrónico</label>
              <input
                type="email"
                className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            <div>
              <label className="text-sm text-white/70">Contraseña</label>

              <div className="relative mt-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 pr-12 text-white placeholder:text-white/30 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
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

              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => router.push('/reset-password')}
                  className="text-xs text-white/50 hover:text-emerald-400 transition cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            {message && (
              <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/80">
                {message}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl py-3 font-semibold text-black bg-[#00CCA4] hover:opacity-90 transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </button>

            {/* <button
              type="button"
              disabled={loading}
              onClick={resendVerification}
              className="w-full rounded-xl py-3 text-sm text-white/70 border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              Reenviar verificación de correo
            </button> */}

            <div className="pt-2 text-center text-sm text-white/60">
              ¿Aún no tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => router.push('/registro')}
                className="text-emerald-400 hover:underline cursor-pointer transition"
              >
                Regístrate
              </button>
            </div>
          </form>
        </div>
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
