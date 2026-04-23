'use client'

import { useRouter } from 'next/navigation'
import { HiOutlineRocketLaunch } from 'react-icons/hi2'
import { IoMdCalendar } from 'react-icons/io'
import { LuBadgeCheck } from 'react-icons/lu'
import { MdOutlineClass } from 'react-icons/md'
import { RiGraduationCapLine } from 'react-icons/ri'
import { TfiWorld } from 'react-icons/tfi'

const PROJECT_ACADEMY_POSTULATION_PATH =
  '/plataforma/talento/explorar/project-academy/postular'

const HeroProjectAcademy: React.FC = () => {
  const router = useRouter()

  return (
    <section className="relative overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
                EN VIVO
              </span>
              <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <span className="text-[#00CCA4]">
                  <TfiWorld />
                </span>
                100% ONLINE
              </span>
              <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <span className="text-[#BDBE0B]">
                  <IoMdCalendar />
                </span>
                INICIO: 18 MAYO 2026
              </span>
            </div>

            <h1 className="text-4xl font-extrabold leading-none tracking-tight sm:text-5xl xl:text-6xl">
              Domina el <br />
              desarrollo de{' '}
              <span className="inline-block bg-gradient-to-r from-[#BDBE0B] to-[#00CCA4] bg-clip-text text-transparent">
                productos digitales.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base text-white/80 sm:text-lg">
              Conviértete en{' '}
              <strong className="text-white">Digital Product Developer</strong>{' '}
              construyendo un producto completo en equipo, con mentoría experta
              y acompañamiento intensivo de carrera durante 12 semanas.
            </p>

            <p className="mt-3 text-xs uppercase tracking-widest text-white/40">
              Pensado para perfiles de producto, diseño, desarrollo y calidad
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <p className="flex items-center text-[14px] font-bold">
                <span className="mr-2 text-[#77039F]">
                  <MdOutlineClass />
                </span>
                Workshops y formación práctica
              </p>
              <p className="flex items-center text-[14px] font-bold">
                <span className="mr-2 text-[#77039F]">
                  <RiGraduationCapLine />
                </span>
                Mentoría experta de especialistas
              </p>
              <p className="flex items-center text-[14px] font-bold">
                <span className="mr-2 text-[#D85DFB]">
                  <HiOutlineRocketLaunch />
                </span>
                Plan de carrera y mentoría
              </p>
              <p className="flex items-center text-[14px] font-bold">
                <span className="mr-2 text-[#BDBE0B]">
                  <LuBadgeCheck />
                </span>
                Proyecto final de portafolio
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                className="relative cursor-pointer rounded-xl bg-[#00CCA4] px-10 py-4 text-sm font-semibold text-black transition shadow-[0_0_25px_rgba(0,204,164,0.6)] hover:scale-[1.03] hover:bg-[#00D3D3]"
                onClick={() => router.push(PROJECT_ACADEMY_POSTULATION_PATH)}
              >
                Inscribirme al programa
              </button>

              <span className="text-sm text-white/60">
                Reserva tu lugar ·{' '}
                <span className="text-[#00CCA4]">Cupos limitados</span>
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              <div className="pointer-events-none absolute inset-0 rounded-2xl border border-[#00CCA4]/20" />

              <div className="mb-4 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-500" />
              </div>

              <pre className="text-sm leading-relaxed text-white/80">
                <code className="text-[10px] md:text-[14px]">
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

              <div className="absolute bottom-4 right-4 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white">
                Mentores activos <br />
                <span className="font-normal text-white/70">En línea</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroProjectAcademy

