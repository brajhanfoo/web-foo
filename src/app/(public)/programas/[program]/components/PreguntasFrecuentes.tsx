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
      question: '¿Quiénes pueden participar en Smart Projects?',
      answer:
        'Personas con conocimientos base en su área (desarrollo, diseño, producto o QA) que buscan seguir creciendo a través de proyectos reales y trabajo colaborativo.',
    },
    {
      question: '¿El programa es abierto para todos?',
      answer:
        'No. Smart Projects es un programa selectivo. Para ingresar debes pasar por un proceso de admisión que evalúa tu nivel y tu forma de trabajo.',
    },
    {
      question: '¿Cómo es el proceso de admisión?',
      answer:
        'Incluye una revisión de perfil, una entrevista técnica y un desafío práctico. Además, recibirás feedback personalizado independientemente del resultado.',
    },
    {
      question: '¿El proceso de admisión tiene costo?',
      answer:
        'Sí. El pago corresponde al acceso al proceso de evaluación técnica y al feedback personalizado. No garantiza el ingreso al programa.',
    },
    {
      question: '¿Qué pasa si no soy seleccionado?',
      answer:
        'Recibirás una devolución clara sobre tu nivel actual y qué necesitas mejorar para futuras oportunidades.',
    },
    {
      question: '¿Qué hace diferente a Smart Projects de un curso tradicional?',
      answer:
        'A diferencia de un curso, Smart Projects replica un entorno real de trabajo en tecnología. Aquí no realizas ejercicios aislados, sino que desarrollas soluciones alineadas a negocio y producto, atravesando todo el ciclo de vida del software. Incluye revisiones, validaciones y una defensa final ante expertos. La certificación no es automática: debes demostrar tu nivel para obtenerla.',
    },
    {
      question: '¿Cuál es la duración del programa?',
      answer:
        'Smart Projects tiene una duración de 8 semanas intensivas, con trabajo colaborativo autogestionado y acompañamiento técnico, simulando dinámicas reales de equipos de producto.',
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
                ${open
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
                  group cursor-pointer
                  "
                >
                  <span
                    className={`
                    text-[16px] md:text-[17px]
                    font-semibold tracking-wide
                    transition
                    ${open
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
                    ${open
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
