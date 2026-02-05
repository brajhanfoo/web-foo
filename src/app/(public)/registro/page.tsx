import { Code, Users2 } from 'lucide-react'
import { RegisterForm } from './components/register-form'

export default function RegisterPage() {
  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-10">
      {/* Background oscuro con gradientes */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0a] to-black" />
        <div className="absolute -top-32 -left-40 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-8 md:grid-cols-2 md:items-center">
        {/* Panel izquierdo */}
        <section className="hidden md:block">
          <h1 className="text-4xl font-semibold leading-tight text-white">
            Construye tu futuro <br />
            como{' '}
            <span className="text-emerald-400">Digital Product Developer</span>.
          </h1>

          <p className="mt-4 max-w-xl text-white/70">
            Únete a una comunidad de desarrolladores de alto rendimiento. Accede
            a mentorías, proyectos reales y oportunidades laborales exclusivas.
          </p>

          <div className="mt-6 space-y-3">
            <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
              <div className="bg-[#77039F]/20 h-9 w-9 rounded-xl flex items-center justify-center mr-3">
                {' '}
                <Code className="text-[#77039F]" size={16} />
              </div>
              <div>
                {' '}
                <h2 className="inline-block">Proyectos prácticos</h2>
                <p>Desarrollo basado en desafíos reales de la industria.</p>
              </div>
            </div>
            <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
              <div className="bg-[#00CCA4]/20 h-9 w-9 rounded-xl flex items-center justify-center mr-3">
                {' '}
                <Users2 className="text-[#00CCA4]" size={16} />
              </div>
              <div>
                {' '}
                <h2 className="inline-block">Comunidad activa</h2>
                <p>Conecta con pares y mentores expertos.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="flex justify-center md:justify-end">
          <RegisterForm />
        </section>
      </div>
    </main>
  )
}
