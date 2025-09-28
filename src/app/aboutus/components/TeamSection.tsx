"use client";

import React from "react";
import Image from "next/image";

const team = [
  {
    name: "Brajhan Lopez",
    role: "CEO – Co-Fundador",
    image:
      "https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1758937336/Foo%20Talent%20group/Founders/Brajhan_idobfh.jpg?_s=public-apps",
    description:
      "Ingeniero de Sistemas y Desarrollador Full Stack con sólida experiencia en análisis de procesos y business analysis. Su enfoque está en transformar ideas en soluciones tecnológicas funcionales, aportando una visión estratégica para el crecimiento y la innovación.",
  },
  {
    name: "Gonzalo Rodriguez",
    role: "COO - Co-Fundador",
    image:
      "https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1758937337/Foo%20Talent%20group/Founders/Gonza_vepndf.jpg?_s=public-apps",
    description:
      "Desarrollador Frontend y Project Manager, actualmente capacitándose en Ingeniería de Ciberseguridad. Su experiencia previa como policía de operaciones especiales le otorgó disciplina, liderazgo y capacidad de resolución bajo presión, cualidades que hoy aplica en la gestión de proyectos y desarrollo de software.",
  },
  {
    name: "Mariana Ruiz",
    role: "CMO - Co-Fundadora",
    image:
      "https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1758937336/Foo%20Talent%20group/Founders/Mariana_bml695.jpg?_s=public-apps",
    description:
      "Licenciada en Letras y experta en comunicación digital. Como Community Manager, crea y gestiona contenidos, fortaleciendo el vínculo con la comunidad mediante estrategias creativas. Apasionada por la educación y la tecnología, busca nuevas formas de educar y conectar digitalmente.",
  },
  {
    name: "Luis Navarro",
    role: "CTO - Co-Fundador",
    image:
      "https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1758937336/Foo%20Talent%20group/Founders/Luis_xnagpd.jpg?_s=public-apps",
    description:
      "Ex policía con una trayectoria marcada por la disciplina y el compromiso, que hoy combina con su pasión por la tecnología como Desarrollador Full Stack. Su enfoque está en la construcción de soluciones completas y escalables, integrando tanto la lógica de negocio como la experiencia de usuario.",
  },
  {
    name: "Viviana Galarza",
    role: "Product Designer",
    image:
      "https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1758937337/Foo%20Talent%20group/Founders/Viviana_ldiuou.jpg?_s=public-apps",
    description:
      "Product Designer con una visión centrada en el usuario, especializada en la creación y diseño de productos digitales que combinan funcionalidad y estética. Su trabajo aporta valor a cada proyecto, garantizando experiencias intuitivas y visualmente atractivas.",
  },
];

export default function TeamSection() {
  return (
    <section className="w-full bg-[#0a0a0a] text-white py-20 px-6 md:px-12">
      {/* Encabezado */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#00FFCC]">
          Nuestro Equipo
        </h2>
        <p className="text-gray-300 text-lg break-words">
          Foo Talent Group está conformado por un equipo de profesionales apasionados por la innovación,
          la tecnología y la educación. Somos quienes impulsamos los programas educativos y brindamos
          soluciones digitales a empresas con responsabilidad y compromiso.
        </p>
      </div>

      {/* Grid del equipo */}
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {team.map((member, index) => (
          <div
            key={index}
            className="bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-800 hover:border-[#00FFCC] hover:shadow-xl transition transform hover:-translate-y-1 text-center"
          >
            <div className="relative w-32 h-32 mx-auto mb-4">
              <Image
                src={member.image}
                alt={member.name}
                fill
                className="object-cover rounded-full border-2 border-[#00FFCC]"
              />
            </div>
            <h3 className="text-xl font-semibold text-white">
              {member.name}
            </h3>
            <p className="text-[#00FFCC] text-sm mb-2 break-words">
              {member.role}
            </p>
            <p className="text-gray-400 text-sm break-words">
              {member.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

