'use client'

import { FaUsers, FaChalkboardTeacher, FaClock, FaLaptop } from 'react-icons/fa'

export default function AdmissionsSection() {
  return (
    <section className="w-full bg-gray-950 text-white py-16 px-4 md:px-12">
      {/* Encabezado */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Admisiones y Cohortes
        </h2>
        <p className="text-gray-300 text-lg">
          Únete a nuestras cohortes abiertas y gratuitas para la comunidad tech
          y vive una experiencia práctica de aprendizaje en equipo con mentoría
          especializada.
        </p>
      </div>

      {/* Contenido principal */}
      <div className="bg-gray-900 rounded-2xl p-8 shadow-lg border-l-4 border-indigo-500 max-w-4xl mx-auto">
        <p className="text-gray-300 mb-6">
          Cada cohorte reúne al menos{' '}
          <span className="font-semibold text-white">50 estudiantes</span>,
          organizados en equipos de desarrollo de software. El programa combina{' '}
          <span className="text-indigo-400 font-semibold">
            sesiones en vivo
          </span>
          , trabajo asincrónico y{' '}
          <span className="text-indigo-400 font-semibold">
            {' '}
            mentoría guiada{' '}
          </span>
          para garantizar una experiencia de aprendizaje integral.
        </p>

        {/* Grid de características */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div className="flex items-start gap-4 bg-gray-800 p-4 rounded-xl">
            <FaUsers className="text-2xl text-indigo-400" />
            <div>
              <h4 className="font-semibold text-indigo-300">Cupo mínimo</h4>
              <p className="text-gray-300 text-sm">
                50 estudiantes por cohorte
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-gray-800 p-4 rounded-xl">
            <FaChalkboardTeacher className="text-2xl text-indigo-400" />
            <div>
              <h4 className="font-semibold text-indigo-300">Mentoría</h4>
              <p className="text-gray-300 text-sm">
                Sesiones en vivo, feedback y acompañamiento constante
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-gray-800 p-4 rounded-xl">
            <FaClock className="text-2xl text-indigo-400" />
            <div>
              <h4 className="font-semibold text-indigo-300">Duración</h4>
              <p className="text-gray-300 text-sm">8 semanas intensivas</p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-gray-800 p-4 rounded-xl">
            <FaLaptop className="text-2xl text-indigo-400" />
            <div>
              <h4 className="font-semibold text-indigo-300">Modalidad</h4>
              <p className="text-gray-300 text-sm">
                100% remota (Google Meet) + trabajo asincrónico
              </p>
            </div>
          </div>
        </div>

        {/* Botón de convocatoria */}
        <div className="text-center">
          <a
            href="https://tally.so/r/wkqAM1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition"
          >
            Postular a la Septima Edición
          </a>
        </div>
      </div>
    </section>
  )
}
