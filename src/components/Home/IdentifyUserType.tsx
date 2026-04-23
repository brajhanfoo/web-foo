import { FaCode, FaBuilding } from 'react-icons/fa'
import { useRouter } from 'next/navigation'

export default function IdentifyUserType() {
  const router = useRouter()
  return (
    <section className="relative bg-black px-4 py-20 text-white sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-12 text-xs font-mono text-neutral-400">
          <span className="text-teal-400">⌁</span>
          IDENTIFY_USER_TYPE()
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Card: Talento */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/80 p-6 shadow-[0_0_60px_rgba(0,0,0,0.8)] sm:p-10">
            {/* Glow */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-500/15 via-transparent to-transparent opacity-60" />

            {/* Icon */}
            <div className="relative z-10 mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-400/30">
              <FaCode className="text-[#00CCA4] text-xl" />
            </div>

            {/* Content */}
            <h3 className="relative z-10 text-xl font-semibold mb-3">
              Soy Talento Tech
            </h3>
            <p className="relative z-10 text-sm text-neutral-400 mb-8 max-w-md">
              Busco desarrollar mi perfil profesional, construir un portafolio
              sólido y acelerar mi empleabilidad.
            </p>

            {/* CTA */}
            <button
              className="relative z-10 w-full rounded-xl bg-[#00CCA4]/90 hover:bg-[#00CCA4] cursor-pointer transition py-3 text-sm font-semibold text-black"
              onClick={() => router.push('/programas')}
            >
              Ver Programas
            </button>
          </div>

          {/* Card: Empresa */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/80 p-6 shadow-[0_0_60px_rgba(0,0,0,0.8)] sm:p-10">
            {/* Glow */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/15 via-transparent to-transparent opacity-60" />

            {/* Icon */}
            <div className="relative z-10 mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-400/30">
              <FaBuilding className="text-[#A920D0] text-xl" />
            </div>

            {/* Content */}
            <h3 className="relative z-10 text-xl font-semibold mb-3">
              Soy Empresa / Recruiter
            </h3>
            <p className="relative z-10 text-sm text-neutral-400 mb-8 max-w-md">
              Busco contratar talento validado técnicamente o patrocinar un
              proyecto de innovación.
            </p>

            {/* CTA */}
            <button
              className="relative z-10 w-full rounded-xl bg-[#780B90]/90 hover:bg-[#780B90] cursor-pointer transition py-3 text-sm font-semibold text-white"
              onClick={() => router.push('/servicios')}
            >
              Ver Soluciones
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
