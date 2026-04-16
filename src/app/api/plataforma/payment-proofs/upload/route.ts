import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const BUCKET_ID = 'application-payment-proofs'
const MAX_BYTES = 5 * 1024 * 1024

const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

function getExtensionFromMime(mime: string): string {
  if (mime === 'application/pdf') return 'pdf'
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'bin'
}

export async function POST(request: NextRequest) {
  const supabaseServer = await createClient()
  const { data: userRes, error: userErr } = await supabaseServer.auth.getUser()
  if (userErr || !userRes.user) {
    return NextResponse.json(
      { ok: false, message: 'No autenticado' },
      { status: 401 }
    )
  }

  const formData = await request.formData()
  const applicationId = String(formData.get('application_id') ?? '').trim()
  const notes = String(formData.get('notes') ?? '').trim() || null
  const file = formData.get('file')

  if (!applicationId) {
    return NextResponse.json(
      { ok: false, message: 'Falta application_id' },
      { status: 400 }
    )
  }

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, message: 'Falta archivo' },
      { status: 400 }
    )
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Tipo de archivo no permitido. Usá PDF o imagen (JPG/PNG/WEBP).',
      },
      { status: 400 }
    )
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, message: 'Archivo inválido o demasiado grande (máx 5 MB).' },
      { status: 400 }
    )
  }

  // Permisos: super_admin o dueño de la postulación
  const { data: profileRow, error: profileErr } = await supabaseServer
    .from('profiles')
    .select('id, role')
    .eq('id', userRes.user.id)
    .maybeSingle()

  if (profileErr || !profileRow) {
    return NextResponse.json(
      { ok: false, message: 'Perfil no disponible' },
      { status: 403 }
    )
  }

  const isSuperAdmin = profileRow.role === 'super_admin'

  if (!isSuperAdmin) {
    const { data: appRow, error: appErr } = await supabaseServer
      .from('applications')
      .select('id, applicant_profile_id')
      .eq('id', applicationId)
      .maybeSingle()

    if (appErr || !appRow) {
      return NextResponse.json(
        { ok: false, message: 'Postulación no encontrada' },
        { status: 404 }
      )
    }

    if (appRow.applicant_profile_id !== userRes.user.id) {
      return NextResponse.json(
        { ok: false, message: 'Sin permisos' },
        { status: 403 }
      )
    }
  }

  const ext = getExtensionFromMime(file.type)
  const objectPath = `applications/${applicationId}/proof.${ext}`

  // 1) Subir (overwrite permitido)
  const arrayBuffer = await file.arrayBuffer()
  const content = new Uint8Array(arrayBuffer)

  const { error: uploadErr } = await supabaseAdmin.storage
    .from(BUCKET_ID)
    .upload(objectPath, content, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadErr) {
    return NextResponse.json(
      { ok: false, message: uploadErr.message },
      { status: 400 }
    )
  }

  // 2) Upsert 1 por application_id (UNIQUE)
  const { error: upsertErr } = await supabaseServer
    .from('application_payment_proofs')
    .upsert(
      {
        application_id: applicationId,
        uploader_profile_id: userRes.user.id,
        bucket_id: BUCKET_ID,
        object_path: objectPath,
        original_filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        notes,
      },
      { onConflict: 'application_id' }
    )

  if (upsertErr) {
    return NextResponse.json(
      { ok: false, message: upsertErr.message },
      { status: 400 }
    )
  }

  return NextResponse.json(
    { ok: true, object_path: objectPath },
    { status: 200 }
  )
}
