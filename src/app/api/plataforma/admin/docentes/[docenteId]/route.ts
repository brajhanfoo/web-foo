import { NextResponse } from 'next/server'

import { touchPlatformActivity } from '@/lib/platform/activity'
import { isAdminRole, requirePlatformProfile } from '@/lib/platform/security'
import { supabaseAdmin } from '@/lib/supabase/admin'

type UpdateDocenteBody = {
  first_name?: string
  last_name?: string
  professional_area_id?: string | null
  is_active?: boolean
  password_reset_required?: boolean
}

function sanitizeText(value: unknown, max = 120): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max)
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ docenteId?: string }> }
) {
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

  const { docenteId } = await context.params
  const targetId = sanitizeText(docenteId, 80)
  if (!targetId) {
    return NextResponse.json(
      { ok: false, message: 'docenteId inválido.' },
      { status: 400 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as UpdateDocenteBody
  const patch: Record<string, unknown> = {}

  if (typeof body.first_name === 'string') {
    patch.first_name = sanitizeText(body.first_name, 80) || null
  }
  if (typeof body.last_name === 'string') {
    patch.last_name = sanitizeText(body.last_name, 80) || null
  }
  if (Object.prototype.hasOwnProperty.call(body, 'professional_area_id')) {
    patch.professional_area_id =
      sanitizeText(body.professional_area_id, 80) || null
  }
  if (typeof body.is_active === 'boolean') {
    patch.is_active = body.is_active
  }
  if (typeof body.password_reset_required === 'boolean') {
    patch.password_reset_required = body.password_reset_required
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json(
      { ok: false, message: 'No hay cambios para guardar.' },
      { status: 400 }
    )
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(patch)
    .eq('id', targetId)
    .eq('role', 'docente')

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'No se pudo actualizar el docente.' },
      { status: 400 }
    )
  }

  await touchPlatformActivity({
    userId: auth.profile.id,
    activityType: 'admin_docente_updated',
    route: '/plataforma/admin/docentes',
    metadata: { docente_id: targetId },
  })

  return NextResponse.json({ ok: true })
}

