
import { RegisterForm } from './components/register-form'
import { HiCodeBracket, HiUserGroup } from 'react-icons/hi2'

export default function RegisterPage() {
  return (
<main className="relative min-h-[calc(100vh-80px)] px-4 py-10 overflow-hidden bg-black">

  {/* Fondo premium coherente con auth */}
  <div className="pointer-events-none absolute inset-0 -z-10">
    <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0d0d0d] to-black" />
    <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#77039F]/20 blur-3xl" />
    <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#00CCA4]/10 blur-3xl" />
  </div>

  <div className="mx-auto grid w-full max-w-6xl gap-12 md:grid-cols-2 md:items-center">

    {/* Panel izquierdo */}
    <section className="hidden md:flex flex-col justify-center text-white">

      <h1 className="text-5xl font-bold leading-tight tracking-tight">
        Construye tu futuro <br />
        como{' '}
        <span className="bg-gradient-to-r from-[#00CCA4] to-[#BDBE0B] bg-clip-text text-transparent">
          Digital Product Developer
        </span>
        .
      </h1>

      <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/60">
        Únete a una comunidad de desarrolladores de alto rendimiento.
        Accede a mentorías, proyectos reales y oportunidades laborales
        exclusivas.
      </p>

      <div className="mt-12 space-y-5 max-w-xl">

        {/* Card 1 */}
        <div className="group flex items-start gap-4 rounded-2xl border border-[#77039F]/30 bg-gradient-to-br from-[#77039F]/20 to-transparent p-6 backdrop-blur-sm transition hover:border-[#77039F]/50">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#77039F]/30 border border-[#77039F]/40">
            <HiCodeBracket className="text-[#BDBE0B] text-xl" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">
              Proyectos prácticos
            </h3>
            <p className="mt-1 text-sm text-white/60">
              Desarrollo basado en desafíos reales de la industria.
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="group flex items-start gap-4 rounded-2xl border border-[#77039F]/30 bg-gradient-to-br from-[#77039F]/20 to-transparent p-6 backdrop-blur-sm transition hover:border-[#77039F]/50">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00CCA4]/20 border border-[#00CCA4]/40">
            <HiUserGroup className="text-[#00CCA4] text-xl" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">
              Comunidad activa
            </h3>
            <p className="mt-1 text-sm text-white/60">
              Conecta con pares y mentores expertos.
            </p>
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
