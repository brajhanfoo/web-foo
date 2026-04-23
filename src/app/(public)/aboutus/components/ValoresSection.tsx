'use client'

import { FaHandsHelping, FaRocket, FaUsers, FaBookOpen } from 'react-icons/fa'

export default function ValoresSection() {
  const valores = [
    {
      icon: <FaUsers className="text-3xl text-[#e7e51a]" />,
      title: 'Colaboración',
      description:
        'Fomentamos el trabajo en equipo entre profesionales y estudiantes, creando un entorno de crecimiento conjunto.',
    },
    {
      icon: <FaRocket className="text-3xl text-[#c026ff]" />,
      title: 'Innovación',
      description:
        'Aplicamos tecnología moderna y metodologías ágiles en proyectos reales y programas formativos.',
    },
    {
      icon: <FaHandsHelping className="text-3xl text-[#e7e51a]" />,
      title: 'Responsabilidad Social',
      description:
        'Impulsamos programas gratuitos para que nuevos talentos accedan a su primera experiencia en tecnología.',
    },
    {
      icon: <FaBookOpen className="text-3xl text-[#c026ff]" />,
      title: 'Educación Abierta',
      description:
        'Integramos formación práctica y comunidad para generar impacto real en el ecosistema tech.',
    },
  ]

  return (
    <section className="relative w-full py-28 px-6 md:px-12 text-white overflow-hidden">
      {/* 🌌 Fondo futurista */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#05010a] to-black" />

      {/* Glow morado */}
      <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#a21caf]/20 blur-[160px] rounded-full" />

      {/* Glow amarillo */}
      <div className="absolute bottom-10 left-[20%] w-[300px] h-[300px] bg-[#e7e51a]/10 blur-[120px] rounded-full" />

      <div className="relative z-10">
        {/* 🧠 Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Nuestros <span className="text-[#e7e51a]">Valores</span>
          </h2>

          <p className="text-gray-300 text-lg leading-relaxed">
            Construimos una comunidad tecnológica basada en aprendizaje real,
            colaboración y crecimiento profesional. Más que una empresa, somos
            un ecosistema de talento.
          </p>
        </div>

        {/* 🚀 Grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {valores.map((valor, index) => (
            <div
              key={index}
              className="
              group relative
              bg-gradient-to-b from-[#0d0d0d] to-[#050505]
              backdrop-blur-xl
              rounded-2xl p-8
              border border-gray-800
              hover:border-[#e7e51a]
              transition-all duration-500
              hover:-translate-y-3
              hover:shadow-[0_0_60px_rgba(162,28,175,0.35)]
              "
            >
              {/* línea glow superior */}
              <div className="h-[2px] w-0 group-hover:w-full bg-gradient-to-r from-transparent via-[#e7e51a] to-transparent transition-all duration-700 mb-6 mx-auto" />

              {/* icono */}
              <div className="flex justify-center mb-6">
                <div
                  className="
                  w-16 h-16 flex items-center justify-center
                  rounded-xl
                  bg-black
                  border border-gray-800
                  group-hover:border-[#e7e51a]
                  group-hover:shadow-[0_0_25px_rgba(231,229,26,0.6)]
                  transition
                  "
                >
                  {valor.icon}
                </div>
              </div>

              {/* título */}
              <h3 className="text-xl font-semibold mb-3 text-white text-center">
                {valor.title}
              </h3>

              {/* descripción */}
              <p className="text-gray-400 text-sm text-center leading-relaxed">
                {valor.description}
              </p>

              {/* glow hover fondo */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none bg-gradient-to-b from-[#a21caf]/10 to-transparent" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

