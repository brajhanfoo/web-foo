'use client'

import { FaLinkedin } from 'react-icons/fa'
import Image from 'next/image'

type Mentor = {
  name: string
  role: string
  description: string
  linkedin: string
  color: string
  image?: string // opcional: si hay foto, se usa
}

const instructors: Mentor[] = [
  {
    name: 'Brajhan López',
    role: 'CEO & Lead Mentor',
    description:
      'Ingeniero de Sistemas y CEO de Foo Talent Group. Experto en desarrollo de software y formación técnica para equipos junior. Responsable pedagógico y mentor en producto y frontend.',
    linkedin: 'https://www.linkedin.com/in/brajhanlopez/',
    color: 'from-indigo-500 to-purple-500',
    image:
      'https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1758937336/Foo%20Talent%20group/Founders/Brajhan_idobfh.jpg?_s=public-apps', // Coloca tu foto en /public/mentores
  },
  {
    name: 'Gonzalo Rodriguez',
    role: 'COO & Mentor en Operaciones',
    description:
      'Encargado de operaciones y gestión de proyectos dentro de Foo Talent Group. Mentor en organización de equipos y buenas prácticas de trabajo colaborativo.',
    linkedin: 'https://www.linkedin.com/in/gonzalo-ezequiel-rodriguez/',
    color: 'from-blue-500 to-cyan-500',
    image:
      'https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1758937337/Foo%20Talent%20group/Founders/Gonza_vepndf.jpg?_s=public-apps',
  },
  {
    name: 'Viviana Galarza',
    role: 'Product Designer & UX Mentor',
    description:
      'Diseñadora de producto especializada en UX/UI. Lidera equipos de diseño y utiliza Figma como herramienta principal para prototipado y diseño centrado en el usuario.',
    linkedin: 'https://www.linkedin.com/in/vivianagalarza/',
    color: 'from-pink-500 to-rose-500',
    image:
      'https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1758937337/Foo%20Talent%20group/Founders/Viviana_ldiuou.jpg?_s=public-apps',
  },
  {
    name: 'Mariana Ruiz',
    role: 'CMO & Mentor en Estrategia',
    description:
      'Especialista en marketing y comunicación. Aporta experiencia en estrategia digital y mentoría en investigación y validación de producto.',
    linkedin: 'https://www.linkedin.com/in/mariana-ruiz-prerovsky/',
    color: 'from-emerald-500 to-green-500',
    image:
      'https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1758937336/Foo%20Talent%20group/Founders/Mariana_bml695.jpg?_s=public-apps',
  },
  {
    name: 'Luis Navarro',
    role: 'CTO & Mentor en Desarrollo',
    description:
      'Desarrollador y líder técnico. Responsable de guiar a los equipos en desarrollo backend y frontend, asegurando buenas prácticas y escalabilidad.',
    linkedin: 'https://www.linkedin.com/in/luisnavarro-fullstack/',
    color: 'from-orange-500 to-yellow-500',
    image:
      'https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1758937336/Foo%20Talent%20group/Founders/Luis_xnagpd.jpg?_s=public-apps',
  },
]

export default function InstructoresMentores() {
  return (
    <section className="w-full bg-gray-950 py-20 text-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Instructores y Mentores
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto mb-16">
          Nuestro equipo está conformado por profesionales en tecnología,
          marketing, diseño y operaciones que acompañan a los estudiantes en su
          proceso de formación. Además, contamos con mentores invitados que
          enriquecen cada cohorte con su experiencia en la industria.
        </p>

        {/* Grid de Instructores */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {instructors.map((mentor, index) => (
            <div
              key={index}
              className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-md hover:shadow-xl hover:border-indigo-500 transition transform hover:-translate-y-1"
            >
              {/* Avatar: foto o inicial */}
              {mentor.image ? (
                <Image
                  src={mentor.image}
                  alt={mentor.name}
                  width={80}
                  height={80}
                  className="mx-auto mb-6 rounded-full object-cover border-2 border-gray-700 shadow-md"
                />
              ) : (
                <div
                  className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-tr ${mentor.color} flex items-center justify-center text-xl font-bold text-white shadow-md`}
                >
                  {mentor.name.charAt(0)}
                </div>
              )}

              {/* Nombre y Rol */}
              <h3 className="text-xl font-semibold text-white">
                {mentor.name}
              </h3>
              <p className="text-sm text-indigo-400 font-medium mb-3">
                {mentor.role}
              </p>

              {/* Descripción */}
              <p className="mt-2 text-gray-400 text-sm">{mentor.description}</p>

              {/* Botón LinkedIn */}
              <a
                href={mentor.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
              >
                <FaLinkedin className="text-lg" />
                LinkedIn
              </a>
            </div>
          ))}
        </div>

        {/* Bloque de Mentores invitados */}
        <div className="mt-20 bg-gray-900 border border-gray-800 rounded-2xl shadow-md p-10 max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          <h3 className="text-2xl font-semibold text-white mb-4">
            Mentores Invitados
          </h3>
          <p className="text-gray-400">
            Profesionales especializados en áreas como UX, UI, Desarrollo y QA.
            Nos acompañan como{' '}
            <span className="text-indigo-400 font-medium">Tech Lead</span> de su
            respectiva área, guiando a los equipos durante cada cohorte. Cada
            edición cuenta con al menos tres mentores activos que realizan
            revisiones en vivo, brindan retroalimentación personalizada y hacen
            seguimiento al progreso de los equipos durante los sprints.
          </p>
        </div>
      </div>
    </section>
  )
}
