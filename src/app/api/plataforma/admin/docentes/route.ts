import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'

import { sendTransactionalEmail } from '@/lib/platform/email'
import { touchPlatformActivity } from '@/lib/platform/activity'
import { isAdminRole, requirePlatformProfile } from '@/lib/platform/security'
import { supabaseAdmin } from '@/lib/supabase/admin'

type CreateDocenteBody = {
  email?: string
  first_name?: string
  last_name?: string
  professional_area_id?: string | null
  is_active?: boolean
  temporary_password?: string
}

function sanitizeText(value: unknown, max = 120): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max)
}

function generateTemporaryPassword(): string {
  const token = randomBytes(6).toString('hex')
  return `Tmp#${token}A1`
}

export async function GET() {
  const auth = await requirePlatformProfile()
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status }
    )
  }

  if (!isAdminRole(auth.profile.role)) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos.' },
      { status: 403 }
    )
  }

  const [areasRes, docentesRes, assignmentsRes, teamsRes] = await Promise.all([
    supabaseAdmin
      .from('professional_areas')
      .select('id, code, name, is_active')
      .order('name', { ascending: true }),
    supabaseAdmin
      .from('profiles')
      .select(
        'id, email, first_name, last_name, is_active, role, professional_area_id, password_reset_required, created_at, last_login_at'
      )
      .eq('role', 'docente')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('docente_team_assignments')
      .select('id, docente_profile_id, team_id, is_active, created_at')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('program_edition_teams')
      .select(
        'id, name, edition_id, edition:program_editions(id, edition_name, program_id, program:programs(id, title))'
      )
      .order('name', { ascending: true }),
  ])

  if (
    areasRes.error ||
    docentesRes.error ||
    assignmentsRes.error ||
    teamsRes.error
  ) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo cargar la data de docentes.' },
      { status: 400 }
    )
  }

  const counts = new Map<string, number>()
  for (const row of assignmentsRes.data ?? []) {
    if (!row.is_active) continue
    const key = row.docente_profile_id
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const docentes = (docentesRes.data ?? []).map((row) => ({
    ...row,
    active_assignments_count: counts.get(row.id) ?? 0,
  }))

  await touchPlatformActivity({
    userId: auth.profile.id,
    activityType: 'admin_docentes_view',
    route: '/plataforma/admin/docentes',
  })

  return NextResponse.json({
    ok: true,
    docentes,
    professional_areas: areasRes.data ?? [],
    assignments: assignmentsRes.data ?? [],
    teams: teamsRes.data ?? [],
  })
}

export async function POST(request: Request) {
  const auth = await requirePlatformProfile()
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status }
    )
  }

  if (!isAdminRole(auth.profile.role)) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos.' },
      { status: 403 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as CreateDocenteBody
  const email = sanitizeText(body.email, 180).toLowerCase()
  const firstName = sanitizeText(body.first_name, 80)
  const lastName = sanitizeText(body.last_name, 80)
  const professionalAreaId = sanitizeText(body.professional_area_id, 64) || null
  const temporaryPassword =
    sanitizeText(body.temporary_password, 80) || generateTemporaryPassword()

  if (!email || !email.includes('@')) {
    return NextResponse.json(
      { ok: false, message: 'Email inválido.' },
      { status: 400 }
    )
  }

  if (!firstName || !lastName) {
    return NextResponse.json(
      { ok: false, message: 'Nombres y apellidos son obligatorios.' },
      { status: 400 }
    )
  }

  const { data: authUserRes, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    })

  if (createError || !authUserRes.user?.id) {
    return NextResponse.json(
      {
        ok: false,
        message:
          createError?.message ??
          'No se pudo crear el usuario docente en autenticación.',
      },
      { status: 400 }
    )
  }

  const docenteId = authUserRes.user.id
  const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
    {
      id: docenteId,
      email,
      first_name: firstName,
      last_name: lastName,
      role: 'docente',
      is_active: body.is_active !== false,
      professional_area_id: professionalAreaId,
      password_reset_required: true,
      last_login_at: null,
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Se creó auth user, pero falló el perfil docente.',
      },
      { status: 400 }
    )
  }

  await sendTransactionalEmail({
    to: [email],
    subject: 'Acceso docente | Foo Talent Group',
    text: [
      `Hola ${firstName},`,
      'Tu cuenta de docente fue creada por el equipo de administración.',
      `Email: ${email}`,
      `Contraseña temporal: ${temporaryPassword}`,
      'En tu primer ingreso deberás cambiar la contraseña obligatoriamente.',
    ].join('\n'),
  })

  await touchPlatformActivity({
    userId: auth.profile.id,
    activityType: 'admin_docente_created',
    route: '/plataforma/admin/docentes',
    metadata: { docente_id: docenteId },
  })

  return NextResponse.json({
    ok: true,
    docente_id: docenteId,
    temporary_password: temporaryPassword,
  })
}

