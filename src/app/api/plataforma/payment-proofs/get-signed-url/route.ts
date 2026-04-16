import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const BUCKET_ID = 'application-payment-proofs'

export async function POST(request: NextRequest) {
  const supabaseServer = await createClient()
  const { data: userRes } = await supabaseServer.auth.getUser()
  if (!userRes.user) {
    return NextResponse.json(
      { ok: false, message: 'No autenticado' },
      { status: 401 }
    )
  }

  const body = (await request.json()) as { application_id?: string }
  const applicationId = String(body.application_id ?? '').trim()
  if (!applicationId) {
    return NextResponse.json(
      { ok: false, message: 'Falta application_id' },
      { status: 400 }
    )
  }

  // Verificamos que exista el registro (RLS hace el filtro: dueño o super_admin)
  const { data: proof, error: proofErr } = await supabaseServer
    .from('application_payment_proofs')
    .select(
      'object_path, mime_type, original_filename, notes, size_bytes, created_at'
    )
    .eq('application_id', applicationId)
    .maybeSingle()

  if (proofErr) {
    return NextResponse.json(
      { ok: false, message: proofErr.message },
      { status: 400 }
    )
  }

  if (!proof) {
    return NextResponse.json({ ok: true, proof: null }, { status: 200 })
  }

  const { data: signed, error: signedErr } = await supabaseAdmin.storage
    .from(BUCKET_ID)
    .createSignedUrl(proof.object_path, 60 * 10)

  if (signedErr || !signed?.signedUrl) {
    return NextResponse.json(
      { ok: false, message: signedErr?.message ?? 'No se pudo firmar URL' },
      { status: 400 }
    )
  }

  return NextResponse.json(
    {
      ok: true,
      proof: {
        ...proof,
        signed_url: signed.signedUrl,
      },
    },
    { status: 200 }
  )
}
