// app/(public)/programas/[program]/page.tsx
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { JSX } from 'react'
import { createClient } from '@/lib/supabase/server'
import { resolveCountryCodeFromHeaders, resolveProgramPricing } from '@/lib/pricing'
import type { ProgramRow } from '@/types/programs'
import { PROGRAM_SPECS } from './registry'

type ProgramPageProps = {
  params: Promise<{ program: string }>
}

export default async function ProgramPage(
  props: ProgramPageProps
): Promise<JSX.Element> {
  const supabase = await createClient()
  const { program: slug } = await props.params
  const spec = PROGRAM_SPECS[slug]

  if (!spec) notFound()

  const { data: programData } = await supabase
    .from('programs')
    .select(
      `id,slug,title,description,is_published,payment_mode,requires_payment_pre,price_usd,
      price_usd_list,price_usd_discount_percent,price_usd_final_single,price_usd_has_installments,
      price_usd_final_installments,price_usd_installments_count,price_usd_installments_interest_free,price_usd_installment_amount,
      price_ars_list,price_ars_discount_percent,price_ars_final_single,price_ars_has_installments,
      price_ars_final_installments,price_ars_installments_count,price_ars_installments_interest_free,price_ars_installment_amount`
    )
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (!programData) notFound()

  const program = programData as ProgramRow

  const requestHeaders = await headers()
  const countryCode = resolveCountryCodeFromHeaders(requestHeaders)
  const pricing = resolveProgramPricing(program, countryCode)

  return (
    <div className="min-h-screen bg-black">
      {spec.renderSections({ program, countryCode, pricing })}
    </div>
  )
}
