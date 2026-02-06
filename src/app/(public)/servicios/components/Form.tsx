import React from 'react'

const Form = () => {
  return (
    <div className="relative max-w-3xl mx-auto rounded-3xl bg-neutral-900/80 border border-white/10 p-10 md:p-12 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)]">
      {/* Glow de fondo */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/20 via-teal-500/10 to-transparent opacity-60" />

      {/* Header */}
      <div className="relative z-10 text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-semibold mb-3">
          Solicita Información
        </h2>
        <p className="text-sm text-neutral-400 max-w-xl mx-auto">
          Completa el formulario para recibir nuestro catálogo de talento o
          agendar una consulta con un especialista B2B.
        </p>
      </div>

      {/* Form */}
      <form className="relative z-10 space-y-6">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
              Nombre Completo
            </label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
              Empresa
            </label>
            <input
              type="text"
              placeholder="Acme Corp"
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
            Email Corporativo
          </label>
          <input
            type="email"
            placeholder="john@company.com"
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40"
          />
        </div>

        {/* Select */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
            ¿En qué estás interesado?
          </label>
          <select className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40">
            <option value="">Selecciona una opción</option>
            <option value="talento">Contratación de Talento</option>
            <option value="retos">Patrocinio de Retos</option>
            <option value="ambos">Ambos</option>
          </select>
        </div>

        {/* CTA */}
        <button
          type="submit"
          className="w-full mt-6 rounded-xl bg-[#780B90] hover:bg-purple-900 transition-colors py-4 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer"
        >
          Contactar Ahora
          <span className="text-lg">➜</span>
        </button>
      </form>
    </div>
  )
}

export default Form
