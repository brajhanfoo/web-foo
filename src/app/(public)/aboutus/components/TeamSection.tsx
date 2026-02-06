'use client'

import React from 'react'
import Image from 'next/image'

const team = [
  {
    name: 'Brajhan Lopez',
    role: 'CEO · Co-Founder',
    image:
      'https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1758937336/Foo%20Talent%20group/Founders/Brajhan_idobfh.jpg?_s=public-apps',
    description:
      'Ingeniero de Sistemas y Full Stack Developer enfocado en construir soluciones tecnológicas escalables y modelos educativos innovadores.',
  },
  {
    name: 'Gonzalo Rodriguez',
    role: 'COO · Co-Founder',
    image:
      'https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1758937337/Foo%20Talent%20group/Founders/Gonza_vepndf.jpg?_s=public-apps',
    description:
      'Frontend Developer y Project Manager enfocado en operaciones tech y escalabilidad de equipos remotos.',
  },
  {
    name: 'Mariana Ruiz',
    role: 'CMO · Co-Founder',
    image:
      'https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1758937336/Foo%20Talent%20group/Founders/Mariana_bml695.jpg?_s=public-apps',
    description:
      'Especialista en comunicación digital y crecimiento de comunidades tech en LATAM.',
  },
  {
    name: 'Luis Navarro',
    role: 'CTO · Co-Founder',
    image:
      'https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1758937336/Foo%20Talent%20group/Founders/Luis_xnagpd.jpg?_s=public-apps',
    description:
      'Full Stack Developer enfocado en arquitectura escalable y desarrollo de productos digitales.',
  },
  {
    name: 'Viviana Galarza',
    role: 'Product Designer',
    image:
      'https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1758937337/Foo%20Talent%20group/Founders/Viviana_ldiuou.jpg?_s=public-apps',
    description:
      'Product Designer centrada en experiencia de usuario y diseño de productos digitales.',
  },
]

export default function TeamSection() {
  return (
    <section className="relative w-full py-28 bg-[#050507] text-white overflow-hidden">

      {/* ===== BACKGROUND NUEVO ===== */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050507] to-black" />

      {/* glow diferente */}
      <div className="absolute top-[-120px] right-[-120px] w-[420px] h-[420px] bg-[#00CCA4] opacity-20 blur-[140px]" />
      <div className="absolute bottom-[-120px] left-[-120px] w-[420px] h-[420px] bg-[#77039F] opacity-20 blur-[140px]" />

      {/* pattern tech */}
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#00CCA422_1px,transparent_1px),linear-gradient(to_bottom,#00CCA422_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">

        {/* ===== HEADER ===== */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <p className="text-sm tracking-[0.3em] text-[#00CCA4] uppercase mb-6">
            Core Team
          </p>

          <h2 className="text-4xl md:text-6xl font-extrabold leading-tight">
            El equipo detrás de una{' '}
            <span className="bg-gradient-to-r from-[#00CCA4] via-[#BDBE0B] to-[#D85DFB] bg-clip-text text-transparent">
              EdTech global
            </span>
          </h2>

          <p className="text-gray-400 mt-6 text-lg">
            Tecnología, educación e innovación combinadas para construir
            oportunidades reales en LATAM.
          </p>
        </div>

        {/* ===== GRID ===== */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {team.map((member, index) => (
            <div
              key={index}
              className="
              group relative
              bg-gradient-to-b from-white/5 to-white/[0.02]
              backdrop-blur-xl
              border border-white/10
              hover:border-[#00CCA4]/60
              rounded-2xl
              p-8
              transition
              duration-500
              hover:-translate-y-2
              "
            >
              {/* glow hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-gradient-to-b from-[#00CCA4]/10 to-transparent" />

              {/* imagen */}
              <div className="relative w-28 h-28 mx-auto mb-6">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="
                  object-cover rounded-full
                  border border-[#00CCA4]/30
                  group-hover:border-[#BDBE0B]
                  transition
                  "
                />
              </div>

              {/* nombre */}
              <h3 className="text-xl font-semibold text-center">
                {member.name}
              </h3>

              {/* rol */}
              <p className="text-[#00CCA4] text-sm text-center mb-4">
                {member.role}
              </p>

              {/* desc */}
              <p className="text-gray-400 text-sm text-center leading-relaxed">
                {member.description}
              </p>
            </div>
          ))}
        </div>

        {/* ===== MENSAJE FINAL ===== */}
        <div className="mt-24 text-center max-w-3xl mx-auto">
          <p className="text-2xl md:text-3xl font-semibold leading-relaxed">
            Construyendo desde LATAM una startup tecnológica{' '}
            <span className="text-[#00CCA4]">lista para inversión global</span>
          </p>

          <p className="text-gray-500 mt-4 text-sm">
            Foo Talent Group · Startup EdTech internacional
          </p>
        </div>
      </div>
    </section>
  )
}
