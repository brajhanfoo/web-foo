import { notFound } from 'next/navigation'
import React from 'react'
import { PROGRAM_SPECS } from './registry'

type ProgramPageProps = {
  params: { program: string }
}

export default function ProgramPage(
  props: ProgramPageProps
): React.JSX.Element {
  const slug = props.params.program
  const spec = PROGRAM_SPECS[slug]

  if (!spec) return notFound()

  return <div className="min-h-screen bg-black">{spec.sections}</div>
}
