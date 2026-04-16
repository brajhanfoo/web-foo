'use client'

import { Badge } from '@/components/ui/badge'

export function MiniCheck({
  label,
  value,
}: {
  label: string
  value: boolean | null
}) {
  const isAccepted = value === true
  const isUnknown = value === null

  return (
    <div className="rounded-md border p-3 flex items-center justify-between">
      <span className="text-sm">{label}</span>
      {isUnknown ? (
        <Badge variant="outline">—</Badge>
      ) : isAccepted ? (
        <Badge variant="secondary">Sí</Badge>
      ) : (
        <Badge variant="outline">No</Badge>
      )}
    </div>
  )
}
