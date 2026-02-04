"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "¿El programa se puede cancelar después de que yo pague?",
    a: "Sí. Contamos con una política de cancelación clara durante los primeros días del programa."
  },
  {
    q: "¿Necesito experiencia previa?",
    a: "No es obligatorio. El programa está diseñado para acompañarte desde tu nivel actual."
  },
  {
    q: "¿Qué pasa si soy PM / Analista y no sé programar?",
    a: "Trabajarás desde el enfoque de producto, estrategia y colaboración técnica."
  },
  {
    q: "¿Puedo participar desde cualquier país?",
    a: "Sí. El programa es 100% remoto y en vivo."
  },
  {
    q: "¿Qué tipo de proyecto voy a construir?",
    a: "Un proyecto real, completo y desplegado, alineado a estándares de la industria."
  }
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="relative bg-black px-6 py-24">
      {/* Glow */}
      <div className="absolute inset-0 flex justify-center">
        <div className="h-80 w-80 rounded-full bg-[#00CCA4]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <h2 className="mb-12 text-center text-3xl font-semibold text-white">
          Preguntas frecuentes
        </h2>

        <div className="space-y-4">
          {faqs.map((item, i) => {
            const isOpen = open === i;

            return (
              <div
                key={i}
                className={`rounded-2xl border transition-all
                  ${isOpen
                    ? "border-[#00CCA4] bg-white/5"
                    : "border-white/10 bg-white/3 hover:border-white/20"
                  }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-sm font-medium text-white">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-[#00CCA4] transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-white/70">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
