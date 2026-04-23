'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: '¿Qué es Project Academy?',
    a: 'Es un programa práctico donde aprenderás a construir un producto digital trabajando en equipo y con una dinámica cercana al mundo real.',
  },
  {
    q: '¿Es un curso teórico?',
    a: 'No. Está diseñado como una experiencia aplicada, donde aprenderás mientras avanzas en un proyecto junto a otros participantes y docentes por especialidad.',
  },
  {
    q: '¿A quién está dirigido?',
    a: 'A personas interesadas en Product Management, Product Design, Desarrollo de Software o QA que quieran fortalecer su experiencia en proyectos reales.',
  },
  {
    q: '¿Necesito experiencia previa?',
    a: 'No, pero se recomienda contar con una base previa en el área a la que postulas. No necesitas ser senior, pero sí tener conocimientos iniciales.',
  },
  {
    q: '¿Cómo se trabaja dentro del programa?',
    a: 'Trabajarás en equipo, con una lógica interdisciplinaria y acompañamiento de docentes especializados por rol.',
  },
  {
    q: '¿Cuánto dura el programa?',
    a: 'El programa tiene una duración de 12 semanas.',
  },
  {
    q: '¿Qué voy a desarrollar durante el programa?',
    a: 'Participarás en la creación de un producto digital, pasando por etapas como discovery, definición, diseño, desarrollo, testing y presentación final.',
  },
  {
    q: '¿Voy a trabajar solo mi rol?',
    a: 'No. Además de profundizar en tu especialidad, también entenderás cómo se conectan producto, diseño, desarrollo y QA dentro de un equipo real.',
  },
  {
    q: '¿Habrá proyecto final?',
    a: 'Sí. El programa culmina con una presentación final del producto construido durante la experiencia.',
  },
  {
    q: '¿Me servirá para mi portafolio o perfil profesional?',
    a: 'Sí. La experiencia está pensada para ayudarte a construir entregables, criterio y material que pueda sumar valor a tu perfil profesional.',
  },
  {
    q: '¿Puedo participar desde cualquier país?',
    a: 'Sí, siempre que puedas adaptarte al horario definido para las sesiones en vivo.',
  },
  {
    q: '¿Project Academy me garantiza trabajo?',
    a: 'No. Pero sí busca acercarte a una experiencia más real de trabajo y ayudarte a fortalecer tu perfil para futuras oportunidades.',
  },
]

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="relative bg-black px-6 py-24">
      {/* Glow */}
      <div className="absolute inset-0 flex justify-center">
        <div className="h-80 w-80 rounded-full bg-[#00CCA4]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <h2 className="mb-12 text-center text-3xl font-semibold text-white">
          Preguntas frecuentes
        </h2>

        <div className="space-y-4">
          {faqs.map((item, i) => {
            const isOpen = open === i

            return (
              <div
                key={i}
                className={`rounded-2xl border transition-all
                  ${
                    isOpen
                      ? 'border-[#00CCA4] bg-white/5'
                      : 'border-white/10 bg-white/3 hover:border-white/20'
                  }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-sm font-medium text-white">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-[#00CCA4] transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-white/70">
                    {item.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

