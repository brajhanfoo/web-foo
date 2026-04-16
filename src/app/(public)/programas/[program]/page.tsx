// app/(public)/programas/[program]/page.tsx
import { notFound } from 'next/navigation'
import type { JSX } from 'react'
import { PROGRAM_SPECS } from './registry'

type ProgramPageProps = {
  params: Promise<{ program: string }>
}

export default async function ProgramPage(
  props: ProgramPageProps
): Promise<JSX.Element> {
  const { program: slug } = await props.params
  const spec = PROGRAM_SPECS[slug]

  if (!spec) notFound()

  return <div className="min-h-screen bg-black">{spec.sections}</div>
}
