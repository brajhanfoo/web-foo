'use client'

import { RiGraduationCapFill } from 'react-icons/ri'

const ProgramHero = () => {
  return (
    <section className="relative w-full h-[380px] flex items-center justify-center overflow-hidden">
      {/* 🌈 Fondo gradiente exacto del diseño */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#2b0a3d] via-[#071b22] to-[#00CCA4]/15" />

      {/* Glow suave izquierdo morado */}
      <div className="absolute -left-32 top-0 w-[420px] h-[420px] bg-[#77039F] opacity-20 blur-[120px] rounded-full" />

      {/* Glow suave derecho verde */}
      <div className="absolute -right-32 top-0 w-[420px] h-[420px] bg-[#00CCA4] opacity-20 blur-[120px] rounded-full" />

      {/* CONTENIDO */}
      <div className="relative z-10 text-center px-6">
        {/* TITULO */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
          Smart{' '}
          <span className="bg-gradient-to-r from-[#00CCA4] to-[#4FC3F7] bg-clip-text text-transparent">
            Projects
          </span>
        </h1>

        {/* SUBTITULO */}
        <p className="mt-4 text-gray-300 text-base md:text-lg">
          Programa intensivo de formación en desarrollo de software.
        </p>

        {/* TEXTO AMARILLO */}
        <p className="mt-3 text-[11px] md:text-xs tracking-[0.25em] text-[#BDBE0B] font-semibold">
          PROPÓSITO EDUCATIVO · COHORTES ABIERTAS
        </p>
      </div>

      {/* LOGO SUPERIOR DERECHO */}
      <div className="absolute top-8 right-8 md:right-16 z-10">
        <div className=" flex flex-col items-center justify-center w-[60px] h-[60px] md:w-[100px] md:h-[100px] rounded-full bg-white/5 backdrop-blur-md border border-white/10 shadow-lg">
          <RiGraduationCapFill className="w-8 h-8 md:w-12 md:h-12 text-[#00CCA4]" />
          <p className="text-white text-[8px] md:text-xs font-light text-center">
            SMART PROJECTS
          </p>
        </div>
      </div>
    </section>
  )
}

export default ProgramHero

