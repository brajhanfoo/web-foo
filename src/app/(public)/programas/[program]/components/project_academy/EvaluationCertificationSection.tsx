import { FiCheckCircle, FiAward, FiShield } from 'react-icons/fi'

type EvaluationItem = {
  title: string
  description: string
}

const evaluationItems: EvaluationItem[] = [
  {
    title: 'Proyecto funcional y desplegado',
    description: 'Sin errores críticos, accesible vía URL pública.',
  },
  {
    title: 'Documentación completa',
    description: 'Readme, arquitectura y guías de uso.',
  },
  {
    title: 'Code quality review',
    description: 'Aprobado por mentores expertos.',
  },
  {
    title: 'Demo Day',
    description: 'Presentación exitosa ante jurado.',
  },
  {
    title: 'Post-mortem retrospective',
    description: 'Análisis crítico del proyecto.',
  },
]

const EvaluationCertificationSection = () => {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid gap-16 lg:grid-cols-2">
        {/* Left */}
        <div>
          <h2 className="mb-10 text-3xl font-semibold text-white md:text-4xl">
            Evaluación y Certificación
          </h2>

          <div className="space-y-4">
            {evaluationItems.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#00CCA4]/20 text-[#00CCA4]">
                  <FiCheckCircle className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-white/60">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right – Certificate */}
        <div className="relative flex items-center justify-center">
          <div className="relative w-full max-w-md rounded-2xl border border-[#00CCA4]/30 bg-gradient-to-br from-white/5 to-white/0 p-10 text-center shadow-[0_0_40px_rgba(0,204,164,0.15)]">
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#00CCA4]/20 text-[#00CCA4]">
              <FiAward className="h-7 w-7" />
            </div>

            <p className="text-xs uppercase tracking-widest text-white/50">
              Certificado de finalización
            </p>

            <h3 className="mt-4 text-xl font-semibold text-white">
              Digital Product Developer
            </h3>

            <p className="mt-1 text-sm text-[#00CCA4]">Project Academy</p>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#00CCA4]/30 bg-[#00CCA4]/10 px-4 py-2 text-xs font-medium text-[#00CCA4]">
              <FiShield className="h-4 w-4" />
              Aprobado por expertos
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default EvaluationCertificationSection

