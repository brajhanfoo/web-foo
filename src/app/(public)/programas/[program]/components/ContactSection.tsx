'use client'

import {
  FaLinkedin,
  FaInstagram,
  FaFacebook,
  FaEnvelope,
  FaRocket,
} from 'react-icons/fa'

export default function ContactSection() {
  return (
    <section
      id="contact"
      className="
      relative
      bg-gradient-to-b from-black via-[#14051f] to-[#6d0f9c]
      text-white
      py-28 px-6
      overflow-hidden
      "
    >
      {/* glow fondo */}
      <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#D85DFB] opacity-20 blur-[180px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[#7A0CA3] to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* icono */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[#BDBE0B]/20 flex items-center justify-center shadow-[0_0_25px_rgba(189,190,11,0.35)]">
            <span className="text-[#BDBE0B] text-2xl">💡</span>
          </div>
        </div>

        {/* titulo */}
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Súmate a <span className="text-white">Foo Talent Group</span>
        </h2>

        {/* texto */}
        <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
          Forma parte de{' '}
          <span className="text-white font-semibold">Smart Projects</span> , un
          programa selectivo donde trabajarás en proyectos reales junto a
          talento filtrado por nivel y compromiso. Postula y da el siguiente
          paso en tu crecimiento profesional. Si eres empresa, sumate al
          ecosistema y construyamos juntos.
        </p>

        {/* redes */}
        <div className="flex justify-center gap-5 mb-14">
          <a
            href="https://www.linkedin.com/company/footalentgroup/"
            target="_blank"
            className="
            group
            w-12 h-12
            flex items-center justify-center
            rounded-full
            bg-white/5
            border border-white/10
            backdrop-blur-md
            hover:bg-[#0077B5]
            hover:scale-110
            transition
            "
          >
            <FaLinkedin className="text-gray-300 group-hover:text-white text-lg" />
          </a>

          <a
            href="https://www.instagram.com/footalentgroup"
            target="_blank"
            className="
            group
            w-12 h-12
            flex items-center justify-center
            rounded-full
            bg-white/5
            border border-white/10
            backdrop-blur-md
            hover:bg-gradient-to-tr hover:from-pink-500 hover:to-yellow-400
            hover:scale-110
            transition
            "
          >
            <FaInstagram className="text-gray-300 group-hover:text-white text-lg" />
          </a>

          <a
            href="https://www.facebook.com/footalentgroup"
            target="_blank"
            className="
            group
            w-12 h-12
            flex items-center justify-center
            rounded-full
            bg-white/5
            border border-white/10
            backdrop-blur-md
            hover:bg-[#1877F2]
            hover:scale-110
            transition
            "
          >
            <FaFacebook className="text-gray-300 group-hover:text-white text-lg" />
          </a>
        </div>

        {/* card apoyo */}
        <div
          className="
          max-w-xl mx-auto
          rounded-2xl
          border border-white/10
          bg-white/5
          backdrop-blur-xl
          p-8
          shadow-[0_0_40px_rgba(216,93,251,0.15)]
          "
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <FaRocket className="text-[#00CCA4] text-xl" />
            <p className="text-lg font-semibold text-white">
              ¿Quieres apoyarnos?
            </p>
          </div>

          <p className="text-gray-400 text-sm mb-6">
            Escríbenos para ser mentor, jurado o patrocinador en nuestras
            ediciones.
          </p>

          {/* email */}
          <a
            href="mailto:contacto@footalentgroup.com"
            className="
            flex items-center justify-center gap-3
            bg-white/10
            hover:bg-white/20
            border border-white/10
            rounded-xl
            py-3 px-6
            transition
            group
            "
          >
            <FaEnvelope className="text-[#00CCA4]" />
            <span className="text-white group-hover:text-[#00CCA4] transition">
              contacto@footalentgroup.com
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}

