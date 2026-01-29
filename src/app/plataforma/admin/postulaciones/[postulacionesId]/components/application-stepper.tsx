'use client'

import { Check } from 'lucide-react'
import { STATUS_STEPS } from '../types/types'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function ApplicationStepper({ currentStep }: { currentStep: number }) {
  const lastIndex = STATUS_STEPS.length

  // ✅ Lo que ya está "hecho" (checks)
  const completedIndex = clamp(currentStep, 1, lastIndex)

  // ✅ Dónde se posiciona el "foco" visual
  // Si estás en 1 (Recibido), el foco va al 2.
  const activeIndex =
    completedIndex === 1 ? 2 : clamp(completedIndex, 1, lastIndex)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between w-full">
        {STATUS_STEPS.map((step, index) => {
          const isCompleted = step.index <= completedIndex
          const isActive = step.index === activeIndex

          const leftLineIsGreen = index !== 0 && step.index <= activeIndex
          const rightLineIsGreen =
            index !== STATUS_STEPS.length - 1 && step.index < activeIndex

          return (
            <div key={step.key} className="flex items-center w-full">
              {/* LINEA IZQUIERDA */}
              {index !== 0 && (
                <div
                  className={`h-0.5 w-full ${
                    leftLineIsGreen ? 'bg-[#00CCA4]' : 'bg-white/20'
                  }`}
                />
              )}

              {/* CÍRCULO + LABEL */}
              <div className="flex flex-col items-center gap-2 min-w-[64px]">
                <div
                  className={[
                    'h-10 w-10 rounded-full flex items-center justify-center',
                    isCompleted
                      ? 'bg-[#00CCA4] text-black'
                      : isActive
                        ? 'bg-white text-black font-bold'
                        : 'bg-black border border-white/40 text-white/40',
                  ].join(' ')}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="font-bold">{step.index}</span>
                  )}
                </div>

                <span
                  className={`text-xs text-center ${
                    isActive || isCompleted ? 'text-white' : 'text-white/40'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* LINEA DERECHA */}
              {index !== STATUS_STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-full ${
                    rightLineIsGreen ? 'bg-[#00CCA4]' : 'bg-white/20'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
