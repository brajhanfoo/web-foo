import { FiCode, FiBox, FiTrendingUp } from 'react-icons/fi'
import { FaRegCircleCheck } from 'react-icons/fa6'

type Track = {
  title: string
  accent: 'emerald' | 'violet' | 'purple'
  icon: React.ElementType
  items: string[]
}

const tracks: Track[] = [
  {
    title: 'Technical Track',
    accent: 'emerald',
    icon: FiCode,
    items: [
      'CI/CD Pipelines',
      'Code Reviews',
      'Gestión de Deuda Técnica',
      'Performance Optimization',
    ],
  },
  {
    title: 'Product Track',
    accent: 'violet',
    icon: FiBox,
    items: [
      'Requerimientos de Negocio',
      'Investigación de Usuarios',
      'Priorización de Backlog',
      'Alineación con Stakeholders',
    ],
  },
  {
    title: 'Career Acceleration',
    accent: 'purple',
    icon: FiTrendingUp,
    items: [
      'Simulacros de Entrevistas',
      'System Design Interviews',
      'Comunicación Profesional',
      'Negociación de Ofertas',
    ],
  },
]

const accentMap = {
  emerald: {
    icon: 'bg-[#00CCA4]/15 text-[#00CCA4]',
    bullet: 'text-[#00CCA4]',
  },
  violet: {
    icon: 'bg-[#77039F]/10 text-[#77039F]',
    bullet: 'text-[#77039F]',
  },
  purple: {
    icon: 'bg-[#D85DFB]/15 text-[#D85DFB]',
    bullet: 'text-[#D85DFB]',
  },
}

const TracksSection = () => {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 text-center">
      {/* Header */}
      <h2 className="text-3xl font-semibold text-white md:text-4xl">
        Aprendes justo cuando{' '}
        <span className="bg-gradient-to-r from-[#00CCA4] to-[#77039F] bg-clip-text text-transparent">
          el proyecto lo exige
        </span>
        .
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-sm text-white/60 md:text-base">
        Los workshops no siguen un temario rígido. Cada sesión se adapta a las
        necesidades del equipo para avanzar, replicando los más altos estándares
        de la industria tecnológica.
      </p>

      {/* Cards */}
      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {tracks.map((track) => {
          const Icon = track.icon
          const accent = accentMap[track.accent]

          return (
            <div
              key={track.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur"
            >
              {/* Card header */}
              <div className="mb-6 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent.icon}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {track.title}
                </h3>
              </div>

              {/* List */}
              <ul className="space-y-3 text-sm text-white/70">
                {track.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className={`${accent.bullet}`}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Footer badge */}
      <div className="mt-12 flex justify-center">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/70 backdrop-blur">
          <FaRegCircleCheck className="text-[#BDBE0B]" />
          No estudias para un examen. Construyes y entregas un producto de nivel
          profesional.
        </div>
      </div>
    </section>
  )
}

export default TracksSection
