'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getSiteUrl } from '@/lib/site-url'
import { getPasswordError } from '@/lib/validation/password'

import { mapSupabaseAuthErrorToEs } from '@/lib/supabase/auth-errors'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BsExclamationCircle } from "react-icons/bs"
import { HiEye, HiEyeSlash } from "react-icons/hi2";





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

  const firstNameId = useId()
  const lastNameId = useId()
  const emailId = useId()
  const passwordId = useId()
  const confirmPasswordId = useId()
  const termsId = useId()
  const marketingId = useId()

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

    const nextPasswordError = getPasswordError(registerFormState.password)
    if (nextPasswordError) {
      setPasswordError(nextPasswordError)
      showError('Contraseña inválida', nextPasswordError)
      return
    }

    if (registerFormState.password !== registerFormState.confirmPassword) {
      setConfirmPasswordError('Las contraseñas no coinciden.')
      showError('Las contraseñas no coinciden', 'Revisa la confirmación.')
      return
    }

    if (!registerFormState.hasAcceptedTerms) {
      showError(
        'Debes aceptar los términos',
        'Marca el checkbox para continuar.'
      )
      return
    }

    setPasswordError(null)
    setConfirmPasswordError(null)
    setIsSubmitting(true)

    try {
      const siteUrl = getSiteUrl()
      if (!siteUrl) {
        showError(
          'Falta configurar la URL del sitio',
          'Define NEXT_PUBLIC_SITE_URL.'
        )
        return
      }

      const emailRedirectUrl = `${siteUrl}/auth/confirm?next=/plataforma`

      const { data, error } = await supabase.auth.signUp({
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

      if (error) {
        const mapped = mapSupabaseAuthErrorToEs(error, 'signup')
        showError(mapped.title, mapped.description)
        return
      }

      if (data.user && !data.session) {
        showSuccess(
          'Revisa tu correo',
          'Te enviamos un enlace para confirmar tu cuenta.'
        )
        router.push('/ingresar')
        return
      }

      showSuccess('Cuenta creada', 'Ya puedes ingresar a la plataforma.')
      router.push('/plataforma')
    } catch (error: unknown) {
      const mapped = mapSupabaseAuthErrorToEs(error, 'signup')
      showError(mapped.title, mapped.description)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <Card className="rounded-3xl border border-[#77039F]/30 bg-[#0D0D0D] backdrop-blur-xl shadow-[0_0_60px_#77039F20] text-white">
        <div className="p-7">

          <h2 className="text-xl font-semibold">
            Comienza tu entrenamiento
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Regístrate para acceder a la plataforma.
          </p>

          {/* Alert */}
          <div className="mt-6 flex gap-4 rounded-2xl border border-[#BDBE0B]/40 bg-[#BDBE0B]/10 px-4 py-4 text-sm">
            <BsExclamationCircle className="text-[#BDBE0B] text-2xl mt-1" />
            <div className="text-white/70">
              <span className="font-semibold text-[#BDBE0B]">
                Importante:
              </span>{" "}
              Para postular a programas, deberás completar tu perfil profesional
              después de registrarte.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">

            {/* Nombre / Apellido */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                id={firstNameId}
                placeholder="Nombre"
                className="h-11 rounded-xl bg-black border border-white/10 text-white placeholder:text-white/30 focus:border-[#77039F] focus:ring-2 focus:ring-[#77039F]/40 transition"
                value={registerFormState.firstName}
                onChange={(e) =>
                  updateRegisterFormField('firstName', e.target.value)
                }
                required
              />
              <Input
                id={lastNameId}
                placeholder="Apellido"
                className="h-11 rounded-xl bg-black border border-white/10 text-white placeholder:text-white/30 focus:border-[#77039F] focus:ring-2 focus:ring-[#77039F]/40 transition"
                value={registerFormState.lastName}
                onChange={(e) =>
                  updateRegisterFormField('lastName', e.target.value)
                }
                required
              />
            </div>

            {/* Email */}
            <Input
              id={emailId}
              type="email"
              placeholder="tu@email.com"
              className="h-11 rounded-xl bg-black border border-white/10 text-white placeholder:text-white/30 focus:border-[#77039F] focus:ring-2 focus:ring-[#77039F]/40 transition"
              value={registerFormState.email}
              onChange={(e) =>
                updateRegisterFormField('email', e.target.value)
              }
              required
            />

            {/* Password */}
            <div className="relative">
              <Input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                className={`h-11 rounded-xl bg-black border pr-12 text-white placeholder:text-white/30 focus:border-[#77039F] focus:ring-2 focus:ring-[#77039F]/40 transition ${passwordError ? "border-red-500/70" : "border-white/10"
                  }`}
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

              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute inset-y-0 right-4 flex items-center text-white/40 hover:text-[#00CCA4] transition cursor-pointer"
              >
                {showPassword ? <HiEyeSlash /> : <HiEye />}
              </button>
            </div>

            {passwordError && (
              <p className="text-xs text-red-400">{passwordError}</p>
            )}

            {/* Confirm Password */}
            <div className="relative">
              <Input
                id={confirmPasswordId}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirmación de contraseña"
                className={`h-11 rounded-xl bg-black border pr-12 text-white placeholder:text-white/30 focus:border-[#77039F] focus:ring-2 focus:ring-[#77039F]/40 transition ${confirmPasswordError ? "border-red-500/70" : "border-white/10"
                  }`}
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

              <button
                type="button"
                onClick={() => setShowConfirmPassword(prev => !prev)}
                className="absolute inset-y-0 right-4 flex items-center text-white/40 hover:text-[#00CCA4] transition cursor-pointer"
              >
                {showConfirmPassword ? <HiEyeSlash /> : <HiEye />}
              </button>
            </div>

            {confirmPasswordError && (
              <p className="text-xs text-red-400">{confirmPasswordError}</p>
            )}

            {/* Terms */}
            <div className="flex items-start gap-3 text-sm text-white/70">
              <Checkbox
                id={termsId}
                checked={registerFormState.hasAcceptedTerms}
                onCheckedChange={(checked) =>
                  updateRegisterFormField('hasAcceptedTerms', checked === true)
                }
                className="mt-1 border-white/20 data-[state=checked]:bg-[#00CCA4] data-[state=checked]:text-black"
              />
              <Label htmlFor={termsId} className="leading-relaxed">
                He leído y acepto los{" "}
                <a
                  href="/terminos-y-condiciones"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00CCA4] hover:underline"
                >
                  Términos y condiciones
                </a>.
              </Label>
            </div>

            {/* Marketing */}
            <div className="flex items-start gap-3 text-sm text-white/70">
              <Checkbox
                id={marketingId}
                checked={registerFormState.marketingOptIn}
                onCheckedChange={(checked) =>
                  updateRegisterFormField('marketingOptIn', checked === true)
                }
                className="mt-1 border-white/20 data-[state=checked]:bg-[#00CCA4] data-[state=checked]:text-black"
              />
              <Label htmlFor={marketingId} className="leading-relaxed">
                Quiero recibir comunicaciones y novedades.
              </Label>
            </div>

            {/* CTA */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl font-semibold text-black bg-[#00CCA4] hover:bg-[#00E0B3] transition shadow-[0_0_25px_#00CCA455] cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/ingresar')}
              className="w-full text-sm text-white/50 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              ¿Ya tienes cuenta? <span className="underline text-[#BDBE0B]">Ingresar</span>
            </Button>

            <p className="text-[11px] text-white/40 text-center">
              Al crear tu cuenta, aceptas nuestros términos y políticas.
            </p>

          </form>
        </div>
      </Card>
    </div>
  )
}
