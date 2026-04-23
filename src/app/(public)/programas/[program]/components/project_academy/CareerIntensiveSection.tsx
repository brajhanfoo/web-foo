import {
  FiFileText,
  FiLinkedin,
  FiMessageCircle,
  FiUsers,
  FiSearch,
  FiCalendar,
  FiShare2,
  FiDollarSign,
} from 'react-icons/fi'

type CareerItem = {
  title: string
  icon: React.ElementType
}

const items: CareerItem[] = [
  {
    title: 'Resume review 1-on-1',
    icon: FiFileText,
  },
  {
    title: 'LinkedIn audit profesional',
    icon: FiLinkedin,
  },
  {
    title: '2 mock interviews técnicos',
    icon: FiMessageCircle,
  },
  {
    title: '2 mock interviews behavioral',
    icon: FiUsers,
  },
  {
    title: 'Estrategia de búsqueda laboral',
    icon: FiSearch,
  },
  {
    title: '4 semanas de accountability',
    icon: FiCalendar,
  },
  {
    title: 'Networking con mentores',
    icon: FiShare2,
  },
  {
    title: 'Coaching de negociación salarial',
    icon: FiDollarSign,
  },
]

const CareerIntensiveSection = () => {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      {/* Header */}
      <div className="mb-14 max-w-3xl">
        <h2 className="text-3xl font-semibold text-white md:text-4xl">
          Career Intensive
        </h2>

        <p className="mt-4 text-sm text-white/60">
          Nuestro objetivo final además de lo académico es acelerar tu
          empleabilidad. Un programa paralelo dedicado exclusivamente a tu
          inserción laboral.
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20"
            >
              {/* Icon */}
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#77039F]/20 text-[#D85DFB]">
                <Icon className="h-5 w-5" />
              </div>

              {/* Title */}
              <p className="text-sm font-medium text-white">{item.title}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default CareerIntensiveSection
