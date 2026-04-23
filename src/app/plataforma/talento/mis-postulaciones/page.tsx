// src/app/plataforma/talento/mis-postulaciones/page.tsx

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'

import type { ApplicationRow, ViewState } from './types'
import { buildPastCompletedItems, splitByEditionEnd } from './helpers'
import { MisPostulacionesView } from './components/mis-postulaciones-view'

export default function MisPostulacionesPage() {
  const { showError } = useToastEnhanced()

  const [state, setState] = useState<ViewState>({ kind: 'loading' })
  const didLoadRef = useRef(false)

  useEffect(() => {
    if (didLoadRef.current) return
    didLoadRef.current = true

    const run = async () => {
      const { data: userRes, error: userErr } = await supabase.auth.getUser()
      if (userErr) {
        showError('No se pudo validar tu sesión', 'Inténtalo nuevamente.')
        setState({ kind: 'signed_out' })
        return
      }

      if (!userRes.user) {
        setState({ kind: 'signed_out' })
        return
      }

      const profileId = userRes.user.id

      const { data, error } = await supabase
        .from('applications')
        .select(
          `
          id,
          applicant_profile_id,
          program_id,
          edition_id,
          status,
          payment_status,
          paid_at,
          applied_role,
          created_at,
          updated_at,
          program:programs (
            id,
            slug,
            title,
            description,
            is_published,
            created_at,
            updated_at,
            payment_mode,
            requires_payment_pre,
            price_usd,
            price_usd_list,
            price_usd_discount_percent,
            price_usd_final_single,
            price_usd_has_installments,
            price_usd_final_installments,
            price_usd_installments_count,
            price_usd_installments_interest_free,
            price_usd_installment_amount,
            price_ars_list,
            price_ars_discount_percent,
            price_ars_final_single,
            price_ars_has_installments,
            price_ars_final_installments,
            price_ars_installments_count,
            price_ars_installments_interest_free,
            price_ars_installment_amount
          ),
          edition:program_editions (
            id,
            program_id,
            edition_name,
            starts_at,
            ends_at,
            is_open,
            created_at,
            updated_at
          )
        `.trim()
        )
        .eq('applicant_profile_id', profileId)
        .order('created_at', { ascending: false })

      if (error) {
        showError(
          'No se pudieron cargar tus postulaciones',
          'Inténtalo nuevamente.'
        )
        setState({ kind: 'empty' })
        return
      }

      const rows = (data ?? []) as unknown as ApplicationRow[]
      if (!rows.length) {
        setState({ kind: 'empty' })
        return
      }

      const { active, past } = splitByEditionEnd(rows, new Date())

      if (!active.length && !past.length) {
        setState({ kind: 'empty' })
        return
      }

      setState({ kind: 'ready', active, past })
    }

    void run()
  }, [showError])

  const pastCompleted = useMemo(() => {
    if (state.kind !== 'ready') return []
    if (!state.past.length) return []
    return buildPastCompletedItems(state.past)
  }, [state])

  return <MisPostulacionesView state={state} pastCompleted={pastCompleted} />
}
