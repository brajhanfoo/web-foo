// app/(public)/programas/[program]/page.tsx
import { headers } from 'next/headers'
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

  const requestHeaders = await headers()
  const visitorCountry =
    requestHeaders.get('x-vercel-ip-country') ??
    requestHeaders.get('cf-ipcountry') ??
    requestHeaders.get('cloudfront-viewer-country') ??
    requestHeaders.get('x-country-code') ??
    ''

  const isArgentinaVisitor = visitorCountry.toUpperCase() === 'AR'

  return (
    <div className="min-h-screen bg-black">
      {spec.renderSections({ isArgentinaVisitor })}
    </div>
  )
}
