'use client'

import React from 'react'
import type { ProgramCardVM } from '../types/types'
import { ProgramCard } from './ProgramCard'

type ProgramGridProps = {
  items: ProgramCardVM[]
  countryCode: string | null
}

export function ProgramGrid(props: ProgramGridProps): React.JSX.Element {
  const { items, countryCode } = props

  return (
    <section className="grid gap-6 md:grid-cols-2 max-w-6xl mx-auto">
      {items.map((p) => (
        <ProgramCard key={p.program.id} item={p} countryCode={countryCode} />
      ))}
    </section>
  )
}
