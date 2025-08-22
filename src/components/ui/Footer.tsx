import Image from 'next/image'
import { FaYoutube, FaInstagram, FaLinkedin } from 'react-icons/fa'
import { LOGOWEB } from '@/lib/imagePaths'

export default function Footer() {
  return (
    <footer className="bg-black text-white py-6">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primera fila */}
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <Image
            src={LOGOWEB}
            alt="Logo"
            width={100}
            height={60}
            className="object-contain"
          />
        </div>

        {/* Redes sociales */}
        <div className="flex justify-end items-center space-x-4">
          <a
            href="https://www.youtube.com/@FooTalentGroup"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaYoutube className="text-xl hover:text-red-500 transition" />
          </a>
          <a
            href="https://www.instagram.com/footalentgroup/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaInstagram className="text-xl hover:text-pink-500 transition" />
          </a>
          <a
            href="https://www.linkedin.com/company/footalentgroup"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaLinkedin className="text-xl hover:text-blue-400 transition" />
          </a>
        </div>
      </div>

      {/* Segunda fila */}
      <div className="max-w-6xl mx-auto px-4 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-700 pt-4 text-sm">
        {/* Texto derechos */}
        <p className="text-white">
          © {new Date().getFullYear()} Foo Talent Group. Todos los derechos
          reservados.
        </p>

        {/* Enlaces legales */}
        <div className="flex justify-end space-x-2 text-white">
          <a href="/terminos" className="hover:text-white">
            Términos y Condiciones
          </a>
          <p>|</p>
          <a href="/privacidad" className="hover:text-white">
            Política de Privacidad
          </a>
        </div>
      </div>
    </footer>
  )
}
