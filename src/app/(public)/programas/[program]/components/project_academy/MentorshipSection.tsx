import { FiFlag, FiCode, FiMap, FiPlayCircle } from 'react-icons/fi'

type MentorshipStep = {
  step: string
  title: string
  description: string
  color: string
  icon: React.ElementType
}

const steps: MentorshipStep[] = [
  {
    step: '1.',
    title: 'Career goals & kickoff',
    description:
      'Definición de objetivos, expectativas y plan de trabajo inicial para el programa.',
    color: '#00CCA4',
    icon: FiFlag,
  },
  {
    step: '2.',
    title: 'Technical mid-project review',
    description:
      'Revisión profunda de código y arquitectura a mitad del desarrollo del proyecto.',
    color: '#BDBE0B',
    icon: FiCode,
  },
  {
    step: '3.',
    title: 'Career roadmap',
    description:
      'Diseño de ruta de aprendizaje a largo plazo y especialización técnica.',
    color: '#77039F',
    icon: FiMap,
  },
  {
    step: '4.',
    title: 'Demo prep & next steps',
    description: 'Preparación para el Demo Day y estrategia post-graduación.',
    color: '#D85DFB',
    icon: FiPlayCircle,
  },
]

const MentorshipSection = () => {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      {/* Header */}
      <div className="mb-16 text-center">
        <h2 className="text-3xl font-semibold text-white md:text-4xl">
          Mentoría especializada, individual y accionable
        </h2>

        <p className="mt-3 text-sm font-medium text-[#00CCA4]">
          1 mentor experto por especialidad
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.step}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20"
            >
              {/* Icon */}
              <div
                className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${item.color}20`,
                  color: item.color,
                }}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Step */}
              <span
                className="text-sm font-semibold"
                style={{ color: item.color }}
              >
                {item.step}
              </span>

              {/* Title */}
              <h3 className="mt-2 text-base font-semibold text-white">
                {item.title}
              </h3>

              {/* Description */}
              <p className="mt-2 text-sm text-white/60">{item.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default MentorshipSection

