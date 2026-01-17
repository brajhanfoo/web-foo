'use client'

import { FaTools } from 'react-icons/fa'
import Image from 'next/image'
import { LOGO } from '@/lib/imagePaths'

export default function UnderConstruction() {
  return (
    <div className=" flex flex-col items-center justify-center bg-gray-900 text-white px-4">
      {/* Logo */}
      <Image
        src={LOGO} // 🔹 Cambia por la ruta de tu logo (ej: /public/logo.png)
        alt="Foo Talent Group"
        width={150}
        height={150}
        className="mb-6"
      />

      {/* Icono */}
      <div className="p-6 bg-gray-800 rounded-full shadow-lg mb-6">
        <FaTools className="text-5xl text-indigo-400 animate-pulse" />
      </div>

      {/* Texto */}
      <h1 className="text-2xl md:text-3xl font-bold text-indigo-300 mb-2">
        Página en construcción
      </h1>
      <p className="text-gray-400 text-center max-w-md">
        Estamos trabajando para traerte algo increíble. Vuelve pronto.
      </p>
    </div>
  )
}
