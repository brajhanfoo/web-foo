"use client";

import { FaBullseye, FaEye } from "react-icons/fa";
import React from "react";

export default function MisionVisionSection() {
  return (
    <section className="relative py-20 bg-black text-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Título */}
        <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-12">
          Nuestra <span className="text-[#e7e51a]">Misión</span> &{" "}
          <span className="text-[#780b90]">Visión</span>
        </h2>

        {/* Contenedor de tarjetas */}
        <div className="grid md:grid-cols-2 gap-10">
          {/* Misión */}
          <div className="bg-[#0b0b0b] rounded-2xl shadow-lg p-8 border border-gray-800 hover:shadow-xl transition">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-md bg-gradient-to-tr from-[#e7e51a]/20 to-[#e7e51a]/10">
                <FaBullseye className="text-3xl text-[#e7e51a]" />
              </div>
              <h3 className="text-2xl font-semibold">Misión</h3>
            </div>

            <p className="text-gray-300 leading-relaxed">
              Impulsar el crecimiento de pequeñas y medianas empresas mediante
              soluciones tecnológicas innovadoras, <strong className="text-[#e7e51a]">mientras creamos programas educativos gratuitos</strong> que brindan
              experiencia real y mentoría a nuevos talentos en tecnología,
              fortaleciendo su preparación para el mundo laboral.
            </p>

            <div className="mt-6 inline-flex items-center gap-3 bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg">
              <span className="text-sm text-gray-300">Programas:</span>
              <span className="text-sm font-medium text-[#780b90]">Smart Projects</span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm font-medium text-[#e7e51a]">Proyectos Reales</span>
            </div>
          </div>

          {/* Visión */}
          <div className="bg-[#0b0b0b] rounded-2xl shadow-lg p-8 border border-gray-800 hover:shadow-xl transition">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-md bg-gradient-to-tr from-[#780b90]/20 to-[#780b90]/10">
                <FaEye className="text-3xl text-[#780b90]" />
              </div>
              <h3 className="text-2xl font-semibold">Visión</h3>
            </div>

            <p className="text-gray-300 leading-relaxed">
              Ser reconocidos como una empresa referente que combina{" "}
              <strong className="text-[#e7e51a]">excelencia en desarrollo de software</strong> con{" "}
              <strong className="text-[#780b90]">impacto educativo</strong>, ofreciendo oportunidades de aprendizaje
              accesibles y transformadoras que contribuyan al futuro de la
              comunidad tecnológica.
            </p>

            <div className="mt-6 text-sm text-gray-400">
              <p>
                Nuestra visión integra servicio empresarial y responsabilidad
                social: proyectos reales que forman talento y generan valor para
                organizaciones sin fines de lucro y la industria.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
