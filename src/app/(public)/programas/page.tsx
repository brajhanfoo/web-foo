import React from 'react'
import { createClient } from '@/lib/supabase/server'
import type { EditionRow, ProgramCardVM, ProgramRow } from './types/types'
import { computeProgramStatus } from './utils'
import { getProgramCardContent } from './content'
import { ProgramsHero } from './components/ProgramHero'
import { ProgramGrid } from './components/ProgramGrid'
import { ComingSoonStrip } from './components/ComingSoonStrip'

export default async function PublicProgramsPage(): Promise<React.JSX.Element> {
  const supabase = await createClient()

  const { data: programsData, error: programsError } = await supabase
    .from('programs')
    .select(
      'id,slug,title,description,is_published,payment_mode,requires_payment_pre,price_usd,created_at,updated_at'
    )
    .eq('is_published', true)
    .order('created_at', { ascending: true })

  if (programsError) {
    return (
      <div className="min-h-dvh bg-black px-6 py-10">
        <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
          <div className="text-lg font-semibold">
            No se pudieron cargar programas
          </div>
          <div className="mt-2 text-sm text-white/60">
            Intenta nuevamente en unos minutos.
          </div>
        </div>
      </div>
    )
  }

  const programs: ProgramRow[] = (programsData ?? []) as ProgramRow[]
  const programIds: string[] = programs.map((p) => p.id)

  const { data: editionsData } = programIds.length
    ? await supabase
        .from('program_editions')
        .select(
          'id,program_id,edition_name,starts_at,ends_at,is_open,created_at,updated_at'
        )
        .in('program_id', programIds)
        .order('created_at', { ascending: false })
    : { data: [] as unknown[] }

  const editions: EditionRow[] = (editionsData ?? []) as EditionRow[]

  // última edición por programa
  const latestEditionByProgram: Map<string, EditionRow> = new Map<
    string,
    EditionRow
  >()
  for (const ed of editions) {
    if (!latestEditionByProgram.has(ed.program_id)) {
      latestEditionByProgram.set(ed.program_id, ed)
    }
  }

  const items: ProgramCardVM[] = programs.map((program) => {
    const edition = latestEditionByProgram.get(program.id) ?? null
    const status = computeProgramStatus({
      isPublished: program.is_published,
      edition,
    })
    const content = getProgramCardContent(program)
    return { program, edition, status, content }
  })

  return (
    <div className="min-h-dvh bg-black">
      {/* background soft */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-[-140px] top-[-140px] h-[340px] w-[340px] rounded-full bg-[#A920D0]/20 blur-3xl" />
        <div className="absolute right-[-140px] top-[80px] h-[340px] w-[340px] rounded-full bg-[#00D3D3]/12 blur-3xl" />
        <div className="absolute left-[35%] bottom-[-180px] h-[420px] w-[420px] rounded-full bg-[#00CCA4]/10 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-6xl px-6 py-10 md:py-14">
        <ProgramsHero />

        <ProgramGrid items={items} />

        <ComingSoonStrip />
      </main>
    </div>
  )
}
