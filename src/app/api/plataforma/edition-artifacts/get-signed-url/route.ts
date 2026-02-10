import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const DEFAULT_BUCKET_ID = 'program-edition-artifacts'

const ALLOWED_KINDS: ReadonlySet<string> = new Set(['certificate', 'feedback'])

export async function GET(request: NextRequest) {
  const supabaseServer = await createClient()
  const { data: userRes, error: userErr } = await supabaseServer.auth.getUser()
  if (userErr || !userRes.user) {
    return NextResponse.json(
      { message: 'No autenticado' },
      { status: 401 }
    )
  }

  const { data: profileRow, error: profileErr } = await supabaseServer
    .from('profiles')
    .select('id, role')
    .eq('id', userRes.user.id)
    .maybeSingle()

  if (profileErr || !profileRow) {
    return NextResponse.json(
      { message: 'Perfil no disponible' },
      { status: 403 }
    )
  }

  const isAdmin =
    profileRow.role === 'admin' || profileRow.role === 'super_admin'

  if (!isAdmin) {
    return NextResponse.json({ message: 'Sin permisos' }, { status: 403 })
  }

  const url = new URL(request.url)
  const applicationId = url.searchParams.get('application_id')?.trim() ?? ''
  const kind = url.searchParams.get('kind')?.trim() ?? ''

  if (!applicationId || !ALLOWED_KINDS.has(kind)) {
    return NextResponse.json(
      { message: 'Parametros invalidos' },
      { status: 400 }
    )
  }

  const { data: row, error } = await supabaseServer
    .from('applications')
    .select(
      'certificate_bucket_id, certificate_object_path, feedback_bucket_id, feedback_object_path'
    )
    .eq('id', applicationId)
    .maybeSingle()

  if (error || !row) {
    return NextResponse.json(
      { message: 'Postulacion no encontrada' },
      { status: 404 }
    )
  }

  const objectPath =
    kind === 'certificate' ? row.certificate_object_path : row.feedback_object_path
  const bucketId =
    kind === 'certificate'
      ? row.certificate_bucket_id ?? DEFAULT_BUCKET_ID
      : row.feedback_bucket_id ?? DEFAULT_BUCKET_ID

  if (!objectPath) {
    return NextResponse.json(
      { message: 'Archivo no disponible' },
      { status: 404 }
    )
  }

  const { data: signed, error: signedErr } =
    await supabaseAdmin.storage.from(bucketId).createSignedUrl(objectPath, 3600)

  if (signedErr || !signed?.signedUrl) {
    return NextResponse.json(
      { message: signedErr?.message ?? 'No se pudo firmar la URL' },
      { status: 400 }
    )
  }

  return NextResponse.json({ signed_url: signed.signedUrl }, { status: 200 })
}
