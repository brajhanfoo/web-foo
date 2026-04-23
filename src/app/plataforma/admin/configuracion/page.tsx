'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { getPasswordError } from '@/lib/validation/password'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type ProfileRow = {
  id: string
  email: string | null
  role: string | null
  profile_status: string | null

  first_name: string | null
  last_name: string | null
  country_residence: string | null
  whatsapp_e164: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  primary_role: string | null
  skills: string[] | null
  other_skills: string | null
  english_level: string | null
  document_number: string | null
  marketing_opt_in: boolean | null
}

function textOrEmpty(v: string | null | undefined) {
  return (v ?? '').trim()
}

function buildFullName(p: ProfileRow | null) {
  const a = textOrEmpty(p?.first_name)
  const b = textOrEmpty(p?.last_name)
  const s = `${a} ${b}`.trim()
  return s || 'Administrador'
}

function parseSkillsCsv(input: string): string[] | null {
  const parts = input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (!parts.length) return null

  // de-dup simple
  const uniq = Array.from(new Set(parts.map((x) => x.toLowerCase())))
  return uniq
}

function skillsToCsv(skills: string[] | null | undefined): string {
  return Array.isArray(skills) && skills.length ? skills.join(', ') : ''
}

export default function AdminSettingsPage() {
  const { showError, showSuccess } = useToastEnhanced()

  const [isBootLoading, setIsBootLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)

  // Perfil form
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const [country, setCountry] = useState('')
  const [primaryRole, setPrimaryRole] = useState('')
  const [englishLevel, setEnglishLevel] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [skillsCsv, setSkillsCsv] = useState('')
  const [otherSkills, setOtherSkills] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(true)

  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Seguridad form
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null)

  const showErrorRef = useRef(showError)
  useEffect(() => {
    showErrorRef.current = showError
  }, [showError])

  // Boot: user + profile
  useEffect(() => {
    let cancelled = false

    async function run() {
      setIsBootLoading(true)

      const { data: userRes, error: userErr } = await supabase.auth.getUser()
      if (cancelled) return

      if (userErr || !userRes.user) {
        setIsBootLoading(false)
        setUserId(null)
        setProfile(null)
        showErrorRef.current('No se pudo obtener la sesión', userErr?.message)
        return
      }

      const uid = userRes.user.id
      setUserId(uid)

      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select(
          [
            'id',
            'email',
            'role',
            'profile_status',
            'first_name',
            'last_name',
            'country_residence',
            'whatsapp_e164',
            'linkedin_url',
            'portfolio_url',
            'primary_role',
            'skills',
            'other_skills',
            'english_level',
            'document_number',
            'marketing_opt_in',
          ].join(',')
        )
        .eq('id', uid)
        .maybeSingle()

      if (cancelled) return

      if (profErr) {
        setIsBootLoading(false)
        setProfile(null)
        showErrorRef.current('No se pudo cargar el perfil', profErr.message)
        return
      }

      const next = (prof ?? null) as ProfileRow | null
      setProfile(next)

      // init form
      setFirstName(textOrEmpty(next?.first_name))
      setLastName(textOrEmpty(next?.last_name))
      setWhatsapp(textOrEmpty(next?.whatsapp_e164))
      setLinkedin(textOrEmpty(next?.linkedin_url))
      setPortfolio(textOrEmpty(next?.portfolio_url))
      setCountry(textOrEmpty(next?.country_residence))
      setPrimaryRole(textOrEmpty(next?.primary_role))
      setEnglishLevel(textOrEmpty(next?.english_level))
      setDocumentNumber(textOrEmpty(next?.document_number))
      setSkillsCsv(skillsToCsv(next?.skills ?? null))
      setOtherSkills(textOrEmpty(next?.other_skills))
      setMarketingOptIn(Boolean(next?.marketing_opt_in ?? true))

      setIsBootLoading(false)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const fullName = useMemo(() => buildFullName(profile), [profile])

  async function saveProfile() {
    if (!userId) return
    setIsSavingProfile(true)

    const payload = {
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      whatsapp_e164: whatsapp.trim() || null,
      linkedin_url: linkedin.trim() || null,
      portfolio_url: portfolio.trim() || null,
      country_residence: country.trim() || null,
      primary_role: primaryRole.trim() || null,
      english_level: englishLevel.trim() || null,
      document_number: documentNumber.trim() || null,
      skills: parseSkillsCsv(skillsCsv),
      other_skills: otherSkills.trim() || null,
      marketing_opt_in: Boolean(marketingOptIn),
    }

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)

    setIsSavingProfile(false)

    if (error) {
      showError('No se pudo guardar el perfil', 'Inténtalo nuevamente.')
      return
    }

    setProfile((prev) => (prev ? { ...prev, ...payload } : prev))
    showSuccess('Guardado', 'Se actualizó tu perfil.')
  }

  async function changePassword() {
    const p1 = newPassword.trim()
    const p2 = newPassword2.trim()

    const nextPasswordError = getPasswordError(p1)
    if (nextPasswordError) {
      setPasswordError(nextPasswordError)
      showError('Contrasena invalida', nextPasswordError)
      return
    }
    if (p1 !== p2) {
      setConfirmPasswordError('Las contraseñas no coinciden.')
      showError('No coincide', 'Las contraseñas no coinciden.')
      return
    }

    setIsSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: p1 })
    setIsSavingPassword(false)

    if (error) {
      showError('No se pudo cambiar la contraseña', 'Inténtalo nuevamente.')
      return
    }

    setNewPassword('')
    setNewPassword2('')
    setPasswordError(null)
    setConfirmPasswordError(null)
    showSuccess('Listo', 'Contraseña actualizada.')
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 md:px-6 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header estilo glass */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 backdrop-blur-md p-4 md:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-lg md:text-xl font-semibold text-slate-100">
                Configuración
              </div>
              <div className="text-xs md:text-sm text-slate-400 mt-1">
                Perfil y seguridad de tu cuenta
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-slate-800 text-slate-100 border border-slate-800">
                {profile?.primary_role ?? profile?.primary_role}
              </Badge>
              {profile?.profile_status ? (
                <Badge className="bg-emerald-500/10 text-emerald-200 border border-emerald-500/20">
                  {profile.profile_status === 'profile_complete'
                    ? 'Perfil completo'
                    : 'Perfil incompleto'}
                </Badge>
              ) : null}
            </div>
          </div>

          <Separator className="my-4 border-slate-800" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-slate-100 font-semibold truncate">
                {fullName}
              </div>
              <div className="text-xs text-slate-400 truncate">
                {profile?.email ?? '—'}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="bg-slate-900 border border-slate-800 backdrop-blur-md">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
          </TabsList>

          {/* PERFIL */}
          <TabsContent value="perfil" className="mt-4">
            <Card className="bg-slate-900 border-slate-800 backdrop-blur-md overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Datos de perfil</CardTitle>
                <div className="text-xs text-slate-400 mt-1">
                  Editá tu información dentro del panel.
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {isBootLoading ? (
                  <div className="text-sm text-slate-300">Cargando…</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-300">
                          Nombres
                        </Label>
                        <Input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-400"
                          placeholder="Ej: Alex"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-slate-300">
                          Apellidos
                        </Label>
                        <Input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-400"
                          placeholder="Ej: Morgan"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-slate-300">
                          Documento / ID
                        </Label>
                        <Input
                          value={documentNumber}
                          onChange={(e) => setDocumentNumber(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-400"
                          placeholder="1354480772"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-slate-300">
                          WhatsApp (E.164)
                        </Label>
                        <Input
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-400"
                          placeholder="+5939…"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-slate-300">
                          País / Ubicación
                        </Label>
                        <Input
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-400"
                          placeholder="Ecuador"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-slate-300">
                          Nivel de inglés
                        </Label>
                        <Input
                          value={englishLevel}
                          onChange={(e) => setEnglishLevel(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-400"
                          placeholder="B2 / C1 / Intermedio…"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs text-slate-300">
                          Rol principal
                        </Label>
                        <Input
                          value={primaryRole}
                          onChange={(e) => setPrimaryRole(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-400"
                          placeholder="Ej: Product Manager"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs text-slate-300">
                          Skills (separadas por coma)
                        </Label>
                        <Input
                          value={skillsCsv}
                          onChange={(e) => setSkillsCsv(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-400"
                          placeholder="react, next.js, tailwind, supabase"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs text-slate-300">
                          Otras habilidades
                        </Label>
                        <Input
                          value={otherSkills}
                          onChange={(e) => setOtherSkills(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-400"
                          placeholder="Ej: Liderazgo, comunicación…"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs text-slate-300">
                          LinkedIn
                        </Label>
                        <Input
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-400"
                          placeholder="https://linkedin.com/in/…"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs text-slate-300">
                          Portfolio
                        </Label>
                        <Input
                          value={portfolio}
                          onChange={(e) => setPortfolio(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-400"
                          placeholder="https://…"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs text-slate-300">Email</Label>
                        <Input
                          value={profile?.email ?? ''}
                          disabled
                          className="bg-slate-900 border-slate-800 text-slate-300"
                          placeholder="—"
                        />
                        <div className="text-xs text-slate-400">
                          *El email se administra desde Auth (no se edita aquí).
                        </div>
                      </div>

                      <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-100">
                            Marketing opt-in
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Acepto recibir novedades/actualizaciones.
                          </div>
                        </div>
                        <Switch
                          checked={marketingOptIn}
                          onCheckedChange={setMarketingOptIn}
                        />
                      </div>
                    </div>

                    <Separator className="border-slate-800" />

                    <div className="flex items-center justify-end gap-2">
                      <Button
                        className="bg-[#00CCA4] text-black hover:bg-[#00b695]"
                        onClick={saveProfile}
                        disabled={!userId || isSavingProfile}
                      >
                        {isSavingProfile ? 'Guardando…' : 'Guardar cambios'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEGURIDAD */}
          <TabsContent value="seguridad" className="mt-4">
            <Card className="bg-slate-900 border-slate-800 backdrop-blur-md overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Seguridad</CardTitle>
                <div className="text-xs text-slate-400 mt-1">
                  Actualizá tu contraseña.
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {isBootLoading ? (
                  <div className="text-sm text-slate-300">Cargando…</div>
                ) : (
                  <>
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                      <div className="text-sm font-semibold text-slate-100">
                        Cambiar contraseña
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Mínimo 8 caracteres.
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-300">
                            Nueva contraseña
                          </Label>
                          <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => {
                              const next = e.target.value
                              setNewPassword(next)
                              setPasswordError(getPasswordError(next))
                              setConfirmPasswordError(
                                newPassword2 && next !== newPassword2
                                  ? 'Las contraseñas no coinciden.'
                                  : null
                              )
                            }}
                            className={`bg-slate-900 text-slate-100 placeholder:text-slate-400 ${
                              passwordError
                                ? 'border-red-500/70'
                                : 'border-slate-800'
                            }`}
                            placeholder="********"
                          />
                          {passwordError ? (
                            <p className="text-xs text-red-400">
                              {passwordError}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-slate-300">
                            Repetir contraseña
                          </Label>
                          <Input
                            type="password"
                            value={newPassword2}
                            onChange={(e) => {
                              const next = e.target.value
                              setNewPassword2(next)
                              setConfirmPasswordError(
                                next && next !== newPassword
                                  ? 'Las contraseñas no coinciden.'
                                  : null
                              )
                            }}
                            className={`bg-slate-900 text-slate-100 placeholder:text-slate-400 ${
                              confirmPasswordError
                                ? 'border-red-500/70'
                                : 'border-slate-800'
                            }`}
                            placeholder="********"
                          />
                          {confirmPasswordError ? (
                            <p className="text-xs text-red-400">
                              {confirmPasswordError}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center justify-end mt-4">
                        <Button
                          className="bg-slate-900 text-black hover:bg-slate-900/90"
                          onClick={changePassword}
                          disabled={!userId || isSavingPassword}
                        >
                          {isSavingPassword
                            ? 'Actualizando…'
                            : 'Actualizar contraseña'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
