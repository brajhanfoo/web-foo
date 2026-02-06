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
        'Personas motivadas por aprender sobre tecnología, diseño, desarrollo, producto o testing. No es requisito estar laboralmente en el área, sino tener interés genuino.',
    },
    {
      question: '¿Qué nivel de experiencia se requiere para participar?',
      answer:
        'Solo necesitas conocimientos básicos del rol al que postulas. Ofrecemos aprendizaje práctico y mentoría durante todo el programa.',
    },
    {
      question: '¿Cuál es la duración de los programas?',
      answer:
        'Smart Projects tiene una duración de 8 semanas intensivas con sesiones en vivo, trabajo en equipo y mentoría.',
    },
    {
      question: '¿Recibiré un certificado al finalizar el programa?',
      answer:
        'Sí. Al finalizar recibirás un certificado de participación ideal para tu CV y portafolio.',
    },
  ]

  return (
    <section className="w-full bg-black text-white py-24 px-6 relative overflow-hidden">

      {/* glow fondo */}
      <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#77039F] opacity-10 blur-[160px] rounded-full" />

      <div className="relative z-10 max-w-4xl mx-auto">

        {/* header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Preguntas Frecuentes
          </h2>
          <p className="text-gray-400 text-lg">
            Resolvemos las dudas más comunes sobre nuestros programas.
          </p>
        </div>

        {/* acordeon */}
        <div className="space-y-5">
          {faqs.map((faq, index) => {
            const open = openIndex === index

            return (
              <div
                key={index}
                className={`
                rounded-xl
                border
                transition-all duration-300
                ${
                  open
                    ? 'border-[#00CCA4] bg-[#050507] shadow-[0_0_25px_rgba(0,204,164,0.15)]'
                    : 'border-white/10 bg-[#0B0B0F] hover:border-[#77039F]/40'
                }
                `}
              >
                {/* pregunta */}
                <button
                  onClick={() => toggleIndex(index)}
                  className="
                  flex justify-between items-center w-full
                  text-left px-6 py-5
                  group
                  "
                >
                  <span
                    className={`
                    text-[16px] md:text-[17px]
                    font-semibold tracking-wide
                    transition
                    ${
                      open
                        ? 'text-[#00CCA4]'
                        : 'text-white group-hover:text-[#D85DFB]'
                    }
                    `}
                  >
                    {faq.question}
                  </span>

                  <FaChevronDown
                    className={`
                    transition-all duration-300 text-sm
                    ${
                      open
                        ? 'rotate-180 text-[#00CCA4]'
                        : 'text-gray-500 group-hover:text-[#D85DFB]'
                    }
                    `}
                  />
                </button>

                {/* respuesta */}
                {open && (
                  <div className="px-6 pb-6">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />

                    <p className="text-gray-300 leading-relaxed text-[15.5px]">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
