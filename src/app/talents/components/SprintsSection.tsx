'use client'

import {
  FaSearch,
  FaBug,
  FaCode,
  FaPaintBrush,
  FaUsers,
  FaCertificate,
} from 'react-icons/fa'

export default function SprintsSection() {
  return (
    <section className="w-full bg-black text-white py-16 px-4 md:px-12">
      {/* Encabezado */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Metodología de Desarrollo por Sprints
        </h2>
        <p className="text-gray-300">
          Un enfoque iterativo e incremental para el desarrollo de software
          centrado en el usuario
        </p>
      </div>

      <div className="space-y-10 max-w-5xl mx-auto">
        {/* Sprint 0 */}
        <div className="bg-gray-900 rounded-2xl p-6 border-l-4 border-blue-500 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">
            Sprint 0 (1 semana) :{' '}
            <span className="text-blue-400">Fase de Requerimientos</span>
          </h3>
          <ul className="list-disc pl-6 text-gray-300 space-y-1">
            <li>Definición de objetivos del proyecto</li>
            <li>Recopilación de requerimientos funcionales</li>
            <li>Análisis de stakeholders</li>
            <li>Definición del alcance del proyecto</li>
          </ul>
        </div>

        {/* Sprint 1 */}
        <div className="bg-gray-900 rounded-2xl p-6 border-l-4 border-purple-500 shadow-lg">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FaSearch className="text-purple-400" /> Sprint 1 (2 semanas) :
            <span className="text-purple-400">Investigación UX</span>
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-4 rounded-xl shadow">
              <h4 className="font-semibold text-purple-300 mb-2">
                🎯 Objetivo
              </h4>
              <p className="text-gray-300">
                Hacer que el diseño sea entendible para las personas que usarán
                el software.
              </p>
            </div>

            <div className="bg-gray-800 p-4 rounded-xl shadow">
              <h4 className="font-semibold text-purple-300 mb-2">
                🤝 Colaboración
              </h4>
              <p className="text-gray-300">
                Los desarrolladores y QA colaboran estrechamente con los
                diseñadores UX/UI ejecutando pruebas de concepto.
              </p>
            </div>
          </div>
        </div>

        {/* Sprint 2 - 4 */}
        <div className="bg-gray-900 rounded-2xl p-6 border-l-4 border-green-500 shadow-lg">
          <h3 className="text-xl font-semibold mb-6">
            Sprint 2 - 4 (3 semanas) :
            <span className="text-green-400"> 3 Entregas Incrementales</span>
          </h3>

          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center bg-gray-800 p-4 rounded-xl shadow">
              <FaPaintBrush className="text-3xl text-orange-400 mb-2" />
              <h4 className="font-semibold text-orange-300">UX/UI</h4>
              <p className="text-gray-300 text-sm">
                Prototipos en alta fidelidad
              </p>
            </div>

            <div className="flex flex-col items-center bg-gray-800 p-4 rounded-xl shadow">
              <FaCode className="text-3xl text-blue-400 mb-2" />
              <h4 className="font-semibold text-blue-300">Devs</h4>
              <p className="text-gray-300 text-sm">
                Desarrollo de funcionalidades
              </p>
            </div>

            <div className="flex flex-col items-center bg-gray-800 p-4 rounded-xl shadow">
              <FaBug className="text-3xl text-red-400 mb-2" />
              <h4 className="font-semibold text-red-300">QA</h4>
              <p className="text-gray-300 text-sm">Pruebas continuas</p>
            </div>
          </div>

          <div className="mt-6 bg-green-800/30 border border-green-500 p-4 rounded-xl text-center">
            <h4 className="text-green-300 font-semibold">
              💻 Producto de Software
            </h4>
            <p className="text-gray-300 text-sm">
              En estos sprints se construye el producto en ciclos iterativos con
              entregas incrementales.
            </p>
          </div>
        </div>

        {/* Demo Day */}
        <div className="bg-gray-900 rounded-2xl p-6 border-l-4 border-yellow-500 shadow-lg">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FaUsers className="text-yellow-400" /> Demo Day
          </h3>
          <p className="text-gray-300 mb-4">
            En este evento participan todos los equipos, mostrando sus
            desarrollos finales. Se invita a jurados del mundo IT que evalúan
            los proyectos y brindan retroalimentación profesional.
          </p>
          <a
            href="https://www.youtube.com/watch?v=UjZCvISgxLA"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-lg transition"
          >
            🎥 Ver última edición
          </a>
        </div>

        {/* Sprint 5 */}
        <div className="bg-gray-900 rounded-2xl p-6 border-l-4 border-cyan-500 shadow-lg">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FaCertificate className="text-cyan-400" /> Sprint 5 (2 semanas) :{' '}
            <span className="text-cyan-400">Correcciones y Certificación</span>
          </h3>
          <p className="text-gray-300 mb-4">
            Durante este sprint, los equipos realizan las correcciones
            observadas en la Demo Day. Una vez finalizadas y aprobadas, los
            participantes reciben la certificación correspondiente.
          </p>
          <a
            href="https://shell-cook-a6a.notion.site/T-rminos-y-Condiciones-de-Participaci-n-142a0dc17c77804ab7ecc91294615676" // <-- Pon aquí tu enlace real
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-4 py-2 rounded-lg transition"
          >
            📜 Ver detalles de certificación
          </a>
        </div>
      </div>
    </section>
  )
}
