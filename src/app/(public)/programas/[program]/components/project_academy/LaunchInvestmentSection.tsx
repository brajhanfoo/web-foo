'use client'
import { FiCalendar, FiClock, FiMonitor } from 'react-icons/fi'
import { useRouter } from 'next/navigation'

const LaunchInvestmentSection = () => {
  const router = useRouter()

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      {/* Header */}
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-semibold text-white md:text-4xl">
          Inversión por Lanzamiento
        </h2>
        <p className="mt-3 text-sm text-white/60">
          Tu futuro profesional comienza con una decisión inteligente.
        </p>
      </div>

      {/* Card */}
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-gradient-to-br from-[#1b1c12] via-[#15160f] to-[#0f100b] p-8 shadow-2xl">
        <div className="grid gap-8 md:grid-cols-2">
          {/* LEFT */}
          <div>
            <span className="inline-block rounded-full bg-[#BDBE0B]/20 px-3 py-1 text-xs font-medium text-[#BDBE0B]">
              CUPOS LIMITADOS
            </span>

            <div className="mt-6">
              <p className="text-sm text-white/40 line-through">$850 USD</p>

              <div className="flex items-end gap-2">
                <span className="text-5xl font-bold text-[#BDBE0B]">$350</span>
                <span className="mb-1 text-sm text-white/70">USD</span>
              </div>

              <p className="mt-1 text-xs uppercase tracking-wide text-[#BDBE0B]/80">
                Precio Early Bird
              </p>

              {/* 🔥 MICROCOPY OPTIMIZADO */}
              <p className="mt-4 text-xs text-white/50">
                No pagas nada hoy · Puedes dividir el pago en cuotas con tu
                tarjeta
              </p>
            </div>

            <p className="mt-6 max-w-sm text-sm text-white/50">
              Aplica para iniciar tu proceso de admisión y asegurar este precio.
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col justify-between">
            <div className="space-y-4 text-sm text-white/80">
              <div className="flex items-start gap-3">
                <FiCalendar className="mt-0.5 h-4 w-4 text-[#BDBE0B]" />
                <div>
                  <p className="font-medium text-white">Inicio: 18 de mayo</p>
                  <p className="text-xs text-white/50">
                    Duración de 12 semanas
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FiClock className="mt-0.5 h-4 w-4 text-[#BDBE0B]" />
                <div>
                  <p className="font-medium text-white">Formato Part-time</p>
                  <p className="text-xs text-white/50">
                    Turnos a elección: Mañana, Tarde o Noche (Hora ARG / GMT-3)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FiMonitor className="mt-0.5 h-4 w-4 text-[#BDBE0B]" />
                <div>
                  <p className="font-medium text-white">100% Remoto en vivo</p>
                  <p className="text-xs text-white/50">
                    Workshops grabados disponibles 24/7
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/plataforma/talento')}
              className="mt-8 w-full rounded-xl bg-gradient-to-r from-[#BDBE0B] to-[#A5A70A] py-3 text-sm font-semibold text-black transition hover:opacity-90 cursor-pointer"
            >
              Asegurar mi cupo
            </button>

            {/* 🔥 confianza extra (opcional pero potente) */}
            <p className="mt-3 text-center text-xs text-white/40">
              Acceso inmediato tras admisión · Cupos limitados por cohorte
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LaunchInvestmentSection
