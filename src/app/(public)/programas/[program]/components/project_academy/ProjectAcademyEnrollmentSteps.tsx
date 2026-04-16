import {
  FiUserPlus,
  FiUsers,
  FiMessageCircle,
  FiCreditCard,
  FiCheckCircle,
  FiMonitor,
} from 'react-icons/fi'
import { FaRegCircleCheck } from 'react-icons/fa6'

type Step = {
  step: string
  title: string
  description: string
  accent: 'emerald' | 'violet' | 'purple'
  icon: React.ElementType
}

const steps: Step[] = [
  {
    step: 'Paso 1',
    title: 'Registro y aplicación',
    description:
      'Completa tu registro en la plataforma y aplica oficialmente al programa.',
    accent: 'emerald',
    icon: FiUserPlus,
  },
  {
    step: 'Paso 2',
    title: 'Apertura de cohorte',
    description:
      'Esperas la conformación del grupo. El programa inicia con un mínimo de 10 participantes.',
    accent: 'violet',
    icon: FiUsers,
  },
  {
    step: 'Paso 3',
    title: 'Entrevista personal',
    description:
      'Tendrás un simulacro de entrevista técnica, además de resolver dudas y alinear expectativas.',
    accent: 'purple',
    icon: FiMessageCircle,
  },
  {
    step: 'Paso 4',
    title: 'Orden de pago',
    description:
      'Si decides continuar, te enviaremos la orden de pago para reservar tu cupo.',
    accent: 'emerald',
    icon: FiCreditCard,
  },
  {
    step: 'Paso 5',
    title: 'Matrícula',
    description:
      'Una vez confirmado el pago, completas tu matrícula oficial dentro de la cohorte.',
    accent: 'violet',
    icon: FiCheckCircle,
  },
  {
    step: 'Paso 6',
    title: 'Acceso al panel',
    description:
      'Recibes acceso al panel del estudiante, donde encontrarás workshops, materiales y seguimiento.',
    accent: 'purple',
    icon: FiMonitor,
  },
]

const accentMap = {
  emerald: {
    icon: 'bg-[#00CCA4]/15 text-[#00CCA4]',
    badge: 'bg-[#00CCA4]/10 text-[#00CCA4] border-[#00CCA4]/20',
  },
  violet: {
    icon: 'bg-[#77039F]/10 text-[#77039F]',
    badge: 'bg-[#77039F]/10 text-[#C77DFF] border-[#77039F]/20',
  },
  purple: {
    icon: 'bg-[#D85DFB]/15 text-[#D85DFB]',
    badge: 'bg-[#D85DFB]/10 text-[#D85DFB] border-[#D85DFB]/20',
  },
}

const EnrollmentStepsSection = () => {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 text-center">
      {/* Header */}
      <h2 className="text-3xl font-semibold text-white md:text-4xl">
        Así ingresas a{' '}
        <span className="bg-gradient-to-r from-[#00CCA4] to-[#77039F] bg-clip-text text-transparent">
          Project Academy
        </span>
        .
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-sm text-white/60 md:text-base">
        Un proceso claro, acompañado y pensado para que ingreses con contexto,
        compromiso y una visión real de cómo se vive la experiencia dentro del
        programa.
      </p>

      {/* Steps Grid */}
      <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon
          const accent = accentMap[step.accent]

          return (
            <div
              key={step.step}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.07]"
            >
              {/* Top row */}
              <div className="mb-5 flex items-start justify-between gap-4">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${accent.badge}`}
                >
                  {step.step}
                </span>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent.icon}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>

              <p className="mt-3 text-sm leading-6 text-white/65">
                {step.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Footer badge */}
      <div className="mt-12 flex justify-center">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/70 backdrop-blur">
          <FaRegCircleCheck className="text-[#BDBE0B]" />
          Desde tu aplicación hasta tu acceso al panel, todo el proceso está
          diseñado para que entres con claridad y contexto.
        </div>
      </div>
    </section>
  )
}

export default EnrollmentStepsSection
