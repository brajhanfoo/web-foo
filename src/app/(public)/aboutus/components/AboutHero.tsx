'use client'

import { FaUsers, FaLightbulb } from 'react-icons/fa'

export default function AboutHero() {
  return (
    <section className="relative w-full min-h-[92vh] flex items-center justify-center text-center text-white overflow-hidden">
      {/* Background imagen */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.pexels.com/photos/1015568/pexels-photo-1015568.jpeg')",
        }}
      />

      {/* Overlay oscuro mejorado */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/85 to-black/95" />

      {/* Glow branding FTG */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#77039F] opacity-20 blur-[140px]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#00CCA4] opacity-20 blur-[140px]" />

      {/* Contenido */}
      <div className="relative z-10 max-w-4xl px-6">
        {/* Eyebrow */}
        <p className="text-sm tracking-[0.25em] text-[#BDBE0B] mb-6 uppercase font-medium">
          Startup EdTech · Comunidad Tech LATAM
        </p>

        {/* Título */}
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
          Somos{' '}
          <span className="bg-gradient-to-r from-[#00CCA4] to-[#D85DFB] bg-clip-text text-transparent">
            Foo Talent Group
          </span>
        </h1>

        {/* Descripción */}
        <p className="text-lg md:text-xl text-gray-300 mb-12 leading-relaxed">
          Una EdTech con{' '}
          <span className="text-white font-semibold">
            propósito educativo real
          </span>{' '}
          que impulsa el crecimiento de talento en tecnología mediante{' '}
          <span className="text-[#00CCA4] font-semibold">
            experiencia práctica, mentoría y proyectos reales
          </span>
          . Construimos espacios donde desarrolladores, diseñadores, PMs y QA
          colaboran para adquirir experiencia profesional antes de ingresar al
          mercado laboral.
        </p>

        {/* Valores */}
        <div className="flex flex-col sm:flex-row justify-center gap-10">
          {/* Card 1 */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-6 shadow-[0_0_40px_rgba(255,255,255,0.03)]">
            <FaUsers className="text-4xl text-[#00CCA4] mb-3 mx-auto" />
            <p className="font-semibold text-white">Cohortes abiertas</p>
            <p className="text-sm text-gray-400 mt-1">
              Talento tech de toda LATAM
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-6 shadow-[0_0_40px_rgba(255,255,255,0.03)]">
            <FaLightbulb className="text-4xl text-[#D85DFB] mb-3 mx-auto" />
            <p className="font-semibold text-white">Innovación educativa</p>
            <p className="text-sm text-gray-400 mt-1">
              Experiencia real sobre teoría
            </p>
          </div>
        </div>

        {/* Frase final */}
        <p className="mt-14 text-gray-500 text-sm">
          Formando la próxima generación de talento tech en LATAM.
        </p>
      </div>
    </section>
  )
}

