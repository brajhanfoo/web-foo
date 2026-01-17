'use client'
import { useState } from 'react'
import { FaChevronDown } from 'react-icons/fa'

export default function PreguntasFrecuentes() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const faqs = [
    {
      question: '¿Quiénes pueden participar en los Smart Projects?',
      answer:
        'Personas motivadas por aprender sobre tecnología, diseño, desarrollo, producto o testing. No es requisito estar laboralmente en el área, sino tener interés genuino. Requisito mínimo: conocimientos básicos del rol al que aplicas.',
    },
    {
      question: '¿Qué nivel de experiencia se requiere para participar?',
      answer:
        'Solo necesitas haber completado un curso en Project Management, Análisis Funcional, UX/UI, Frontend, Backend o Testing QA, o tener conocimientos básicos en el rol al que postulas. Ofrecemos aprendizaje práctico y apoyo continuo para distintos niveles.',
    },
    {
      question: '¿Cuál es la duración de los programas?',
      answer:
        'La duración de los programas varía según el formato. Por ejemplo: Smart Projects: 8 semanas.',
    },
    {
      question: '¿Recibiré un certificado al finalizar el programa?',
      answer:
        '¡Sí! Al finalizar el programa, recibirás un certificado que avala tu participación y el trabajo realizado, ideal para enriquecer tu portafolio y tu CV.',
    },
    {
      question: '¿Qué soporte se ofrece durante los programas?',
      answer:
        'Tendrás acceso a mentores experimentados, guías prácticas, y grupos de ayuda en Slack para resolver dudas, además de revisiones periódicas de tus avances.',
    },
  ]

  return (
    <section className="w-full bg-gray-950 text-white py-16 px-4 md:px-12">
      {/* Encabezado */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Preguntas Frecuentes
        </h2>
        <p className="text-gray-300 text-lg">
          Resolvemos las dudas más comunes sobre nuestros programas y su
          funcionamiento.
        </p>
      </div>

      {/* Acordeón de preguntas */}
      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-gray-900 rounded-xl shadow-md border border-gray-800"
          >
            <button
              onClick={() => toggleIndex(index)}
              className="flex justify-between items-center w-full text-left px-6 py-4 focus:outline-none"
            >
              <span className="font-semibold text-purple-400">
                {faq.question}
              </span>
              <FaChevronDown
                className={`text-gray-400 transform transition-transform ${
                  openIndex === index ? 'rotate-180 text-indigo-400' : ''
                }`}
              />
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4 text-gray-300">{faq.answer}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
