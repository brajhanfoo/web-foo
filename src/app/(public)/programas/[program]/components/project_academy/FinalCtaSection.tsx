'use client'

import { useRouter } from 'next/navigation'
import { FiArrowRight } from 'react-icons/fi'

const PROJECT_ACADEMY_POSTULATION_PATH =
  '/plataforma/talento/explorar/project-academy/postular'

const FinalCtaSection = () => {
  const router = useRouter()

  return (
    <section className="relative overflow-hidden bg-black px-6 py-28">
      <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div className="h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
          Project Academy no te prepara
          <br />
          para aprender un solo rol...
        </h2>

        <h3 className="mt-3 text-3xl font-semibold leading-tight text-emerald-400 md:text-4xl">
          te prepara para liderar el futuro.
        </h3>

        <p className="mx-auto mt-6 max-w-xl text-sm text-white/60">
          Únete a la nueva generación de profesionales digitales. Tu carrera
          escala aquí.
        </p>

        <button
          onClick={() => router.push(PROJECT_ACADEMY_POSTULATION_PATH)}
          className="group mt-10 inline-flex cursor-pointer items-center gap-2 rounded-full bg-emerald-400 px-8 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
        >
          Aplicar ahora
          <FiArrowRight className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  )
}

export default FinalCtaSection
