"use client";

import React from "react";
import { FaLaptopCode, FaUsers, FaRocket } from "react-icons/fa";

const AboutSection: React.FC = () => {
  return (
    <section className="w-full bg-black text-white py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Título */}
        <h2 className="text-3xl md:text-4xl font-bold">Smarts Project</h2>

        {/* Descripción */}
        <p className="mt-6 text-gray-300 leading-relaxed">
          Es un <span className="text-[#E7E51A] font-semibold">programa intensivo </span> 
          de formación práctica en desarrollo de software, con una duración de 8 semanas,
          donde profesionales de distintas áreas de la tecnología trabajan en equipos interdisciplinarios
          para crear <span className="text-[#E7E51A] font-semibold">
          productos digitales que solucionen una problemática real</span>. <br /> <br />
          El proceso es completamente guiado por mentores y se desarrolla en un entorno que simula la experiencia laboral,
          aplicando metodologías ágiles y utilizando herramientas líderes de la industria.
        </p>
      </div>

      {/* Tarjetas / Cards */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3 max-w-5xl mx-auto">
        {/* Card 1 */}
        <div className="border-2 border-purple-500 rounded-xl p-6 flex flex-col items-center text-center">
          <FaLaptopCode className="w-10 h-10 mb-3 text-purple-500" />
          <h3 className="text-lg font-bold">Experiencia Real</h3>
          <p className="text-gray-400 text-sm mt-2">
            Productos de software funcionales <br /> desarrollados en 8 semanas
          </p>
        </div>

        {/* Card 2 */}
        <div className="border-2 border-gray-700 rounded-xl p-6 flex flex-col items-center text-center">
          <FaUsers className="w-10 h-10 mb-3 text-gray-300" />
          <h3 className="text-lg font-bold">Equipos Interdisciplinarios</h3>
          <p className="text-gray-400 text-sm mt-2">
            Profesionales de distintas áreas <br /> trabajando juntos
          </p>
        </div>

        {/* Card 3 */}
        <div className="border-2 border-[#DBC597] rounded-xl p-6 flex flex-col items-center text-center">
          <FaRocket className="w-10 h-10 mb-3 text-[#E7E51A]" />
          <h3 className="text-lg font-bold text-[#E7E51A]">Metodología Ágil</h3>
          <p className="text-gray-400 text-sm mt-2">
            Desarrollo iterativo aplicando <br /> buenas prácticas de la industria
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
