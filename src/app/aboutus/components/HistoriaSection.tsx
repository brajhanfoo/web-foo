"use client";

import { FaHandsHelping, FaHistory } from "react-icons/fa";
import React from "react";

export default function HistoriaSection() {
  return (
    <section className="w-full bg-gray-950 text-white py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Texto */}
        <div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#e7e51a]">
            Nuestra Historia
          </h2>

          <p className="text-gray-300 leading-relaxed mb-4">
            Foo Talent Group EIRL nació con la visión de unir{" "}
            <span className="text-[#780b90] font-semibold">
              desarrollo tecnológico de calidad
            </span>{" "}
            con la{" "}
            <span className="text-[#e7e51a] font-semibold">
              formación práctica de nuevos talentos
            </span>
            . Desde 2022 trabajamos como puente entre la innovación empresarial
            y la educación aplicada.
          </p>

          <p className="text-gray-300 leading-relaxed mb-4">
            Nuestro modelo es{" "}
            <span className="font-semibold text-[#e7e51a]">educativo y no comercial</span>:
            diseñamos programas estructurados por cohortes, con currículo,
            mentoría y actividades evaluables para estudiantes genuinos —no
            capacitación para clientes comerciales—.
          </p>

          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <FaHandsHelping className="text-2xl text-[#780b90]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Proyectos Reales</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Creamos sitios web para ONGs y organizaciones sin fines de lucro,
                  sin cobrar por el servicio. El objetivo: que las y los trainees
                  ganen experiencia práctica en proyectos con impacto social.
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed mt-6">
            A lo largo de nuestro recorrido hemos consolidado procesos, validado
            resultados y mantenido la transparencia pública —plan de estudios,
            instructores y admisiones— para garantizar la calidad educativa.
            Seguimos creciendo con la misma misión:{" "}
            <span className="text-[#780b90] font-semibold">formar talento</span> y
            generar oportunidades reales.
          </p>

          {/* Pequeño CTA */}
          <div className="mt-8">
            <a
              href="#contact"
              className="inline-block bg-[#780b90] hover:bg-[#5e076e] text-white font-semibold py-2 px-5 rounded-lg shadow-md transition"
            >
              Conócenos más
            </a>
          </div>
        </div>

        {/* Imagen / Visual - usa background-image para evitar configuración de dominios */}
        <div
          className="w-full h-80 md:h-[420px] rounded-2xl overflow-hidden relative shadow-lg"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url('https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            <div className="bg-black bg-opacity-40 rounded-md inline-flex items-center gap-3 px-4 py-3">
              <FaHistory className="text-2xl text-[#e7e51a]" />
              <div className="text-left">
                <p className="text-sm text-gray-200 font-semibold">Desde 2022</p>
                <p className="text-xs text-gray-400">Crecimiento con impacto educativo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
