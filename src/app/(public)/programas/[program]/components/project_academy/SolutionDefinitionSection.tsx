import { FiZap, FiSmartphone } from 'react-icons/fi'
import { IoIosRocket } from 'react-icons/io'

type SolutionOption = {
  title: string
  subtitle: string
  description: string
  accent: 'emerald' | 'lime' | 'purple'
  icon: React.ElementType
}

const options: SolutionOption[] = [
  {
    title: 'Full Code',
    subtitle: '(React / Node / Python)',
    description: 'Si el equipo es técnico.',
    accent: 'emerald',
    icon: IoIosRocket,
  },
  {
    title: 'No-Code / Low-Code',
    subtitle: '(Bubble / FlutterFlow)',
    description: 'Para MVPs rápidos.',
    accent: 'lime',
    icon: FiZap,
  },
  {
    title: 'Prototipo Validado',
    subtitle: '(Figma Hi-Fi)',
    description: 'Para enfoque en UX/Discovery.',
    accent: 'purple',
    icon: FiSmartphone,
  },
]

const accentMap = {
  emerald: 'bg-[#00CCA4]/15 text-[#00CCA4]',
  lime: 'bg-[#BDBE0B]/15 text-[#BDBE0B]',
  purple: 'bg-[#77039F]/40 text-[#D85DFB]',
}

const SolutionDefinitionSection = () => {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28 text-center">
      {/* Badge */}
      <div className="mb-6 flex justify-center">
        <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1 text-xs font-medium text-purple-400">
          Scope Flexible
        </span>
      </div>

      {/* Title */}
      <h2 className="text-3xl font-semibold text-white md:text-4xl">
        El Equipo define la{' '}
        <span className="bg-gradient-to-r from-[#00CCA4] to-[#D85DFB] bg-clip-text text-transparent">
          Solución
        </span>
      </h2>

      {/* Subtitle */}
      <p className="mx-auto mt-4 max-w-2xl text-sm text-white/60 md:text-base">
        No forzamos la tecnología. Tu Squad elegirá el camino más eficiente para
        el stakeholder.
      </p>

      {/* Cards */}
      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {options.map((option) => {
          const Icon = option.icon

          return (
            <div
              key={option.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur transition hover:border-white/20"
            >
              <div
                className={`mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${accentMap[option.accent]}`}
              >
                <Icon className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-semibold text-white">
                {option.title}
              </h3>

              <p className="mt-1 text-sm text-white/70">{option.subtitle}</p>

              <p className="mt-4 text-sm text-white/70">{option.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default SolutionDefinitionSection
