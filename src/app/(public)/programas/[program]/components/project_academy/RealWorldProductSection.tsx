'use client'
import { AiOutlineProduct } from 'react-icons/ai'
import { FaUsers, FaBriefcase, FaRocket } from 'react-icons/fa'
import { HiRefresh } from 'react-icons/hi'

const RealWorldProductSection: React.FC = () => {
  return (
    <section className="relative bg-black py-28 text-white overflow-hidden">
      {/* Background glow (FIX) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-[240px] w-[240px] md:h-[450px] md:w-[450px] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute right-0 bottom-0 h-[240px] w-[240px] md:h-[450px] md:w-[450px] rounded-full bg-violet-600/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          {/* LEFT */}
          <div className="flex justify-center lg:justify-start max-w-full">
            <div className="relative max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
              {/* Accent line */}
              <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-[#BDBE0B] via-[#00CCA4] to-[#77039F]" />

              <div className="flex flex-col items-center">
                {/* Icon */}
                <div className="mb-6 flex h-[80px] w-[80px] items-center justify-center rounded-xl bg-emerald-500/10">
                  <AiOutlineProduct className="text-[#BDBE0B] text-[36px]" />
                </div>

                {/* Quote */}
                <p className="text-lg md:text-[24px] font-semibold leading-relaxed text-center">
                  “Este proyecto va mucho más allá de la teoría. Está diseñado
                  para ser la pieza central y más fuerte de tu portafolio
                  profesional.”
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="max-w-full">
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
              Un producto complejo, robusto y{' '}
              <span className="text-emerald-400">defendible</span>
            </h2>

            <p className="mt-4 max-w-xl text-base text-white/70">
              Ve más allá de la teoría básica. Aquí construirás soluciones de
              software de nivel profesional, diseñadas para resolver problemas
              de negocio estructurados.
            </p>

            <div className="mt-10 space-y-4">
              <FeatureItem
                accent="emerald"
                icon={<FaUsers size={18} />}
                text="1 proyecto por equipo (20 personas máximo por edición)"
              />
              <FeatureItem
                accent="violet"
                icon={<FaBriefcase size={18} />}
                text="Caso de negocio avanzado / Producto propio"
              />
              <FeatureItem
                accent="cyan"
                icon={<HiRefresh size={18} />}
                text="Ciclo completo: Discovery → Launch"
              />
              <FeatureItem
                accent="purple"
                icon={<FaRocket size={18} />}
                text="Deployment production-ready"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

type FeatureItemProps = {
  text: string
  accent: 'emerald' | 'violet' | 'cyan' | 'purple'
  icon: React.ReactNode
}

const FeatureItem: React.FC<FeatureItemProps> = ({ text, accent, icon }) => {
  const accentMap = {
    emerald: 'bg-[#BDBE0B]/15 text-[#BDBE0B]',
    violet: 'bg-[#77039F]/15 text-[#77039F]',
    cyan: 'bg-[#00CCA4]/15 text-[#00CCA4]',
    purple: 'bg-[#D85DFB]/15 text-[#D85DFB]',
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 max-w-full">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentMap[accent]}`}
      >
        {icon}
      </span>
      <span className="text-sm text-white/80 leading-relaxed">{text}</span>
    </div>
  )
}

export default RealWorldProductSection

