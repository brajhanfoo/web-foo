'use client'
import { useRouter } from 'next/navigation'
import { TfiWorld } from 'react-icons/tfi'
import { IoMdCalendar } from 'react-icons/io'
import { AiOutlineCode } from 'react-icons/ai'
import { HiOutlineRocketLaunch } from 'react-icons/hi2'
import { RiGraduationCapLine } from 'react-icons/ri'
import { LuBadgeCheck } from 'react-icons/lu'

const HeroProjectAcademy: React.FC = () => {
  const router = useRouter()
  return (
    <section className="relative overflow-hidden bg-black text-white">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          {/* LEFT */}
          <div>
            {/* Badges */}
            <div className="mb-6 flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
                EN VIVO
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-white flex items-center gap-2">
                <span className="text-[#00CCA4]">
                  <TfiWorld />
                </span>
                100% ONLINE
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 flex items-center gap-2">
                <span className="text-[#BDBE0B]">
                  <IoMdCalendar />
                </span>
                INICIO: 20 FEBRERO 2026
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-extrabold leading-none tracking-tight sm:text-5xl xl:text-6xl">
              Entrena como si ya <br />
              trabajaras en una{' '}
              <span
                className="inline-block bg-gradient-to-r from-[#BDBE0B] to-[#00CCA4]
               bg-clip-text text-transparent"
              >
                empresa tech
              </span>
              .
            </h1>

            {/* Description */}
            <p className="mt-6 max-w-xl text-base text-white/80 sm:text-lg">
              Conviértete en{' '}
              <strong className=" text-white">Digital Product Developer</strong>{' '}
              construyendo un producto completo en equipo, con mentoría experta
              y acompañamiento intensivo de carrera durante 12 semanas.
            </p>

            <p className="mt-3 text-xs uppercase tracking-widest text-white/40">
              Pensado para perfiles de producto, diseño, desarrollo y calidad
            </p>

            {/* Features */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <p className="text-white ld-400 flex items-center text-[14px] font-bold">
                <span className="mr-2 text-[#77039F]">
                  <AiOutlineCode />
                </span>{' '}
                Proyecto production-ready
              </p>
              <p className="text-white ld-400 flex items-center text-[14px] font-bold">
                <span className="mr-2 text-[#77039F]">
                  <RiGraduationCapLine />
                </span>{' '}
                Mentores expertos por track
              </p>
              <p className="text-white ld-400 flex items-center text-[14px] font-bold">
                <span className="mr-2 text-[#D85DFB]">
                  <HiOutlineRocketLaunch />
                </span>{' '}
                Aceleración laboral
              </p>
              <p className="text-white ld-400 flex items-center text-[14px] font-bold">
                <span className="mr-2 text-[#BDBE0B]">
                  <LuBadgeCheck />
                </span>{' '}
                Experiencia real de trabajo
              </p>
            </div>

            {/* CTA */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                className="rounded-xl bg-[#00CCA4] cursor-pointer px-8 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
                onClick={() => router.push('/ingresar')}
              >
                Postular al programa
              </button>
              <span className="text-sm text-white/60">
                Reserva tu lugar ·{' '}
                <span className="text-[#00CCA4]">Cupos limitados</span>
              </span>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative">
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              {/* Fake window bar */}
              <div className="mb-4 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-500" />
              </div>

              {/* Code */}
              <pre className="text-sm leading-relaxed text-white/80">
                <code className=" text-[10px] md:text-[14px]">
                  {`const developer = new ProductProfile();

developer.skills.push(
  "Agile Methodologies",
  "React & TypeScript",
  "Product Strategy",
  "UX/UI Principles"
);

await developer.launchCareer();`}
                </code>
              </pre>

              {/* Mentors badge */}
              <div className="absolute bottom-4 right-4 rounded-xl bg-emerald-500/90 px-4 py-2 text-xs font-semibold text-black">
                Mentores activos <br />
                <span className="font-normal">En línea</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroProjectAcademy
