'use client'
import React from 'react'

const AboutProjectAcademySection: React.FC = () => {
  return (
    <section className="relative bg-black py-28 text-white overflow-hidden">
      {/* Background glow (FIX responsive) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-1/4 h-[260px] w-[260px] md:h-[500px] md:w-[500px] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute right-0 bottom-0 h-[260px] w-[260px] md:h-[500px] md:w-[500px] rounded-full bg-violet-600/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          
          {/* LEFT CONTENT */}
          <div>
            {/* Badge */}
            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-widest text-[#BDBE0B] font-bold">
              <span className="h-2 w-2 rounded-full bg-[#BDBE0B]" />
              Qué es Project Academy
            </span>

            {/* Title */}
            <h2 className="text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">
              Formación profesional aplicada para{' '}
              <span className="inline-block bg-gradient-to-r from-[#D85DFB] to-[#77039F] bg-clip-text text-transparent">
                Digital Product Developers
              </span>
            </h2>

            {/* Description */}
            <p className="mt-6 max-w-xl text-base text-white/80 sm:text-[18px] font-light">
              Project Academy es un programa intensivo de Ingeniería de Producto
              diseñado para formarte como un Profesional en T. Dominarás la
              creación de productos digitales profundizando en tu especialidad y
              construyendo un producto de principio a fin, bajo mentoría de alto nivel.
            </p>

            {/* Cards */}
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <ValueCard
                title="No aprendes herramientas aisladas"
                description="Aprendes cuándo, por qué y cómo usarlas en un proyecto de nivel profesional."
                accent="violet"
              />
              <ValueCard
                title="Aprendes a entregar valor en equipo"
                description="Con roles definidos, feedback exigente y mentoría experta."
                accent="emerald"
              />
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="relative max-w-full">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur max-w-full">
              
              {/* Window header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-white/40">
                  product-sprint-v2.0
                </span>
              </div>

              {/* Sprint items */}
              <div className="space-y-4">
                <SprintItem
                  title="Sprint Planning"
                  description="Defining user stories & acceptance criteria"
                  status="In Progress"
                  accent="violet"
                />
                <SprintItem
                  title="Development Cycle"
                  description="Feature implementation & pair programming"
                  status="Pending"
                  accent="emerald"
                />
                <SprintItem
                  title="Code Review & QA"
                  description="Quality assurance & pull request review"
                  status="Pending"
                  accent="cyan"
                />
              </div>

              {/* Progress */}
              <div className="mt-8">
                <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                  <span>Sprint Velocity</span>
                  <span>87%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-[#77039F] to-[#00CCA4]" />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

type ValueCardProps = {
  title: string
  description: string
  accent: 'violet' | 'emerald'
}

const ValueCard: React.FC<ValueCardProps> = ({
  title,
  description,
  accent,
}) => {
  const accentMap = {
    violet: 'text-[#D85DFB]',
    emerald: 'text-[#00CCA4]',
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h3 className={`text-base font-semibold ${accentMap[accent]}`}>
        {title}
      </h3>
      <p className="mt-2 text-sm text-white/70 leading-relaxed">
        {description}
      </p>
      <div
        className={`mt-4 h-1 w-10 rounded-full ${
          accent === 'violet' ? 'bg-[#D85DFB]' : 'bg-[#00CCA4]'
        }`}
      />
    </div>
  )
}

type SprintItemProps = {
  title: string
  description: string
  status: 'In Progress' | 'Pending'
  accent: 'violet' | 'emerald' | 'cyan'
}

const SprintItem: React.FC<SprintItemProps> = ({
  title,
  description,
  status,
  accent,
}) => {
  const accentDot = {
    violet: 'bg-[#77039F]',
    emerald: 'bg-[#00CCA4]',
    cyan: 'bg-[#D85DFB]',
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="flex items-start gap-3">
        <span className={`mt-1 h-3 w-3 rounded-full ${accentDot[accent]}`} />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-white/60">{description}</p>
        </div>
      </div>
      <span
        className={`text-xs ${
          status === 'In Progress' ? 'text-[#BDBE0B]' : 'text-white/40'
        }`}
      >
        {status}
      </span>
    </div>
  )
}

export default AboutProjectAcademySection