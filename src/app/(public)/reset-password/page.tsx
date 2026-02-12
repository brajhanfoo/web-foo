'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getSiteUrl } from '@/lib/site-url'
import { HiOutlineShieldCheck, HiArrowLeft } from 'react-icons/hi2'

const GENERIC_MESSAGE =
  'Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  async function send() {
    setMsg(null)

    const siteUrl = getSiteUrl()
    if (!siteUrl) {
      setMsg('Configura NEXT_PUBLIC_SITE_URL en el entorno.')
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/api/auth/confirm?next=/update-password`,
    })

    if (error) {
      // No revelamos si el correo existe para evitar enumeración.
      setMsg(GENERIC_MESSAGE)
      return
    }

    setMsg(GENERIC_MESSAGE)
  }

  return (
 <div className="min-h-screen bg-black flex items-center justify-center px-4">
    <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
      
      {/* Panel izquierdo */}
      <div className="hidden lg:flex flex-col justify-center">
        <h1 className="text-5xl font-bold leading-tight tracking-tight text-white">
          Recupera tu{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
            acceso
          </span>
          .
        </h1>

        <p className="mt-6 max-w-xl text-lg text-gray-400 leading-relaxed">
          Restablece tu contraseña de forma segura y continúa tu evolución
          profesional. Te enviaremos un enlace para crear una nueva contraseña
          y retomar tu camino.
        </p>

        <div className="mt-10 max-w-md rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent p-5 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
              <HiOutlineShieldCheck className="text-purple-400 text-xl" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">
                Acceso Seguro
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Enlaces de un solo uso y tiempo limitado.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="relative rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-transparent to-purple-500/10 p-[1px] shadow-[0_0_40px_rgba(16,185,129,0.15)]">
        <div className="rounded-3xl bg-black/70 backdrop-blur-xl p-8">
          <h2 className="text-2xl font-semibold text-white">
            ¿Olvidaste tu contraseña?
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Ingresa el correo electrónico asociado a tu cuenta y te enviaremos
            un enlace para restablecerla.
          </p>

          <div className="mt-8 space-y-5">
            <input
              type="email"
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />

            <button
              onClick={send}
              className="w-full rounded-xl py-3 font-semibold text-black bg-[#00CCA4] hover:opacity-90 transition cursor-pointer"
            >
              Enviar enlace de recuperación
            </button>

            {msg && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
                {msg}
              </div>
            )}

            <div className="pt-4 border-t border-white/10 text-center">
              <button
                onClick={() => history.back()}
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition cursor-pointer"
              >
                <HiArrowLeft className="text-base" />
                Volver a Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}
