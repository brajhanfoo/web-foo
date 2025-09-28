'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { Icons } from '@/lib/icons'
import { testimonialData } from '../_data/testimoniosData'
import Heading from './Heading'
import Image from 'next/image'

const IconLeft = Icons.arrowLeft
const IconRight = Icons.arrowRight

const slideVariants: Variants = {
  enter: (directionSign: number) => ({
    x: directionSign > 0 ? 70 : -70,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (directionSign: number) => ({
    x: directionSign < 0 ? 70 : -70,
    opacity: 0,
    transition: { duration: 0.35 },
  }),
}

const imgVariants: Variants = {
  enter: { opacity: 0, scale: 0.98 },
  center: { opacity: 1, scale: 1, transition: { duration: 0.45 } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.3 } },
}

const FALLBACK_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
  <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
  <stop offset='0%' stop-color='#1f2937'/><stop offset='100%' stop-color='#111827'/></linearGradient></defs>
  <rect width='64' height='64' fill='url(#g)'/>
  <circle cx='32' cy='24' r='12' fill='#374151'/><rect x='12' y='42' width='40' height='14' rx='7' fill='#374151'/>
</svg>`)

export default function TestimoniosSection() {
  const total = testimonialData.length
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  const isEmpty = total === 0

  const goTo = useCallback(
    (nextIndex: number, directionSign: number) => {
      setDirection(directionSign)
      setIndex(((nextIndex % total) + total) % total)
    },
    [total]
  )

  const next = useCallback(() => goTo(index + 1, 1), [goTo, index])
  const previous = useCallback(() => goTo(index - 1, -1), [goTo, index])

  if (isEmpty) return null

  const t = testimonialData[index]
  const img = t?.image || FALLBACK_AVATAR

  return (
    <section
      className="bg-[radial-gradient(ellipse_at_center,rgba(158,110,230,0.28)_0%,rgba(158,110,230,0)_60%)] text-white pb-[60px] lg:pb-52 px-2 relative grid pt-10"
      role="group"
      aria-roledescription="carousel"
      aria-label="Testimonios"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          next()
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          previous()
        }
      }}
    >
      <Heading text="Testimonios" />

      <div className="mx-auto max-w-6xl pt-5 lg:pt-20">
        <div className="grid gap-6 md:grid-cols-[minmax(240px,320px)_1fr] items-start">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`img-${t.id}`}
              variants={imgVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="relative"
            >
              <div className="relative w-full aspect-square overflow-hidden rounded-lg border border-white/10">
                <Image
                  width={320}
                  height={320}
                  src={img}
                  alt={t.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3">
                <div className="font-semibold text-white">{t.name}</div>
                <div className="text-sm text-white/70 flex items-center gap-4">
                  <span>{t.position}</span>
                  {t.company && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-white/40 inline-block" />
                      <span className="font-medium text-white/80">
                        {t.company}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="relative">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`quote-${t.id}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={(_, info) => {
                  const deltaX = info.offset.x
                  if (deltaX > 60) previous()
                  if (deltaX < -60) next()
                }}
                className="relative pb-12"
                aria-live="polite"
              >
                <div className="mb-2 text-white/70">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M7.17 6.17C6.02 7.32 5.25 9.02 5.25 10.75c0 2.62 1.88 4.25 4 4.25 1.86 0 3.5-1.64 3.5-3.5S11.11 8 9.25 8c-.36 0-.7.06-1.02.17.2-1.02.74-1.98 1.5-2.74L7.17 6.17Zm8 0C14.02 7.32 13.25 9.02 13.25 10.75c0 2.62 1.88 4.25 4 4.25 1.86 0 3.5-1.64 3.5-3.5S18.11 8 16.25 8c-.36 0-.7.06-1.02.17.2-1.02.74-1.98 1.5-2.74l-1.56.74Z" />
                  </svg>
                </div>
                <blockquote className="text-[16px] sm:text-[18px] lg:text-[20px] leading-relaxed text-white/95 max-w-3xl">
                  {t.testimonial}
                </blockquote>
              </motion.div>
            </AnimatePresence>

            <div className="pointer-events-auto absolute left-0 bottom-0 flex items-center gap-2">
              <button
                aria-label="Anterior"
                onClick={previous}
                className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-white/20 bg-white/5 hover:bg-white/10 transition"
              >
                <IconLeft size={14} />
              </button>
              <button
                aria-label="Siguiente"
                onClick={next}
                className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-white/20 bg-white/5 hover:bg-white/10 transition"
              >
                <IconRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
