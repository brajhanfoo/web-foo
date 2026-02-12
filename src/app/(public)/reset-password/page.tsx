'use client'

import { useState } from 'react'

const GENERIC_MESSAGE =
  'Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.'

function formatRetryMinutes(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  if (minutes >= 60) {
    const hours = Math.ceil(minutes / 60)
    return hours === 1 ? '1 hora' : `${hours} horas`
  }
  return minutes === 1 ? '1 minuto' : `${minutes} minutos`
}

type ResetPasswordResponse =
  | { success: true; message?: string }
  | { success: false; retry_after_seconds?: number }

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  async function send() {
    setMsg(null)

    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const payload = (await response
      .json()
      .catch(() => null)) as ResetPasswordResponse | null

    if (response.status === 429) {
      const retryAfter =
        payload && !payload.success
          ? Number(payload.retry_after_seconds ?? 60)
          : 60
      setMsg(
        `Demasiados intentos. Intenta nuevamente en ${formatRetryMinutes(
          retryAfter
        )}.`
      )
      return
    }

    setMsg(
      payload && payload.success && payload.message
        ? payload.message
        : GENERIC_MESSAGE
    )
  }

  return (
    <div className="bg-black min-h-screen flex items-center justify-center">
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
