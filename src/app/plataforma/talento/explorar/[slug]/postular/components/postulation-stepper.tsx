'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PostulationStepId = 1 | 2 | 3

const STEPS: Array<{ id: PostulationStepId; label: string }> = [
  { id: 1, label: 'Rol seleccionado' },
  { id: 2, label: 'Experiencia' },
  { id: 3, label: 'Compromiso' },
]

export function PostulationStepper({
  current,
}: {
  current: PostulationStepId
}) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max items-center justify-center gap-3">
          {STEPS.map((s, index) => {
            const isDone = s.id < current
            const isCurrent = s.id === current

            return (
              <div key={s.id} className="flex items-center">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold',
                    isDone
                      ? 'border-emerald-400/40 bg-emerald-400/20 text-emerald-200'
                      : isCurrent
                        ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-100'
                        : 'border-white/10 bg-white/[0.03] text-white/60'
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <span>{s.id}</span>}
                </div>

                <div className="ml-2 mr-3 hidden text-xs text-white/60 md:block">
                  {s.label}
                </div>

                {index < STEPS.length - 1 ? (
                  <div
                    className={cn(
                      'h-[2px] w-10 rounded-full',
                      s.id < current ? 'bg-emerald-400/35' : 'bg-white/10'
                    )}
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
