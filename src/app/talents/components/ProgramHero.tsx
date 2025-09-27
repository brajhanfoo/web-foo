'use client'

import Image from 'next/image'

const ProgramHero = () => {
  return (
    <section className="relative w-full h-[400px] flex items-center justify-center bg-gradient-to-r from-[#1a0b2e] to-[#0c0616] overflow-hidden">
      {/* Círculo amarillo (izquierda) */}
      <div className="absolute left-0 bottom-0 w-40 h-40 bg-[#b3aa20] rounded-full -translate-x-1/2 translate-y-1/2" />

      {/* Círculo violeta (derecha) */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-[#1a0b2e] rounded-full translate-x-1/3 -translate-y-1/3 opacity-60" />

      {/* Contenido */}
      <div className="relative text-center text-white z-10">
        <h1 className="text-4xl font-bold">Smart Projects</h1>
        <p className="text-gray-300 mt-2">
          Programa intensivo de formación en desarrollo de software
        </p>
        <p className=" mt-2 text-[12px] text-[#b3aa20]">
          Propósito educativo · No comercial · Cohortes abiertas
        </p>
      </div>

      {/* Logo (arriba a la derecha) */}
      <div className="absolute top-6 right-6 z-10">
        <Image
          src="https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1758930364/Foo%20Talent%20group/Frame_116_tjnf84.jpg?_s=public-apps" // 👉 reemplaza con la ruta de tu logo
          alt="Foo Talent Group"
          width={130}
          height={50}
        />
      </div>
    </section>
  )
}

export default ProgramHero
