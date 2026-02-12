
import { RegisterForm } from './components/register-form'
import { HiCodeBracket, HiUserGroup } from 'react-icons/hi2'

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
       <section className="hidden md:flex flex-col justify-center">
  <h1 className="text-5xl font-bold leading-tight tracking-tight text-white">
    Construye tu futuro <br />
    como{' '}
    <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
      Digital Product Developer
    </span>
    .
  </h1>

  <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-400">
    Únete a una comunidad de desarrolladores de alto rendimiento. Accede a
    mentorías, proyectos reales y oportunidades laborales exclusivas.
  </p>

  <div className="mt-10 space-y-4 max-w-xl">
    {/* Card 1 */}
    <div className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent p-5 backdrop-blur-sm transition hover:border-white/20">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
        <HiCodeBracket className="text-purple-400 text-xl" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white">
          Proyectos prácticos
        </h3>
        <p className="mt-1 text-sm text-gray-400">
          Desarrollo basado en desafíos reales de la industria.
        </p>
      </div>
    </div>

    {/* Card 2 */}
    <div className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent p-5 backdrop-blur-sm transition hover:border-white/20">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <HiUserGroup className="text-emerald-400 text-xl" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white">
          Comunidad activa
        </h3>
        <p className="mt-1 text-sm text-gray-400">
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
