'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getErrorMessage } from '@/types/error'
import { getPasswordError } from '@/lib/validation/password'

import { useToastEnhanced } from '@/hooks/use-toast-enhanced'

const CURRENT_TERMS_VERSION = '2026-01-19'

type RegisterFormState = {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  hasAcceptedTerms: boolean
  marketingOptIn: boolean
}

export function RegisterForm() {
  const router = useRouter()
  const { showError, showSuccess } = useToastEnhanced()

  const [registerFormState, setRegisterFormState] = useState<RegisterFormState>(
    {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      hasAcceptedTerms: false,
      marketingOptIn: false,
    }
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null)

  function updateRegisterFormField<K extends keyof RegisterFormState>(
    fieldName: K,
    fieldValue: RegisterFormState[K]
  ) {
    setRegisterFormState((previousState) => ({
      ...previousState,
      [fieldName]: fieldValue,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const passwordError = getPasswordError(registerFormState.password)
    if (passwordError) {
      setPasswordError(passwordError)
      showError('Contrasena invalida', passwordError)
      return
    }

    if (registerFormState.password !== registerFormState.confirmPassword) {
      setConfirmPasswordError('Las contraseñas no coinciden.')
      showError('Las contraseñas no coinciden', 'Revisa la confirmación.')
      return
    }

    if (!registerFormState.hasAcceptedTerms) {
      showError(
        'Debes aceptar los terminos',
        'Marca el checkbox para continuar.'
      )
      return
    }

    setPasswordError(null)
    setConfirmPasswordError(null)
    setIsSubmitting(true)

    try {
      const emailRedirectUrl = `${window.location.origin}/auth/confirm?next=/plataforma`

      const { error: signUpError } = await supabase.auth.signUp({
        email: registerFormState.email,
        password: registerFormState.password,
        options: {
          emailRedirectTo: emailRedirectUrl,
          data: {
            // Para UI/Nombre
            first_name: registerFormState.firstName,
            last_name: registerFormState.lastName,
            terms_accepted_at: new Date().toISOString(),
            terms_version: CURRENT_TERMS_VERSION,
            marketing_opt_in: registerFormState.marketingOptIn,
          },
        },
      })

      if (signUpError) throw signUpError

      showSuccess(
        'Cuenta creada',
        'Revisa tu correo para verificar tu email y luego inicia sesión.'
      )

      // Opcional: llevar a /ingresar
      router.push('/ingresar')
    } catch (error: unknown) {
      showError('No se pudo crear la cuenta', getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-emerald-400/20 bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(0,204,164,0.12),0_20px_60px_rgba(0,0,0,0.65)]">
        <div className="p-6 md:p-7">
          <h2 className="text-lg font-semibold text-white">
            Comienza tu entrenamiento
          </h2>
          <p className="mt-1 text-sm text-white/60">
            Regístrate para acceder a la plataforma.
          </p>

          <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-white/80">
            <span className="font-medium text-emerald-300">Importante:</span>{' '}
            Completa tus datos reales. Luego podrás completar tu perfil
            profesional.
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-emerald-400/60 placeholder:text-white/40"
                placeholder="Nombre"
                value={registerFormState.firstName}
                onChange={(event) =>
                  updateRegisterFormField('firstName', event.target.value)
                }
                required
              />
              <input
                className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-emerald-400/60 placeholder:text-white/40"
                placeholder="Apellido"
                value={registerFormState.lastName}
                onChange={(event) =>
                  updateRegisterFormField('lastName', event.target.value)
                }
                required
              />
            </div>

            <input
              type="email"
              className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-emerald-400/60 placeholder:text-white/40"
              placeholder="Email"
              value={registerFormState.email}
              onChange={(event) =>
                updateRegisterFormField('email', event.target.value)
              }
              required
            />

            <input
              type="password"
              className={`w-full rounded-xl bg-black/30 border px-4 py-3 text-white outline-none focus:border-emerald-400/60 placeholder:text-white/40 ${
                passwordError ? 'border-red-500/70' : 'border-white/10'
              }`}
              placeholder="Contraseña"
              value={registerFormState.password}
              onChange={(event) => {
                const next = event.target.value
                updateRegisterFormField('password', next)
                setPasswordError(getPasswordError(next))
                setConfirmPasswordError(
                  registerFormState.confirmPassword &&
                    next !== registerFormState.confirmPassword
                    ? 'Las contraseñas no coinciden.'
                    : null
                )
              }}
              required
            />
            {passwordError ? (
              <p className="text-xs text-red-400">{passwordError}</p>
            ) : null}

            <input
              type="password"
              className={`w-full rounded-xl bg-black/30 border px-4 py-3 text-white outline-none focus:border-emerald-400/60 placeholder:text-white/40 ${
                confirmPasswordError ? 'border-red-500/70' : 'border-white/10'
              }`}
              placeholder="Confirmación de contraseña"
              value={registerFormState.confirmPassword}
              onChange={(event) => {
                const next = event.target.value
                updateRegisterFormField('confirmPassword', next)
                setConfirmPasswordError(
                  next && next !== registerFormState.password
                    ? 'Las contraseñas no coinciden.'
                    : null
                )
              }}
              required
            />
            {confirmPasswordError ? (
              <p className="text-xs text-red-400">{confirmPasswordError}</p>
            ) : null}

            <label className="flex items-start gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                className="mt-1"
                checked={registerFormState.hasAcceptedTerms}
                onChange={(event) =>
                  updateRegisterFormField(
                    'hasAcceptedTerms',
                    event.target.checked
                  )
                }
              />
              <span>
                He leido y acepto los{' '}
                <a
                  href="/terminos-y-condiciones"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 underline hover:text-emerald-300"
                >
                  Terminos y condiciones
                </a>
                .
              </span>
            </label>

            <label className="flex items-start gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                className="mt-1"
                checked={registerFormState.marketingOptIn}
                onChange={(event) =>
                  updateRegisterFormField(
                    'marketingOptIn',
                    event.target.checked
                  )
                }
              />
              <span>
                Quiero recibir comunicaciones y novedades de marketing.
              </span>
            </label>

            <button
              disabled={isSubmitting}
              className="w-full rounded-xl py-3 font-semibold text-black bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60"
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/ingresar')}
              className="w-full text-sm text-white/70 hover:text-white"
            >
              ¿Ya tienes cuenta? <span className="underline">Ingresar</span>
            </button>

            <p className="text-[11px] text-white/45">
              Al registrarte, aceptas nuestras políticas y términos.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
