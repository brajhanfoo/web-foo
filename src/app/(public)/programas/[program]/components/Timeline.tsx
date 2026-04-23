'use client'
import React from 'react'

type Phase = {
  tag: string
  title: string
  description: string
  color: 'purple' | 'green' | 'yellow' | 'blue'
}

const phases: Phase[] = [
  {
    tag: 'SPRINT 0 - FASE I',
    title: 'Requerimientos',
    description:
      'Definición del proyecto: objetivos, requerimientos funcionales, análisis de stakeholders y alcance.',
    color: 'purple',
  },
  {
    tag: 'SPRINT 0 - FASE 2',
    title: 'Investigación UX',
    description:
      'Investigación cualitativa y cuantitativa, definición de arquetipos, flujos, prototipos de baja fidelidad.',
    color: 'green',
  },
  {
    tag: 'SPRINTS 1-3',
    title: 'Desarrollo',
    description:
      'En ciclos iterativos: diseño UI de alta fidelidad en Figma, desarrollo frontend/backend, pruebas.',
    color: 'purple',
  },
  {
    tag: 'DEMO DAY',
    title: 'Presentación Final',
    description: 'Showcase del producto desarrollado ante jurados.',
    color: 'yellow',
  },
  {
    tag: 'SPRINT 5',
    title: 'Feedback & Certificación',
    description: 'Correcciones finales y entrega de certificados.',
    color: 'blue',
  },
]

const colorStyles = {
  purple: {
    border: 'border-[#77039F]',
    glow: 'shadow-[0_0_25px_rgba(119,3,159,0.35)]',
    dot: 'bg-[#77039F]',
    tag: 'text-[#D85DFB]',
  },
  green: {
    border: 'border-[#00CCA4]',
    glow: 'shadow-[0_0_25px_rgba(0,204,164,0.35)]',
    dot: 'bg-[#00CCA4]',
    tag: 'text-[#00CCA4]',
  },
  yellow: {
    border: 'border-[#BDBE0B]',
    glow: 'shadow-[0_0_25px_rgba(189,190,11,0.35)]',
    dot: 'bg-[#BDBE0B]',
    tag: 'text-[#BDBE0B]',
  },
  blue: {
    border: 'border-[#3B82F6]',
    glow: 'shadow-[0_0_25px_rgba(59,130,246,0.35)]',
    dot: 'bg-[#3B82F6]',
    tag: 'text-[#60A5FA]',
  },
}

const Timeline: React.FC = () => {
  return (
    <section className="w-full bg-black text-white py-24 px-6 relative overflow-hidden">
      {/* glow fondo */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[500px] h-[500px] bg-[#77039F] opacity-10 blur-[140px] rounded-full" />

      {/* titulo */}
      <div className="max-w-6xl mx-auto text-center mb-20 relative z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold">
          Fases del{' '}
          <span className="bg-gradient-to-r from-[#D85DFB] to-[#77039F] bg-clip-text text-transparent">
            Programa
          </span>
        </h2>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* linea central */}
        <div className="hidden md:block absolute left-1/2 top-0 -translate-x-1/2 h-full w-[2px] bg-gradient-to-b from-[#77039F] via-[#00CCA4] to-[#3B82F6]" />

        <div className="space-y-24">
          {phases.map((phase, index) => {
            const isLeft = index % 2 === 0
            const styles = colorStyles[phase.color]

            return (
              <div
                key={index}
                className={`relative flex flex-col md:flex-row items-center ${
                  isLeft ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* tarjeta */}
                <div className="md:w-1/2">
                  <div
                    className={`bg-[#0c0c0c] backdrop-blur-md border ${styles.border} ${styles.glow}
                    rounded-2xl p-7 max-w-lg`}
                  >
                    <p
                      className={`text-xs tracking-widest font-semibold ${styles.tag}`}
                    >
                      {phase.tag}
                    </p>

                    <h3 className="text-xl font-bold mt-2">{phase.title}</h3>

                    <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                      {phase.description}
                    </p>
                  </div>
                </div>

                {/* punto central */}
                <div className="relative flex items-center justify-center md:w-[80px] my-8 md:my-0">
                  <div
                    className={`w-5 h-5 rounded-full ${styles.dot} shadow-[0_0_15px_rgba(255,255,255,0.6)]`}
                  />
                </div>

                {/* espacio */}
                <div className="md:w-1/2 hidden md:block" />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Timeline

