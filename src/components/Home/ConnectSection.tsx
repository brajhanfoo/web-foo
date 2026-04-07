'use client'

import { useRouter } from 'next/navigation'
import { MdOutlineBugReport, MdCode } from 'react-icons/md'
import IdentifyUserType from './IdentifyUserType'

const ConnectSection: React.FC = () => {
  const router = useRouter()
  return (
    <section className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_40%,rgba(34,211,238,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_85%_30%,rgba(168,85,247,0.12),transparent_60%)]" />

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 pb-24 pt-32 sm:px-6 lg:grid-cols-2">
        {/* LEFT */}
        <div>
          {/* System ready */}
          <div className="flex items-center gap-2 mb-6 text-xs font-mono text-[#00D3D3]">
            <span className="h-2 w-2 rounded-full bg-[#E7E51A]" />
            SYSTEM.READY()
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold leading-tight mb-6">
            Tu puente entre <br />
            la formación y <br />
            <span className="relative inline-block text-[#E7E51A]">
              la industria.
              <span className="absolute left-0 -bottom-1 h-1 w-full bg-[#E7E51A]/80 rounded-full" />
            </span>
          </h1>

          {/* Description */}
          <p className="text-neutral-400 text-sm md:text-base max-w-xl mb-10 leading-relaxed">
            <span className="text-neutral-500 font-mono"> </span> {'//'} Deja de
            hacer tutoriales.
            <br />
            <span className=" text-neutral-100">
              {' '}
              Aprende en equipos multidisciplinarios
            </span>
            , operando con plazos exigentes y metodologías de industria. Potencia tu{' '}
            <span className="text-[#00CCA4]">perfil</span> antes de saltar al
            mercado laboral.
          </p>

          {/* CTA */}
          <button
            className="inline-flex items-center gap-3 rounded-sm bg-[#00CCA4]/90 hover:bg-[#00CCA4] cursor-pointer transition px-6 py-3 text-sm font-semibold text-black"
            onClick={() => router.push('/programas')}
          >
            Inicia tu Camino
            <span className="text-lg">➜</span>
          </button>
        </div>

        {/* RIGHT – Mock / Terminal */}
        <div className="relative hidden lg:flex justify-center">
          {/* Glow ring */}
          <div className="absolute h-[420px] w-[420px] rounded-full border border-purple-500/30 blur-[1px]" />

          {/* Window */}
          <div className="relative z-10 w-[420px] rounded-2xl bg-neutral-900 border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-white/10">
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <span className="text-xs text-neutral-500 font-mono">
                user@foo-talent:~
              </span>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 text-sm font-mono">
              {/* Component */}
              <div className="rounded-xl border border-[#780B90]/40 p-4">
                <span className="text-xs text-[#780B90]">COMPONENT</span>
                <div className="mt-2 text-white">AuthService</div>
                <div className="mt-2 h-1 w-24 bg-[#780B90] rounded-full" />
              </div>

              {/* Sprint */}
              <div className="rounded-xl border border-[#00D3D3]/40 p-4">
                <div className="flex justify-between text-xs text-[#00D3D3] mb-2">
                  <span>Active Sprints</span>
                  <span>v2.4</span>
                </div>
                <ul className="space-y-2 text-neutral-300">
                  <li className=" flex items-center gap-2">
                    {' '}
                    <MdOutlineBugReport className="text-[#E7E51A]" /> Fix API
                    Latency
                  </li>
                  <li className=" flex items-center gap-2">
                    {' '}
                    <MdCode className="text-[#00D3D3]" /> Refactor Core
                  </li>
                </ul>
              </div>

              {/* Output */}
              <div className="rounded-xl border border-[#E7E51A]/40 p-4 text-[#E7E51A]">
                <span className="text-xs">OUTPUT</span>
                <div className="mt-2 text-[#4ADE80]">&gt; Build Success</div>
                <div className="text-xs text-neutral-400">420ms</div>
              </div>

              {/* Terminal */}
              <div className="text-xs text-neutral-400">
                <div>
                  &gt; <span className=" text-[#780B90]">~/projects </span> npm
                  run dev
                </div>
                <div className=" flex gap-1.5">
                  <div>✓ ready in</div>
                  <div className="text-[#E7E51A]"> 124ms</div>
                </div>

                <div>
                  local:{' '}
                  <span className="text-[#00CCA4]">http://localhost:3000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <IdentifyUserType />
    </section>
  )
}

export default ConnectSection
