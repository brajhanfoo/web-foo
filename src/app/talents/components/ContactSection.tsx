'use client'

import {
  FaLinkedin,
  FaInstagram,
  FaFacebook,
  FaEnvelope,
  FaHandsHelping,
} from 'react-icons/fa'

export default function ContactSection() {
  return (
    <section
      id="contact"
      className="bg-gradient-to-r from-indigo-950 via-purple-900 to-indigo-950 text-white py-20 px-6"
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-6 text-white">
          💡 Súmate a Foo Talent Group
        </h2>
        <p className="text-lg text-gray-200 mb-10 leading-relaxed">
          Los{' '}
          <span className="font-semibold text-purple-300">Smart Projects</span>{' '}
          son gratuitos e ilimitados para toda la comunidad tech. Si eres
          talento, puedes unirte a través de nuestras redes sociales. Y si eres
          empresa o persona con buen corazón, puedes apoyarnos como mentor,
          jurado o con recursos para que el programa siga creciendo.
        </p>

        {/* Redes sociales */}
        <div className="mb-10">
          <p className="font-medium text-purple-300 mb-4">
            📲 Escríbenos en redes sociales
          </p>
          <div className="flex justify-center space-x-6">
            <a
              href="https://www.linkedin.com/company/footalentgroup/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-gray-800 hover:bg-purple-600 transition"
            >
              <FaLinkedin className="w-6 h-6 text-white" />
            </a>

            <a
              href="https://www.instagram.com/footalentgroup"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-gray-800 hover:bg-purple-600 transition"
            >
              <FaInstagram className="w-6 h-6 text-white" />
            </a>
            <a
              href="https://www.facebook.com/footalentgroup"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-gray-800 hover:bg-purple-600 transition"
            >
              <FaFacebook className="w-6 h-6 text-white" />
            </a>
          </div>
        </div>

        {/* Empresas u organizaciones */}
        <div className="bg-gray-900 p-6 rounded-2xl inline-block shadow-lg border border-purple-600">
          <p className="flex items-center justify-center gap-2 text-lg font-semibold text-purple-300 mb-3">
            <FaHandsHelping className="text-purple-400 w-6 h-6" />
            ¿Quieres apoyarnos?
          </p>
          <p className="text-gray-300 mb-4 text-sm">
            Escríbenos para ser mentor, jurado o patrocinador en nuestras
            ediciones.
          </p>
          <div className="flex items-center justify-center">
            <FaEnvelope className="w-6 h-6 mr-3 text-purple-400" />
            <a
              href="mailto:contacto@footalentgroup.com"
              className="text-lg text-purple-400 hover:underline"
            >
              contacto@footalentgroup.com
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
