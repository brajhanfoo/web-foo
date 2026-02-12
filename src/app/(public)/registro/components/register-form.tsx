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
      <Card className="rounded-2xl border border-emerald-400/20 bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(0,204,164,0.12),0_20px_60px_rgba(0,0,0,0.65)] text-white">
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
              <div className="space-y-2">
                <Label htmlFor={firstNameId} className="text-white/70 text-sm">
                  Nombre
                </Label>
                <Input
                  id={firstNameId}
                  className="h-11 rounded-xl bg-black/30 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-emerald-400/60"
                  placeholder="Nombre"
                  value={registerFormState.firstName}
                  onChange={(event) =>
                    updateRegisterFormField('firstName', event.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={lastNameId} className="text-white/70 text-sm">
                  Apellido
                </Label>
                <Input
                  id={lastNameId}
                  className="h-11 rounded-xl bg-black/30 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-emerald-400/60"
                  placeholder="Apellido"
                  value={registerFormState.lastName}
                  onChange={(event) =>
                    updateRegisterFormField('lastName', event.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={emailId} className="text-white/70 text-sm">
                Email
              </Label>
              <Input
                id={emailId}
                type="email"
                className="h-11 rounded-xl bg-black/30 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-emerald-400/60"
                placeholder="tu@email.com"
                value={registerFormState.email}
                onChange={(event) =>
                  updateRegisterFormField('email', event.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={passwordId} className="text-white/70 text-sm">
                Contraseña
              </Label>
              <Input
                id={passwordId}
                type="password"
                className={`h-11 rounded-xl bg-black/30 border text-white placeholder:text-white/40 focus-visible:ring-emerald-400/60 ${
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
            </div>

            <div className="space-y-2">
              <Label
                htmlFor={confirmPasswordId}
                className="text-white/70 text-sm"
              >
                Confirmación de contraseña
              </Label>
              <Input
                id={confirmPasswordId}
                type="password"
                className={`h-11 rounded-xl bg-black/30 border text-white placeholder:text-white/40 focus-visible:ring-emerald-400/60 ${
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
            </div>

            <div className="flex items-start gap-2 text-sm text-white/70">
              <Checkbox
                id={termsId}
                checked={registerFormState.hasAcceptedTerms}
                onCheckedChange={(checked) =>
                  updateRegisterFormField('hasAcceptedTerms', checked === true)
                }
                className="mt-1 border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-black"
              />
              <Label htmlFor={termsId} className="leading-relaxed">
                He leído y acepto los{' '}
                <a
                  href="/terminos-y-condiciones"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 underline hover:text-emerald-300"
                >
                  Términos y condiciones
                </a>
                .
              </Label>
            </div>

            <div className="flex items-start gap-2 text-sm text-white/70">
              <Checkbox
                id={marketingId}
                checked={registerFormState.marketingOptIn}
                onCheckedChange={(checked) =>
                  updateRegisterFormField('marketingOptIn', checked === true)
                }
                className="mt-1 border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-black"
              />
              <Label htmlFor={marketingId} className="leading-relaxed">
                Quiero recibir comunicaciones y novedades de marketing.
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400"
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/ingresar')}
              className="w-full text-sm text-white/70 hover:text-white hover:bg-white/5"
            >
              ¿Ya tienes cuenta? <span className="underline">Ingresar</span>
            </Button>

            <p className="text-[11px] text-white/45">
              Al registrarte, aceptas nuestras políticas y términos.
            </p>
          </form>
        </div>
      </Card>
    </div>
  )
}
