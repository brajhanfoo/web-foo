'use client'

import { FaBullseye, FaEye, FaGlobe } from 'react-icons/fa'
import React from 'react'

export default function MisionVisionSection() {
  return (
    <section className="relative py-28 bg-black text-white overflow-hidden">
      
      {/* Glow branding */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#77039F] opacity-20 blur-[140px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#00CCA4] opacity-20 blur-[140px]" />

      <div className="relative max-w-6xl mx-auto px-6">
        
        {/* EYEBROW */}
        <p className="text-center text-sm tracking-[0.3em] text-[#BDBE0B] uppercase mb-4">
          Propósito & Dirección
        </p>

        {/* TITULO */}
        <h2 className="text-4xl md:text-6xl font-extrabold text-center mb-16 leading-tight">
          Construyendo la{' '}
          <span className="bg-gradient-to-r from-[#00CCA4] to-[#D85DFB] bg-clip-text text-transparent">
            EdTech del futuro
          </span>
        </h2>

        {/* CARDS */}
        <div className="grid md:grid-cols-2 gap-10">
          
          {/* MISION */}
          <div className="group bg-white/5 backdrop-blur-xl border border-white/10 hover:border-[#00CCA4]/40 transition rounded-3xl p-10">
            
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-xl bg-[#00CCA4]/10">
                <FaBullseye className="text-3xl text-[#00CCA4]" />
              </div>
              <h3 className="text-2xl font-bold">Misión</h3>
            </div>

            <p className="text-gray-300 leading-relaxed text-lg">
              Acelerar la inserción laboral de talento tecnológico en Latinoamérica
              mediante un modelo de{' '}
              <span className="text-white font-semibold">
                experiencia práctica real
              </span>
              , mentoría y colaboración profesional.
            </p>

            <p className="text-gray-400 mt-4 leading-relaxed">
              Diseñamos programas educativos escalables que conectan talento junior,
              mentores y organizaciones en un ecosistema donde aprender significa
              construir productos reales y adquirir experiencia verificable.
            </p>

            {/* badge */}
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-[#00CCA4]/10 text-[#00CCA4] text-sm rounded-lg">
                Experiencia real
              </span>
              <span className="px-4 py-2 bg-[#D85DFB]/10 text-[#D85DFB] text-sm rounded-lg">
                Mentoría
              </span>
              <span className="px-4 py-2 bg-[#BDBE0B]/10 text-[#BDBE0B] text-sm rounded-lg">
                Comunidad LATAM
              </span>
            </div>
          </div>

          {/* VISION */}
          <div className="group bg-white/5 backdrop-blur-xl border border-white/10 hover:border-[#D85DFB]/40 transition rounded-3xl p-10">
            
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-xl bg-[#D85DFB]/10">
                <FaEye className="text-3xl text-[#D85DFB]" />
              </div>
              <h3 className="text-2xl font-bold">Visión</h3>
            </div>

            <p className="text-gray-300 leading-relaxed text-lg">
              Convertirnos en la{' '}
              <span className="text-white font-semibold">
                plataforma EdTech líder en experiencia profesional temprana
              </span>{' '}
              para talento tech en mercados emergentes.
            </p>

            <p className="text-gray-400 mt-4 leading-relaxed">
              Buscamos escalar un ecosistema global donde empresas, mentores e
              instituciones colaboren en la formación de talento listo para la
              industria, reduciendo la brecha entre educación y empleabilidad.
            </p>

            {/* vision badge */}
            <div className="mt-8 flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-3">
              <FaGlobe className="text-[#BDBE0B]" />
              <span className="text-sm text-gray-300">
                Expansión LATAM → Global EdTech
              </span>
            </div>
          </div>
        </div>

        {/* FRASE INVERSION */}
        <div className="text-center mt-20">
          <p className="text-gray-500 text-sm">
            Diseñando una infraestructura educativa escalable para el talento tech del futuro.
          </p>
        </div>
      </div>
    </section>
  )
}
