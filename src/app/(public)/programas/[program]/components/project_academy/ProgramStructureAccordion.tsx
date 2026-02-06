'use client'

import React, { useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import { GiAlliedStar } from 'react-icons/gi'
import { MdOutlineFileDownload } from 'react-icons/md'
type Unit = {
  id: number
  title: string
  weeks: string
  content?: string[]
}

const UNITS: Unit[] = [
  {
    id: 1,
    title: 'Discovery & Planning',
    weeks: 'Semana 1–2',
    content: [
      'Career & Portfolio Final Polish',
      'Pitch deck preparation',
      'Demo Day: Presentación ante jurados expertos',
      'Feedback & cierre',
    ],
  },
  {
    id: 2,
    title: 'Architecture & strategy',
    weeks: 'Semana 3–5',
    content: [
      'Career & Portfolio Final Polish',
      'Pitch deck preparation',
      'Demo Day: Presentación ante jurados expertos',
      'Feedback & cierre',
    ],
  },
  {
    id: 3,
    title: 'Construction & sprinting',
    weeks: 'Semana 6–9',
    content: [
      'Career & Portfolio Final Polish',
      'Pitch deck preparation',
      'Demo Day: Presentación ante jurados expertos',
      'Feedback & cierre',
    ],
  },
  {
    id: 4,
    title: 'Quality, Polish & Handover',
    weeks: 'Semana 10–11',
    content: [
      'Career & Portfolio Final Polish',
      'Pitch deck preparation',
      'Demo Day: Presentación ante jurados expertos',
      'Feedback & cierre',
    ],
  },
  {
    id: 5,
    title: 'Demo day & certification',
    weeks: 'Semana 12',
    content: [
      'Career & Portfolio Final Polish',
      'Pitch deck preparation',
      'Demo Day: Presentación ante jurados expertos',
      'Feedback & cierre',
    ],
  },
]

const ProgramStructureAccordion: React.FC = () => {
  const [openUnit, setOpenUnit] = useState<number | null>(5)

  const toggleUnit = (id: number) => {
    setOpenUnit((prev) => (prev === id ? null : id))
  }

  return (
    <section className="relative bg-black py-28 text-white">
      <div className="mx-auto max-w-4xl px-6">
        {/* Title */}
        <h2 className="mb-12 text-center text-3xl font-bold sm:text-4xl">
          Estructura del Programa{' '}
          <span className="text-white/60">(12 Semanas)</span>
        </h2>

        {/* Accordion */}
        <div className="space-y-4">
          {UNITS.map((unit) => {
            const isOpen = openUnit === unit.id

            return (
              <div
                key={unit.id}
                className={`rounded-xl border transition ${
                  isOpen
                    ? 'border-emerald-500/40 bg-white/5'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                {/* Header */}
                <button
                  onClick={() => toggleUnit(unit.id)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#BCBC0B]/10 text-sm font-bold text-[#BCBC0B]">
                      {String(unit.id).padStart(2, '0')}
                    </span>

                    <div>
                      <p className="text-sm font-semibold">
                        Unidad {unit.id}: {unit.title}
                      </p>
                      <p className="text-xs text-[#00CCA4]">{unit.weeks}</p>
                    </div>
                  </div>

                  <FiChevronDown
                    className={`h-5 w-5 transition ${
                      isOpen ? 'rotate-180 text-emerald-400' : 'text-white/60'
                    }`}
                  />
                </button>

                {/* Content */}
                {isOpen && unit.content && (
                  <div className="px-6 pb-6">
                    <ul className="mt-2 space-y-2 text-sm text-white/70">
                      {unit.content.map((item, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="text-[#00CCA4]">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom Card */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6">
          <span className="mb-2 inline-block text-xs uppercase tracking-widest text-[#77039F] font-semibold">
            <span className="mr-2">
              <GiAlliedStar className="inline-block" />
            </span>
            Plus exclusivo
          </span>
          <h3 className="text-base font-semibold">
            Career Acceleration integrado
          </h3>
          <p className="mt-2 text-sm text-white/70">
            Incluye optimización de CV y perfil de LinkedIn con expertos, y
            simulacros de entrevista técnica para prepararte para el mercado
            laboral global.
          </p>

          <button className="mt-6 rounded-lg border border-white/20 px-4 py-2 text-sm transition hover:border-white/40 cursor-pointer flex items-center bg-white/10 hover:bg-white/20">
            <span className="mr-2">
              <MdOutlineFileDownload className="inline-block" />
            </span>
            Descargar brochure del programa
          </button>
        </div>
      </div>
    </section>
  )
}

export default ProgramStructureAccordion
