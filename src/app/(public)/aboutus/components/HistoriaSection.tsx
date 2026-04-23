'use client'

import { FaHandsHelping, FaHistory, FaRocket } from 'react-icons/fa'
import React from 'react'

export default function HistoriaSection() {
  return (
    <section className="relative w-full bg-black text-white py-24 px-6 md:px-12 overflow-hidden">
      {/* Glow branding */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#77039F] opacity-20 blur-[140px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#00CCA4] opacity-20 blur-[140px]" />

      <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* TEXTO */}
        <div>
          {/* eyebrow */}
          <p className="text-sm tracking-[0.25em] text-[#BDBE0B] uppercase mb-4">
            Nuestra evolución
          </p>

          {/* titulo */}
          <h2 className="text-4xl md:text-5xl font-extrabold mb-8 leading-tight">
            De comunidad tech a{' '}
            <span className="bg-gradient-to-r from-[#00CCA4] to-[#D85DFB] bg-clip-text text-transparent">
              startup EdTech internacional
            </span>
          </h2>

          {/* texto */}
          <p className="text-gray-300 leading-relaxed mb-5 text-lg">
            Foo Talent Group nace en 2022 con una visión clara: conectar el{' '}
            <span className="text-white font-semibold">
              desarrollo tecnológico real
            </span>{' '}
            con la formación práctica de nuevos talentos en Latinoamérica.
          </p>

          <p className="text-gray-400 leading-relaxed mb-5">
            Creamos un modelo educativo basado en{' '}
            <span className="text-[#00CCA4] font-semibold">
              experiencia real de trabajo
            </span>
            , mentoría y colaboración entre roles tech. Nuestro enfoque no busca
            solo enseñar teoría, sino acelerar la empleabilidad mediante
            proyectos reales y simulaciones profesionales.
          </p>

          <p className="text-gray-400 leading-relaxed">
            Hoy evolucionamos hacia una{' '}
            <span className="text-[#D85DFB] font-semibold">
              startup EdTech escalable
            </span>{' '}
            que conecta talento junior, mentores y organizaciones en un
            ecosistema de aprendizaje práctico con impacto social.
          </p>

          {/* CARD highlight */}
          <div className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <FaHandsHelping className="text-3xl text-[#00CCA4]" />
              <div>
                <h3 className="font-semibold text-white text-lg">
                  Proyectos con impacto real
                </h3>
                <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                  Desarrollamos soluciones digitales para ONGs y organizaciones
                  sociales sin costo, permitiendo que nuestros trainees obtengan
                  experiencia profesional mientras generan impacto positivo en
                  la comunidad.
                </p>
              </div>
            </div>
          </div>

          {/* mini stats vibe startup */}
          <div className="flex gap-8 mt-10 flex-wrap">
            <div>
              <p className="text-3xl font-bold text-[#00CCA4]">2022</p>
              <p className="text-gray-500 text-sm">Año de inicio</p>
            </div>

            <div>
              <p className="text-3xl font-bold text-[#D85DFB]">LATAM</p>
              <p className="text-gray-500 text-sm">Comunidad activa</p>
            </div>

            <div>
              <p className="text-3xl font-bold text-[#BDBE0B]">EdTech</p>
              <p className="text-gray-500 text-sm">Modelo escalable</p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12">
            <a
              href="https://api.whatsapp.com/send/?phone=51930428602&text=Hola+Foo+Talent+Group%2C+quisiera+m%C3%A1s+informaci%C3%B3n&type=phone_number&app_absent=0"
              className="
              inline-flex items-center gap-3
              bg-gradient-to-r from-[#77039F] to-[#D85DFB]
              hover:from-[#6a028a] hover:to-[#c94af0]
              text-white
              font-semibold
              px-7 py-4
              rounded-xl
              shadow-[0_0_30px_rgba(216,93,251,0.35)]
              transition
              "
            >
              Conectar con Foo Talent
              <FaRocket />
            </a>
          </div>
        </div>

        {/* VISUAL DERECHO */}
        <div className="relative">
          <div
            className="w-full h-[420px] rounded-3xl overflow-hidden relative"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.65)), url('https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          {/* badge glass */}
          <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">
            <FaHistory className="text-[#BDBE0B] text-xl" />
            <div>
              <p className="text-sm font-semibold text-white">
                Construyendo desde 2022
              </p>
              <p className="text-xs text-gray-400">
                Comunidad → Startup EdTech
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

