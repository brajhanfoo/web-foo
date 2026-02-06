import {
  FiLayers,
  FiUsers,
  FiShare2,
  FiFileText,
  FiTarget,
} from 'react-icons/fi'

type OutcomeItem = {
  title: string
  description: string
  icon: React.ElementType
}

const outcomes: OutcomeItem[] = [
  {
    title: 'Proyecto complejo',
    description:
      'Pieza central de portfolio demostrando capacidad de ejecución técnica y de producto.',
    icon: FiLayers,
  },
  {
    title: 'Experiencia real',
    description:
      'Experiencia comprobable en equipo tech, trabajando con metodologías ágiles y CI/CD.',
    icon: FiUsers,
  },
  {
    title: 'Network profesional',
    description:
      'Conexión directa con mentores expertos, peers talentosos y oportunidades de la industria.',
    icon: FiShare2,
  },
  {
    title: 'CV y LinkedIn',
    description:
      'Optimizados profesionalmente para superar filtros ATS y captar reclutadores.',
    icon: FiFileText,
  },
  {
    title: 'Preparación sólida',
    description:
      'Confianza y práctica real para afrontar entrevistas técnicas y behavioral.',
    icon: FiTarget,
  },
]

const CareerOutcomeSection = () => {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      {/* Header */}
      <div className="mb-14 text-center">
        <h2 className="text-3xl font-semibold text-white md:text-4xl">
          Al finalizar: Valor tangible para tu carrera
        </h2>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {outcomes.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20"
            >
              {/* Icon */}
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#BDBE0B]/20 text-[#BDBE0B]">
                <Icon className="h-5 w-5" />
              </div>

              {/* Title */}
              <h3 className="text-base font-semibold text-white">
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

export default CareerOutcomeSection
