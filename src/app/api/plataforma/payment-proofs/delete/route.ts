import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const BUCKET_ID = 'application-payment-proofs'

export async function POST(request: NextRequest) {
  const supabaseServer = await createClient()
  const { data: userRes } = await supabaseServer.auth.getUser()
  if (!userRes.user) {
    return NextResponse.json({ ok: false, message: 'No autenticado' }, { status: 401 })
  }

  const body = (await request.json()) as { application_id?: string }
  const applicationId = String(body.application_id ?? '').trim()
  if (!applicationId) {
    return NextResponse.json({ ok: false, message: 'Falta application_id' }, { status: 400 })
  }

  // Trae registro (RLS filtra)
  const { data: proof, error: proofErr } = await supabaseServer
    .from('application_payment_proofs')
    .select('object_path')
    .eq('application_id', applicationId)
    .maybeSingle()

  if (proofErr) {
    return NextResponse.json({ ok: false, message: proofErr.message }, { status: 400 })
  }

  if (!proof) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const { error: removeErr } = await supabaseAdmin.storage.from(BUCKET_ID).remove([proof.object_path])
  if (removeErr) {
    return NextResponse.json({ ok: false, message: removeErr.message }, { status: 400 })
  }

  const { error: delErr } = await supabaseServer
    .from('application_payment_proofs')
    .delete()
    .eq('application_id', applicationId)

  if (delErr) {
    return NextResponse.json({ ok: false, message: delErr.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
