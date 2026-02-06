'use client'

import { FaBrain, FaCode, FaBriefcase, FaGlobe } from 'react-icons/fa'
import React from 'react'

export default function ModeloFTGSection() {
  return (
    <section className="relative w-full py-28 bg-black text-white overflow-hidden">
      {/* ===== BACKGROUND FUTURISTA ===== */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#07070a] to-black" />

      {/* glow blobs */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-[#780b90] opacity-20 blur-[160px]" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-[#e7e51a] opacity-20 blur-[160px]" />

      {/* grid futurista */}
      <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#ffffff22_1px,transparent_1px),linear-gradient(to_bottom,#ffffff22_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* ===== HEADER ===== */}
        <div className="text-center max-w-4xl mx-auto">
          <p className="text-sm tracking-[0.3em] text-[#e7e51a] uppercase mb-6">
            Modelo educativo FTG
          </p>

          <h2 className="text-4xl md:text-6xl font-extrabold leading-tight">
            Formación tech{' '}
            <span className="bg-gradient-to-r from-[#e7e51a] to-[#780b90] bg-clip-text text-transparent">
              orientada al mundo real
            </span>
          </h2>

          <p className="text-gray-400 mt-6 text-lg md:text-xl leading-relaxed">
            No simulamos experiencias. Construimos, resolvemos y trabajamos como
            en una startup tecnológica internacional.
          </p>
        </div>

        {/* ===== MENSAJE CENTRAL ===== */}
        <div className="mt-20 max-w-5xl mx-auto text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-6">
            Aquí se aprende a{' '}
            <span className="text-[#e7e51a]">resolver problemas reales</span>
          </h3>

          <p className="text-gray-300 text-[17px] leading-relaxed">
            En Foo Talent Group formamos talento capaz de enfrentar desafíos
            reales del mundo laboral tecnológico. Cada participante trabaja en
            proyectos auténticos, toma decisiones técnicas y aprende a pensar
            como profesional desde el primer día.
          </p>

          <p className="text-gray-400 mt-6 text-[16px] leading-relaxed">
            Hacemos énfasis en lo que{' '}
            <strong className="text-white">sirve para conseguir trabajo</strong>
            , no solo en lo que resulta atractivo aprender. Nuestro enfoque
            prioriza herramientas, metodologías y habilidades que realmente
            aumentan la empleabilidad global.
          </p>
        </div>

        {/* ===== PILARES FUTURISTAS ===== */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          {/* card */}
          <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 hover:border-[#780b90] transition rounded-2xl p-7">
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-gradient-to-b from-[#780b90]/10 to-transparent" />
            <FaBrain className="text-3xl text-[#e7e51a] mb-4 relative z-10" />
            <h4 className="font-semibold text-lg mb-3 relative z-10">
              Mentalidad profesional
            </h4>
            <p className="text-gray-400 text-sm leading-relaxed relative z-10">
              Entrenamos la capacidad de analizar, resolver y tomar decisiones
              técnicas como en equipos tecnológicos reales.
            </p>
          </div>

          {/* card */}
          <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 hover:border-[#780b90] transition rounded-2xl p-7">
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-gradient-to-b from-[#780b90]/10 to-transparent" />
            <FaCode className="text-3xl text-[#780b90] mb-4 relative z-10" />
            <h4 className="font-semibold text-lg mb-3 relative z-10">
              Proyectos reales
            </h4>
            <p className="text-gray-400 text-sm leading-relaxed relative z-10">
              Experiencia práctica en desarrollo de software, diseño y QA con
              proyectos reales para organizaciones.
            </p>
          </div>

          {/* card */}
          <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 hover:border-[#780b90] transition rounded-2xl p-7">
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-gradient-to-b from-[#780b90]/10 to-transparent" />
            <FaBriefcase className="text-3xl text-white mb-4 relative z-10" />
            <h4 className="font-semibold text-lg mb-3 relative z-10">
              Enfoque empleabilidad
            </h4>
            <p className="text-gray-400 text-sm leading-relaxed relative z-10">
              Enseñamos lo que el mercado exige: trabajo en equipo, entrega de
              valor, metodologías ágiles y resolución de problemas.
            </p>
          </div>

          {/* card */}
          <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 hover:border-[#780b90] transition rounded-2xl p-7">
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-gradient-to-b from-[#780b90]/10 to-transparent" />
            <FaGlobe className="text-3xl text-[#e7e51a] mb-4 relative z-10" />
            <h4 className="font-semibold text-lg mb-3 relative z-10">
              Mentalidad global
            </h4>
            <p className="text-gray-400 text-sm leading-relaxed relative z-10">
              Talento preparado para trabajar en startups internacionales,
              equipos remotos y ecosistemas tecnológicos globales.
            </p>
          </div>
        </div>

        {/* ===== FRASE FINAL PODEROSA ===== */}
        <div className="mt-24 text-center max-w-3xl mx-auto">
          <p className="text-2xl md:text-3xl font-semibold leading-relaxed">
            No formamos estudiantes.
            <span className="bg-gradient-to-r from-[#e7e51a] to-[#780b90] bg-clip-text text-transparent">
              {' '}
              Formamos talento listo para resolver.
            </span>
          </p>

          <div className="mt-6 text-gray-500 text-sm">
            Startup EdTech internacional construyendo talento tech en LATAM.
          </div>
        </div>
      </div>
    </section>
  )
}
