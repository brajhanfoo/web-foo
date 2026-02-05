'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  async function send() {
    setMsg(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/confirm?next=/update-password`,
    })

    if (error) {
      setMsg(error.message)
    } else {
      setMsg('Te enviamos un correo para restablecer tu contraseña.')
    }
  }

  return (
    <div className="bg-black min-h-screen flex items-center justify-center">
      {' '}
      <div className="p-6 max-w-md mx-auto bg-gray-900 rounded-3xl text-amber-50">
        <h1 className="text-xl font-semibold">Recuperar contraseña</h1>

        <input
          className="mt-4 w-full border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
        />

        <button onClick={send} className="mt-4 border px-4 py-2">
          Enviar correo
        </button>

        {msg && <p className="mt-3 text-sm">{msg}</p>}
      </div>
    </div>
  )
}
