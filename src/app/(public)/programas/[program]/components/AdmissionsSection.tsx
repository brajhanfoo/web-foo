'use client'

import { FaUsers, FaChalkboardTeacher, FaClock, FaLaptop } from 'react-icons/fa'
import Link from 'next/link'

export default function AdmissionsSection() {
  return (
    <section className="w-full bg-black text-white py-24 px-6 relative overflow-hidden">
      {/* glow fondo */}
      <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-[#BDBE0B] opacity-10 blur-[140px] rounded-full" />
      <div className="absolute left-0 bottom-0 w-[400px] h-[400px] bg-[#77039F] opacity-10 blur-[140px] rounded-full" />

      {/* encabezado */}
      <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold">
          Admisiones y{' '}
          <span className="bg-gradient-to-r from-[#D85DFB] to-[#77039F] bg-clip-text text-transparent">
            Cohortes
          </span>
        </h2>

        <p className="text-gray-400 text-lg mt-4">
          Únete a nuestras cohortes abiertas para la comunidad tech y vive una
          experiencia práctica de aprendizaje.
        </p>
      </div>

      {/* contenedor principal */}
      <div className="max-w-6xl mx-auto relative z-10">
        <div
          className="
          relative
          rounded-3xl
          border border-[#BDBE0B]/40
          bg-gradient-to-b from-[#0b0b0b] to-[#050505]
          backdrop-blur-xl
          p-10
          shadow-[0_0_60px_rgba(189,190,11,0.15)]
        "
        >
          {/* glow borde */}
          <div className="absolute inset-0 rounded-3xl border border-[#BDBE0B]/20 pointer-events-none" />

          {/* texto */}
          <p className="text-gray-300 text-lg leading-relaxed mb-10 max-w-4xl text-center mx-auto">
            Cada cohorte reúne al menos{' '}
            <span className="text-white font-semibold">50 estudiantes</span>,
            organizados en equipos de desarrollo de software. El programa
            combina{' '}
            <span className="text-[#00CCA4] font-semibold">
              sesiones en vivo
            </span>
            , trabajo asincrónico y{' '}
            <span className="text-[#00CCA4] font-semibold">
              mentoría guiada
            </span>
            .
          </p>

          {/* grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* card 1 */}
            <div className="flex items-start gap-4 bg-[#0d0d0d] border border-[#00CCA4]/20 p-6 rounded-2xl shadow-[0_0_20px_rgba(0,204,164,0.05)]">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#00CCA4]/15 text-[#00CCA4] text-xl">
                <FaUsers />
              </div>
              <div>
                <h4 className="font-semibold text-white">Cupo mínimo</h4>
                <p className="text-gray-400 text-sm">
                  50 estudiantes por cohorte
                </p>
              </div>
            </div>

            {/* card 2 */}
            <div className="flex items-start gap-4 bg-[#0d0d0d] border border-[#77039F]/20 p-6 rounded-2xl shadow-[0_0_20px_rgba(119,3,159,0.05)]">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#77039F]/15 text-[#D85DFB] text-xl">
                <FaChalkboardTeacher />
              </div>
              <div>
                <h4 className="font-semibold text-white">Mentoría</h4>
                <p className="text-gray-400 text-sm">
                  Feedback y acompañamiento constante
                </p>
              </div>
            </div>

            {/* card 3 */}
            <div className="flex items-start gap-4 bg-[#0d0d0d] border border-[#BDBE0B]/20 p-6 rounded-2xl shadow-[0_0_20px_rgba(189,190,11,0.05)]">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#BDBE0B]/15 text-[#BDBE0B] text-xl">
                <FaClock />
              </div>
              <div>
                <h4 className="font-semibold text-white">Duración</h4>
                <p className="text-gray-400 text-sm">8 semanas intensivas</p>
              </div>
            </div>

            {/* card 4 */}
            <div className="flex items-start gap-4 bg-[#0d0d0d] border border-blue-400/20 p-6 rounded-2xl shadow-[0_0_20px_rgba(96,165,250,0.05)]">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 text-xl">
                <FaLaptop />
              </div>
              <div>
                <h4 className="font-semibold text-white">Modalidad</h4>
                <p className="text-gray-400 text-sm">
                  100% remota + trabajo asincrónico
                </p>
              </div>
            </div>
          </div>

          {/* estado cerrado */}
          <div className="text-center">
            <div
              className="
              inline-block
              bg-gradient-to-r from-gray-700 to-gray-800
              text-gray-300
              font-semibold
              py-4 px-10
              rounded-xl
              border border-white/10
              shadow-[0_0_20px_rgba(255,255,255,0.05)]
              cursor-not-allowed
              text-lg
              opacity-80
              "
            >
              Convocatoria cerrada
            </div>

            <p className="text-gray-500 text-sm mt-4">
              Próxima apertura: Octava edición próximamente
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

