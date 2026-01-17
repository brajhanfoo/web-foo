'use client'

import React from 'react'
import { FaLaptopCode, FaUsers, FaRocket } from 'react-icons/fa'
import { AiOutlineTool, AiOutlineStar, AiOutlineBook } from 'react-icons/ai' // íconos nuevos

const AboutSection: React.FC = () => {
  return (
    <section className="w-full bg-black text-white py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Título */}
        <h2 className="text-3xl md:text-4xl font-bold">Smart Project</h2>

        {/* Descripción */}
        <p className="mt-6 text-gray-300 leading-relaxed">
          Es un{' '}
          <span className="text-purple-400 font-semibold">
            programa formativo intensivo
          </span>{' '}
          de 8 semanas diseñado para enseñar habilidades prácticas en desarrollo
          de software y diseño, donde los participantes (profesionales o
          aspirantes tech de diversas áreas) trabajan en equipos
          interdisciplinarios para crear{' '}
          <span className="text-purple-400 font-semibold">
            productos digitales de práctica
          </span>
          . <br /> <br />
          Durante todo el proceso se aplica una metodología guiada por mentores,
          en un entorno que simula la experiencia laboral usando herramientas de
          la industria como Figma, metodologías ágiles y buenas prácticas de
          diseño y desarrollo.
        </p>
      </div>

      {/* Tarjetas / Cards */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 max-w-6xl mx-auto">
        {/* Card 1 */}
        <div className="border-2 border-purple-500 rounded-xl p-6 flex flex-col items-center text-center">
          <FaLaptopCode className="w-10 h-10 mb-3 text-purple-500" />
          <h3 className="text-lg font-bold">Simulación Real</h3>
          <p className="text-gray-400 text-sm mt-2">
            Productos de software funcionales <br /> desarrollados en 8 semanas
          </p>
        </div>

        {/* Card 2 */}
        <div className="border-2 border-gray-700 rounded-xl p-6 flex flex-col items-center text-center">
          <FaUsers className="w-10 h-10 mb-3 text-gray-300" />
          <h3 className="text-lg font-bold">Equipos Interdisciplinarios</h3>
          <p className="text-gray-400 text-sm mt-2">
            Profesionales de distintas áreas <br /> trabajando juntos
          </p>
        </div>

        {/* Card 3 */}
        <div className="border-2 border-[#DBC597] rounded-xl p-6 flex flex-col items-center text-center">
          <FaRocket className="w-10 h-10 mb-3 text-[#E7E51A]" />
          <h3 className="text-lg font-bold text-[#E7E51A]">Metodología Ágil</h3>
          <p className="text-gray-400 text-sm mt-2">
            Desarrollo iterativo aplicando <br /> buenas prácticas de la
            industria
          </p>
        </div>

        {/* Card 4 — Herramienta central */}
        <div className="border-2 border-blue-500 rounded-xl p-6 flex flex-col items-center text-center">
          <AiOutlineTool className="w-10 h-10 mb-3 text-blue-500" />
          <h3 className="text-lg font-bold">Herramienta central</h3>
          <p className="text-gray-400 text-sm mt-2">
            Figma será la herramienta principal de diseño UI/UX, usada para
            prototipos, pruebas de usabilidad y desarrollo de interfaces
          </p>
        </div>

        {/* Card 5 — Propósito educativo */}
        <div className="border-2 border-green-500 rounded-xl p-6 flex flex-col items-center text-center">
          <AiOutlineStar className="w-10 h-10 mb-3 text-green-500" />
          <h3 className="text-lg font-bold">Propósito educativo</h3>
          <p className="text-gray-400 text-sm mt-2">
            Los proyectos realizados no son trabajos para clientes ni generan
            ingresos; son productos de práctica con fines de aprendizaje
          </p>
        </div>

        {/* Card 6 — Estructura guiada */}
        <div className="border-2 border-indigo-500 rounded-xl p-6 flex flex-col items-center text-center">
          <AiOutlineBook className="w-10 h-10 mb-3 text-indigo-500" />
          <h3 className="text-lg font-bold">Estructura guiada</h3>
          <p className="text-gray-400 text-sm mt-2">
            Cada fase del programa está planificada con sesiones, entregas y
            mentorías, garantizando acompañamiento continuo
          </p>
        </div>
      </div>
    </section>
  )
}

export default AboutSection
