"use client";

import React from "react";

type Phase = {
  title: string;
  subtitle: string;
  description: string;
};

const phases: Phase[] = [
  { title: "Sprint 0", subtitle: "Requerimientos", description: "Definición del proyecto y alcance" },
  { title: "Sprint 1", subtitle: "Investigación UX", description: "Research y diseño de experiencia" },
  { title: "Sprints 2-4", subtitle: "Desarrollo", description: "Entregas incrementales del producto" },
  { title: "Demo Day", subtitle: "Presentación Final", description: "Showcase del producto desarrollado" },
  { title: "Sprints 7-8", subtitle: "Feedback & Certificación", description: "Correcciones y entrega de certificados" },
];

const Timeline: React.FC = () => {
  return (
    <section className="w-full bg-black text-white py-16 px-6">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-purple-600">Fases del Programa</h2>
        <div className="mt-2 h-1 w-20 bg-yellow-400 mx-auto"></div>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Línea vertical central */}
        <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full border-l-2 border-purple-600"></div>

        <div className="space-y-12">
          {phases.map((phase, index) => {
            const isLeft = index % 2 === 0; // para alternar lado en desktop
            return (
              <div
                key={index}
                className={`flex flex-col md:flex-row items-center md:items-start ${
                  isLeft ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Caja de contenido */}
                <div className="md:w-1/2 md:px-4">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-purple-400">{phase.title}</h3>
                    <h4 className="text-lg font-bold mt-1">{phase.subtitle}</h4>
                    <p className="mt-2 text-gray-300">{phase.description}</p>
                  </div>
                </div>

                {/* Punto de la línea */}
                <div className="flex justify-center items-center md:mx-4 mt-6 md:mt-0">
                  <div className="w-4 h-4 bg-purple-600 rounded-full border-2 border-black"></div>
                </div>

                {/* Espacio vacío en el otro lado en desktop */}
                <div className="md:w-1/2 md:px-4 hidden md:block"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Timeline;
