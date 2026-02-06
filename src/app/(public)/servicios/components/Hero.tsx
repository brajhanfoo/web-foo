'use client'
import { RiUserSearchLine } from 'react-icons/ri'
import { HiOutlineRocketLaunch } from 'react-icons/hi2'
import { AiOutlineCheckCircle } from 'react-icons/ai'

const Hero = () => {
  return (
    <section className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 md:bg-[radial-gradient(circle_at_top,rgba(128,0,255,0.15),transparent_60%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:pt-28 pb-20">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="px-4 py-1 text-xs tracking-widest rounded-full bg-purple-500/10 text-[#780B90] border border-purple-500/20">
            B2B SOLUTIONS · INIT()
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-center text-4xl md:text-6xl font-bold leading-tight">
          Encuentra el Talento que construye{' '}
          <span className="text-[#780B90]">Productos Reales.</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-3xl mx-auto text-center text-gray-400">
          Accede a perfiles validados técnicamente en entornos de simulación
          real o patrocina un proyecto de innovación con nuestros Squads.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Card: Contratación de Talento */}
        <div className="group relative rounded-3xl bg-neutral-900/80 border border-white/10 p-10 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)]">
          {/* Glow interno */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-60" />

          {/* Icono */}
          <div className="relative z-10 mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-400/20">
            <span className="text-[#00D3D3] text-xl">
              <RiUserSearchLine />
            </span>
          </div>

          {/* Título */}
          <h3 className="relative z-10 text-2xl font-semibold mb-4">
            Contratación de Talento
          </h3>

          {/* Descripción */}
          <p className="relative z-10 text-sm leading-relaxed text-neutral-400 mb-8 max-w-md">
            Conecta con desarrolladores, diseñadores y PMs listos para trabajar.
            Profesionales que han superado simulaciones de proyectos reales.
          </p>

          {/* Lista */}
          <ul className="relative z-10 space-y-3 text-sm text-neutral-300 mb-10">
            <li className="flex items-center gap-3">
              <span className=" text-[#00D3D3]">
                <AiOutlineCheckCircle />
              </span>
              Validación Técnica
            </li>
            <li className="flex items-center gap-3">
              <span className=" text-[#00D3D3]">
                <AiOutlineCheckCircle />
              </span>
              Soft Skills Evaluadas
            </li>
            <li className="flex items-center gap-3">
              <span className=" text-[#00D3D3]">
                <AiOutlineCheckCircle />
              </span>
              Disponibilidad Inmediata
            </li>
          </ul>

          <div className=" flex flex-col items-start">
            {/* Badge */}
            <div className="relative z-10 inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-[11px] uppercase tracking-widest text-neutral-400 mb-8">
              🔒 Próximamente: acceso directo a base de talento
            </div>

            {/* CTA */}
            <button
              onClick={() => {
                const section = document.getElementById('contacto')
                section?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="relative z-10 text-[#00D3D3] text-sm font-medium tracking-wide hover:underline cursor-pointer"
            >
              SOLICITAR INFORMACIÓN ↓
            </button>
          </div>
        </div>

        {/* Card: Patrocinio de Retos */}
        <div className="group relative rounded-3xl bg-neutral-900/80 border border-white/10 p-10 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)]">
          {/* Glow interno */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-60" />

          {/* Icono */}
          <div className="relative z-10 mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-400/20">
            <span className="text-[#780B90]  text-xl">
              <HiOutlineRocketLaunch />
            </span>
          </div>

          {/* Título */}
          <h3 className="relative z-10 text-2xl font-semibold mb-4">
            Patrocinio de Retos
          </h3>

          {/* Descripción */}
          <p className="relative z-10 text-sm leading-relaxed text-neutral-400 mb-8 max-w-md">
            Trae un problema real de tu empresa y deja que un Squad
            multidisciplinario construya una solución innovadora en tiempo
            récord.
          </p>

          {/* Lista */}
          <ul className="relative z-10 space-y-3 text-sm text-neutral-300 mb-14">
            <li className="flex items-center gap-3">
              <span className=" text-[#780B90] ">
                <AiOutlineCheckCircle />
              </span>
              Prototipos Funcionales
            </li>
            <li className="flex items-center gap-3">
              <span className=" text-[#780B90] ">
                <AiOutlineCheckCircle />
              </span>
              Squad Dedicado
            </li>
            <li className="flex items-center gap-3">
              <span className=" text-[#780B90] ">
                <AiOutlineCheckCircle />
              </span>
              Innovación Abierta
            </li>
          </ul>

          {/* CTA */}
          <a
            href="https://wa.me/51930428602?text=Hola%20quiero%20informaci%C3%B3n%20sobre%20patrocinar%20los%20programas"
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 bottom-[-22px] text-[#780B90] text-sm font-medium tracking-wide hover:underline cursor-pointer"
          >
            CONVERSAR CON UN ESPECIALISTA ↓
          </a>
        </div>
      </div>
    </section>
  )
}

export default Hero
