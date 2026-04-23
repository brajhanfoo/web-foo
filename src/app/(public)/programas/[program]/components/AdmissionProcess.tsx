'use client'

import React from 'react'
import {
  FaUserPlus,
  FaCheck,
  FaCreditCard,
  FaComments,
  FaTasks,
} from 'react-icons/fa'
import { AiOutlineCheckCircle } from 'react-icons/ai'

const steps = [
  {
    title: 'Registro',
    desc: 'Completa tu perfil',
    detail: 'Aplicas al programa con tu experiencia y motivación',
    icon: FaUserPlus,
    color: '#77039F',
  },
  {
    title: 'Aprobación',
    desc: 'Validación inicial',
    detail: 'Revisamos tu perfil para continuar al proceso',
    icon: FaCheck,
    color: '#00CCA4',
  },
  {
    title: 'Acceso',
    desc: 'Activas tu proceso',
    detail: 'Habilita entrevista + evaluación + feedback',
    icon: FaCreditCard,
    color: '#BDBE0B',
  },
  {
    title: 'Entrevista',
    desc: 'Evaluación técnica',
    detail: 'Analizamos tu criterio y comunicación',
    icon: FaComments,
    color: '#3B82F6',
  },
  {
    title: 'Desafío',
    desc: 'Caso práctico',
    detail: 'Simulación de una situación real',
    icon: FaTasks,
    color: '#4ADE80',
  },
  {
    title: 'Resultado',
    desc: 'Feedback final',
    detail: 'Recibes tu evaluación y estado de ingreso',
    icon: AiOutlineCheckCircle,
    color: '#6366F1',
  },
]

const AdmissionFlow: React.FC = () => {
  return (
    <section className="w-full bg-black text-white py-20 px-6">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold">Proceso de Ingreso</h2>
        <p className="text-gray-400 mt-4">
          Un flujo claro para evaluar tu nivel y asegurar una experiencia real
          de trabajo.
        </p>
      </div>

      {/* Timeline */}
      <div className="mt-20 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-12 md:gap-6 relative">
          {/* Línea */}
          <div className="hidden md:block absolute top-12 left-0 right-0 h-[2px] bg-gray-800" />

          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center relative z-10 max-w-[160px]"
              >
                {/* Paso */}
                <span className="text-xs text-gray-500 mb-2">
                  Paso {index + 1}
                </span>

                {/* Icono */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center border-2 bg-black"
                  style={{ borderColor: step.color }}
                >
                  <Icon className="w-7 h-7" style={{ color: step.color }} />
                </div>

                {/* Texto */}
                <h3 className="mt-4 font-semibold">{step.title}</h3>

                <p className="text-gray-400 text-sm mt-1">{step.desc}</p>

                <p className="text-gray-600 text-xs mt-2 leading-snug">
                  {step.detail}
                </p>

                {/* Badge SOLO para pago */}
                {step.title === 'Acceso' && (
                  <span className="mt-2 text-[10px] px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                    Requiere pago
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Cierre */}
      <div className="mt-16 text-center max-w-xl mx-auto">
        <p className="text-gray-400 text-sm">
          No todos avanzan. Este proceso asegura que trabajes con perfiles
          alineados en nivel y compromiso.
        </p>

        <p className="text-gray-600 text-xs mt-4">
          El acceso al proceso incluye evaluación técnica y feedback
          personalizado. El pago no garantiza el ingreso al programa.
        </p>
      </div>
    </section>
  )
}

export default AdmissionFlow
