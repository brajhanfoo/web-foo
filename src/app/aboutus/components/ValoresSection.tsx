"use client"

import { FaHandsHelping, FaRocket, FaUsers, FaBookOpen } from "react-icons/fa"

export default function ValoresSection() {
  const valores = [
    {
      icon: <FaUsers className="text-4xl text-[#e7e51a]" />,
      title: "Colaboración",
      description:
        "Fomentamos el trabajo en equipo entre profesionales y estudiantes, creando un entorno de crecimiento conjunto.",
    },
    {
      icon: <FaRocket className="text-4xl text-[#780b90]" />,
      title: "Innovación",
      description:
        "Como comunidad tecnológica, aplicamos soluciones modernas tanto en proyectos de clientes como en programas de formación.",
    },
    {
      icon: <FaHandsHelping className="text-4xl text-[#e7e51a]" />,
      title: "Responsabilidad Social",
      description:
        "Impulsamos programas educativos gratuitos para que nuevos talentos tengan su primera experiencia en el sector IT.",
    },
    {
      icon: <FaBookOpen className="text-4xl text-[#780b90]" />,
      title: "Educación Abierta",
      description:
        "Integramos la enseñanza práctica dentro de nuestra actividad empresarial, generando impacto en la comunidad tecnológica.",
    },
  ]

  return (
    <section className="w-full bg-[#000000] text-white py-20 px-6 md:px-12">
      {/* Encabezado */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#e7e51a]">
          Nuestros Valores
        </h2>
        <p className="text-gray-300 text-lg">
          Como comunidad tecnológica, guiamos nuestras acciones con principios que equilibran innovación, responsabilidad y formación de nuevos talentos.
        </p>
      </div>

      {/* Grid de valores */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
        {valores.map((valor, index) => (
          <div
            key={index}
            className="bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-800 hover:border-[#e7e51a] hover:shadow-xl transition transform hover:-translate-y-1 text-center"
          >
            {/* Icono */}
            <div className="flex justify-center mb-4">{valor.icon}</div>

            {/* Título */}
            <h3 className="text-xl font-semibold mb-2 text-white">
              {valor.title}
            </h3>

            {/* Descripción */}
            <p className="text-gray-400 text-sm">{valor.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

