"use client";

import { FaUsers, FaLightbulb } from "react-icons/fa";

export default function AboutHero() {
  return (
    <section
      className="relative w-full h-[90vh] flex items-center justify-center text-center text-white"
      style={{
        backgroundImage: `url('https://images.pexels.com/photos/1015568/pexels-photo-1015568.jpeg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Contenido */}
      <div className="relative z-10 max-w-3xl px-6">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
          <span className="text-[#e7e51a]">Foo Talent Group</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
          Una empresa con <span className="font-semibold text-[#8e0cab] drop-shadow-lg">propósito educativo</span> que impulsa el
          crecimiento de talentos en tecnología a través de{" "}
          <span className="font-semibold text-[#e7e51a]">programas gratuitos, mentoría y proyectos reales</span>.  
          Nuestro modelo fomenta la colaboración, la transparencia y el aprendizaje práctico, siempre
          orientado a la formación no comercial y accesible para toda la comunidad.
        </p>

        {/* Iconos */}
        <div className="flex justify-center gap-8">
          <div className="flex flex-col items-center">
            <FaUsers className="text-4xl text-[#e7e51a] mb-2" />
            <p className="text-sm text-gray-200">Cohortes Abiertas</p>
          </div>
          <div className="flex flex-col items-center">
            <FaLightbulb className="text-4xl text-[#780b90] mb-2" />
            <p className="text-sm text-gray-200">Innovación Educativa</p>
          </div>
        </div>
      </div>
    </section>
  );
}
