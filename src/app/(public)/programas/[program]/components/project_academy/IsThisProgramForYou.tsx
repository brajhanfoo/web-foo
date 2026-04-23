'use client'

import { FaCheck } from 'react-icons/fa6'

const IsThisProgramForYou: React.FC = () => {
  return (
    <section className="relative bg-black py-24 text-white">
      <div className="mx-auto max-w-7xl px-6">
        {/* Title */}
        <h2 className="mb-16 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          ¿Es este programa para ti?
        </h2>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* YES CARD */}
          <DecisionCard
            title="ES PARA TI SI..."
            accent="emerald"
            items={[
              'Has finalizado algún curso de PM/BA/UX/Dev/QA & No-code',
              'Tienes compromiso de 12 semanas intensivas',
              // 🔥 TEXTO ACTUALIZADO: Enfoque claro en la construcción del producto
              'Buscas aplicar la teoría en la construcción de un producto de software',
              'Buscas dominar la dinámica de un equipo interdisciplinario aplicando metodologías ágiles de la industria',
              'Quieres validar la calidad de tus entregables con estándares del mercado',
              'Deseas liderar la creación de un producto con criterio profesional',
              'Buscas desarrollar un MVP sólido para dar el salto profesional',
            ]}
          />

          {/* NO CARD */}
          <DecisionCard
            title="NO ES PARA TI SI..."
            accent="violet"
            items={[
              'Quieres aprender desde cero',
              'Buscas solo contenido grabado',
              'No te gusta trabajar en equipo',
              'Evitas retroalimentación directa o exigente',
            ]}
          />
        </div>
      </div>
    </section>
  )
}

type DecisionCardProps = {
  title: string
  items: string[]
  accent: 'emerald' | 'violet'
}

const DecisionCard: React.FC<DecisionCardProps> = ({
  title,
  items,
  accent,
}) => {
  const accentStyles = {
    emerald: {
      border: 'border-white/10',
      bg: 'bg-[#161616]/40',
      icon: 'bg-[#00CCA4]/10 text-[#00CCA4]',
      dot: 'bg-[#00CCA4]',
    },
    violet: {
      border: 'border-white/10',
      bg: 'bg-[#161616]/40',
      icon: 'bg-[#77039F]/10 text-[#77039F]',
      dot: 'bg-[#77039F]',
    },
  }

  const styles = accentStyles[accent]

  return (
    <div
      className={`
        relative
        rounded-2xl
        border ${styles.border}
        ${styles.bg}
        p-8
        backdrop-blur
        shadow-[0_0_30px_rgba(255,255,255,0.03)]
      `}
    >
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-sm text-sm font-bold ${styles.icon}`}
        >
          {accent === 'emerald' ? <FaCheck /> : '✕'}
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">
          {title}
        </h3>
      </div>

      {/* List */}
      <ul className="space-y-4">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3 text-sm">
            <span
              className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${styles.dot}`}
            />
            <span className="text-white/80 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default IsThisProgramForYou
