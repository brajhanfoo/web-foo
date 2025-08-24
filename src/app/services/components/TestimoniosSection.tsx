'use client'
import { useMemo, useState } from 'react'

import TestimonioCard from './TestimonioCard'
import { Icons } from '@/lib/icons'
import { testimoniosData } from '../_data/testimoniosData'
import AvatarGroup from './AvatarGroup'

export default function TestimoniosSection() {
  const [index, setIndex] = useState(0)
  const total = testimoniosData.length

  const IconLeft = Icons.arrowLeft
  const IconRight = Icons.arrowRight

  // --- Navegación Mobile (1 en 1)
  const nextMobile = () => setIndex((previous) => (previous + 1) % total)
  const previousMobile = () =>
    setIndex((previous) => (previous - 1 + total) % total)

  // --- Navegación Desktop (3 en 3)
  const STEP_DESKTOP = 3
  const nextDesktop = () =>
    setIndex((previous) => (previous + STEP_DESKTOP) % total)
  const previousDesktop = () =>
    setIndex((previous) => (previous - STEP_DESKTOP + total) % total)

  // Ventana visible en desktop (3 ítems, con wrap-around)
  const visibleDesktop = useMemo(() => {
    const count = Math.min(STEP_DESKTOP, total)
    return Array.from(
      { length: count },
      (_, index_) => testimoniosData[(index + index_) % total]
    )
  }, [index, total])

  if (total === 0) return null

  return (
    <section className="bg-black pt-[24px] pb-[60px] px-2 relative">
      {/* Header */}
      <div className="text-center text-white mb-8">
        <h2 className="text-[28px] lg:text-[32px] font-semibold">
          Testimonios
        </h2>
        <p className="text-gray-300 text-[14px] lg:text-[20px] font-normal">
          Lo que dicen de nosotros...
        </p>
        <div className="mt-4 flex justify-center">
          <AvatarGroup avatars={testimoniosData.map((t) => t.imagen)} max={3} />
        </div>
      </div>

      {/* Mobile: 1 card + flechas */}
      <div className="lg:hidden flex justify-center">
        <div className="flex justify-center items-center relative w-full max-w-[400px] mx-auto lg:hidden">
          <button
            aria-label="Anterior"
            className="rounded-full w-[28px] h-[28px] bg-white text-yellow flex justify-center items-center absolute left-0 shadow-xl/20 cursor-pointer z-20"
            onClick={previousMobile}
          >
            <IconLeft size={16} />
          </button>

          <TestimonioCard testimonio={testimoniosData[index]} />

          <button
            aria-label="Siguiente"
            className="rounded-full w-[28px] h-[28px] bg-white text-yellow flex justify-center items-center absolute right-0 shadow-xl/20 cursor-pointer z-20"
            onClick={nextMobile}
          >
            <IconRight size={16} />
          </button>
        </div>
      </div>

      {/* Desktop: 3 cards + flechas */}
      <div className="relative hidden lg:flex items-center justify-center gap-6 mt-8">
        <button
          aria-label="Anterior"
          onClick={previousDesktop}
          className="hidden lg:flex rounded-full w-10 h-10 bg-white text-yellow items-center justify-center cursor-pointer hover:bg-yellow hover:text-white transition-colors"
        >
          <IconLeft size={18} />
        </button>

        <div className="grid grid-cols-3 justify-items-center gap-4 max-w-5xl">
          {visibleDesktop.map((t) => (
            <TestimonioCard key={t.id} testimonio={t} />
          ))}
        </div>

        <button
          aria-label="Siguiente"
          onClick={nextDesktop}
          className="hidden lg:flex rounded-full w-10 h-10 bg-white text-yellow items-center justify-center cursor-pointer hover:bg-yellow hover:text-white transition-colors"
        >
          <IconRight size={18} />
        </button>
      </div>
    </section>
  )
}
