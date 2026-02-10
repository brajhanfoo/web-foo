import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const BUCKET_ID = 'program-edition-artifacts'
const MAX_BYTES = 10 * 1024 * 1024

const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

const ALLOWED_KINDS: ReadonlySet<string> = new Set(['certificate', 'feedback'])

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
  const kind = String(formData.get('kind') ?? '').trim()
  const file = formData.get('file')

  if (!applicationId) {
    return NextResponse.json(
      { ok: false, message: 'Falta application_id' },
      { status: 400 }
    )
  }

  if (!ALLOWED_KINDS.has(kind)) {
    return NextResponse.json(
      { ok: false, message: 'Tipo de archivo invalido' },
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
          'Tipo de archivo no permitido. Usa PDF o imagen (JPG/PNG/WEBP).',
      },
      { status: 400 }
    )
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, message: 'Archivo invalido o demasiado grande (max 10 MB).' },
      { status: 400 }
    )
  }

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

  const isAdmin =
    profileRow.role === 'admin' || profileRow.role === 'super_admin'

  if (!isAdmin) {
    return NextResponse.json(
      { ok: false, message: 'Sin permisos' },
      { status: 403 }
    )
  }

  const { data: appRow, error: appErr } = await supabaseServer
    .from('applications')
    .select('id, edition_id')
    .eq('id', applicationId)
    .maybeSingle()

  if (appErr || !appRow?.edition_id) {
    return NextResponse.json(
      { ok: false, message: 'Postulacion no encontrada' },
      { status: 404 }
    )
  }

  const ext = getExtensionFromMime(file.type)
  const objectPath = `editions/${appRow.edition_id}/applications/${applicationId}/${kind}.${ext}`

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

  const updatePayload =
    kind === 'certificate'
      ? { certificate_bucket_id: BUCKET_ID, certificate_object_path: objectPath }
      : { feedback_bucket_id: BUCKET_ID, feedback_object_path: objectPath }

  const { error: updateErr } = await supabaseServer
    .from('applications')
    .update(updatePayload)
    .eq('id', applicationId)

  if (updateErr) {
    return NextResponse.json(
      { ok: false, message: updateErr.message },
      { status: 400 }
    )
  }

  return NextResponse.json(
    { ok: true, object_path: objectPath },
    { status: 200 }
  )
}
