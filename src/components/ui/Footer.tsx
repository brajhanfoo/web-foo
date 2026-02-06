import Image from 'next/image'
import Link from 'next/link'
import { FaYoutube, FaInstagram, FaLinkedin } from 'react-icons/fa'
import { LOGOWEB } from '@/lib/imagePaths'

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      {/* Divider glow superior */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#00CCA4]/40 to-transparent mb-12" />

      {/* Contenedor principal (mismo ancho que navbar) */}
      <div className="mx-auto w-full px-6 md:px-4 lg:px-16 xl:px-32">
        {/* Fila superior */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Image
            src={LOGOWEB}
            alt="Foo Talent Group"
            width={90}
            height={50}
            className="object-contain opacity-90"
          />

          {/* Redes sociales */}
          <div className="flex items-center gap-5">
            <a
              href="https://www.youtube.com/@FooTalentGroup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-red-500 transition"
            >
              <FaYoutube size={20} />
            </a>
            <a
              href="https://www.instagram.com/footalentgroup/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-pink-500 transition"
            >
              <FaInstagram size={20} />
            </a>
            <a
              href="https://www.linkedin.com/company/footalentgroup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-blue-400 transition"
            >
              <FaLinkedin size={20} />
            </a>
          </div>
        </div>

        {/* Línea separadora */}
        <div className="border-t border-white/10 my-8" />

        {/* Fila inferior */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          {/* Copyright */}
          <p className="text-white/60 text-center md:text-left">
            © {new Date().getFullYear()} Foo Talent Group. Todos los derechos reservados.
          </p>

          {/* Links legales */}
          <div className="flex items-center gap-3 text-white/50">
            <Link href="/terminos-y-condiciones" className="hover:text-white transition">
              Términos y Condiciones
            </Link>
            <span className="opacity-40">|</span>
            <Link href="/politica-de-privacidad" className="hover:text-white transition">
              Política de Privacidad
            </Link>
          </div>
        </div>
      </div>

      {/* Espacio inferior controlado */}
      <div className="h-10" />
    </footer>
  )
}

