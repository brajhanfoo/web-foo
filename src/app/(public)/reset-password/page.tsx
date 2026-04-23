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
    <div className="relative min-h-screen bg-black flex items-center justify-center px-4 overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,#77039F22,transparent_40%),radial-gradient(circle_at_80%_70%,#00CCA422,transparent_40%)] pointer-events-none" />

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-14 items-center">
        {/* Panel izquierdo */}
        <div className="hidden lg:flex flex-col justify-center text-white">
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Recupera tu <span className="text-[#00CCA4]">acceso</span>.
          </h1>

          <p className="mt-6 max-w-xl text-lg text-white/60 leading-relaxed">
            Restablece tu contraseña de forma segura y continúa tu evolución
            profesional. Te enviaremos un enlace para crear una nueva contraseña
            y retomar tu camino.
          </p>

          <div className="mt-12 max-w-md rounded-2xl border border-[#77039F]/30 bg-gradient-to-br from-[#77039F]/20 to-transparent p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#77039F]/30 border border-[#77039F]/40">
                <HiOutlineShieldCheck className="text-[#BDBE0B] text-xl" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">
                  Acceso Seguro
                </h3>
                <p className="mt-1 text-sm text-white/60">
                  Enlaces de un solo uso y tiempo limitado.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="rounded-3xl border border-[#77039F]/30 bg-[#0D0D0D] p-8 shadow-[0_0_60px_#77039F20] backdrop-blur-xl">
          <h2 className="text-2xl font-semibold text-white">
            ¿Olvidaste tu contraseña?
          </h2>

          <p className="mt-2 text-sm text-white/50">
            Ingresa el correo electrónico asociado a tu cuenta y te enviaremos
            un enlace para restablecerla.
          </p>

          <div className="mt-8 space-y-5">
            <input
              type="email"
              className="w-full rounded-xl bg-black border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#77039F] focus:ring-2 focus:ring-[#77039F]/40 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />

            <button
              onClick={send}
              className="w-full rounded-xl py-3 font-semibold text-black bg-[#00CCA4] hover:bg-[#00E0B3] transition shadow-[0_0_25px_#00CCA455] cursor-pointer"
            >
              Enviar enlace de recuperación
            </button>

            {msg && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                {msg}
              </div>
            )}

            <div className="pt-6 border-t border-white/10 text-center">
              <button
                onClick={() => history.back()}
                className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-[#00CCA4] transition cursor-pointer"
              >
                <HiArrowLeft className="text-base" />
                Volver a Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
