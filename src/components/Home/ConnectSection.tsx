"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const ConnectSection: React.FC = () => {
    const router = useRouter();
  return (
    <section className="w-full h-[calc(100vh-60px)] bg-black text-white relative overflow-hidden">
      {/* Imágenes decorativas */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 1. superior izquierda */}
        {/* <div className="absolute top-0 left-0 w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 transform
                        -translate-x-1/3 -translate-y-1/3">
          <div className="relative w-full h-full">
            <Image
              src="https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1759017728/Foo%20Talent%20group/ImagesPersons/concepto-de-collage-html-y-css-con-persona_1_1_jshhg0.jpg?_s=public-apps"
              alt="Decorativo 1"
              fill
              className="object-cover"
            />
          </div>
        </div> */}

        {/* 2. superior centro izquierdo */}
        <div className="absolute top-0 left-1/3 w-20 h-20 sm:w-28 sm:h-28 md:w-[330px] md:h-40  transform
                        -translate-x-1/2 -translate-y-1/3 hidden md:block">
          <div className="relative w-full h-full">
            <Image
              src="https://res.cloudinary.com/dtaybaydq/image/upload/v1759017728/Foo%20Talent%20group/ImagesPersons/Sin_t%C3%ADtulo_5_1_1_vpcmul.png"
              alt="Decorativo 2"
              fill
              className=""
            />
          </div>
        </div>

        {/* 3. superior derecha */}
        <div className="absolute top-0 left-8/12 w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48  transform
                        translate-x-1/3 -translate-y-1/3 hidden md:block">
          <div className="relative w-full h-full">
            <Image
              src="https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1759017728/Foo%20Talent%20group/ImagesPersons/naturaleza-muerta-de-una-oficina-de-diseno-grafico_1_snpadw.jpg?_s=public-apps"
              alt="Decorativo 3"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* 4. centro izquierda */}
        <div className="absolute top-2/5 left-0 w-20 h-20 sm:w-28 sm:h-28 md:w-40 md:h-40 lg:h-[330px]  transform
                        -translate-x-1/4 -translate-y-1/2 hidden md:block">
          <div className="relative w-full h-full">
            <Image
              src="https://res.cloudinary.com/dtaybaydq/image/upload/v1759017729/Foo%20Talent%20group/ImagesPersons/grupo-de-disenadores-graficos-usando-tableta-digital_1_sggb8j.png"
              alt="Decorativo 4"
              fill
              className=""
            />
          </div>
        </div>

        {/* 5. centro derecha */}
        <div className="absolute top-2/5 right-0 w-20 h-20 sm:w-28 sm:h-28 md:w-40 md:h-40 transform
                        translate-x-1/4 -translate-y-1/2 hidden md:block">
          <div className="relative w-full h-full">
            <Image
              src="https://res.cloudinary.com/dtaybaydq/image/upload/v1759017728/Foo%20Talent%20group/ImagesPersons/propietario-de-la-empresa-que-presenta-los-informes-de-datos-financieros-los-inversores_1_njzec4.png"
              alt="Decorativo 5"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* 6. inferior izquierda */}
        <div className="absolute bottom-20 left-0 w-28 h-28 sm:w-40 sm:h-40 md:w-56 md:h-56  transform
                        -translate-x-1/3 translate-y-1/6 hidden md:block">
          <div className="relative w-full h-full">
            <Image
              src="https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1759017728/Foo%20Talent%20group/ImagesPersons/Sin_t%C3%ADtulo_14_1_xnadd7.jpg?_s=public-apps"
              alt="Decorativo 6"
              fill
              className=""
            />
          </div>
        </div>

        {/* 7. inferior centro derecho */}
        <div className="absolute bottom-30 left-2/3 w-20 h-20 sm:w-28 sm:h-28 md:w-40 md:h-40 transform
                        -translate-x-1/2 translate-y-1/6 hidden md:block">
          <div className="relative w-full h-full">
            <Image
              src="https://res.cloudinary.com/dtaybaydq/image/upload/v1759017728/Foo%20Talent%20group/ImagesPersons/freelancer-buscando-en-su-telefono-un-proyecto_1_vczgwt.png"
              alt="Decorativo 7"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* 8. inferior derecha */}
        <div className="absolute bottom-30 right-0 w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48  transform
                        translate-x-1/3 translate-y-1/6 hidden md:block">
          <div className="relative w-full h-full">
            <Image
              src="https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1759017728/Foo%20Talent%20group/ImagesPersons/mujer-en-una-videoconferencia-en-su-oficina-en-casa-durante-la-pandemia-de-coronavirus_1_nxxjsf.jpg?_s=public-apps"
              alt="Decorativo 8"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

  {/* Contenido principal */}
      <div className="relative z-10 flex flex-col justify-center items-center h-full px-6 text-center max-w-3xl mx-auto space-y-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold">
          <span className="text-[#E7E51A]">Creando Oportunidades</span>, <br />
          <span className="text-[#E7E51A]">Impulsando Empresas</span>
        </h2>

        <p className="text-gray-300 leading-relaxed px-4 sm:px-0">
          En{" "}
          <span className="text-[#E7E51A]">Foo Talent Group</span>{" "}
          desarrollamos{" "}
          <span className=" text-[#E7E51A]">
            programas educativos gratuitos
          </span>{" "}
          para talentos en tecnología, al mismo tiempo que ofrecemos{" "}
          <span className=" text-[#E7E51A]">
            soluciones digitales
          </span>{" "}
          de alto impacto para empresas. Nuestra misión es generar{" "}
          <span className="text-white ">innovación</span>,{" "}
          fortalecer la{" "}
          <span className="text-white">comunidad</span> y
          abrir{" "}
          <span className="text-white ">oportunidades reales</span>.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <button
            className="bg-[#E7E51A] text-black font-semibold px-6 py-3 rounded-full hover:bg-amber-600 transition cursor-pointer shadow-lg"
            onClick={() => router.push("/talents")}
          >
            Soy Talento
          </button>
          <button
            className="border border-[#E7E51A] text-white font-semibold px-6 py-3 rounded-full hover:bg-amber-600 hover:text-white transition cursor-pointer"
            onClick={() => router.push("/services")}
          >
            Soy Empresa
          </button>
        </div>
      </div>
      
    </section>
  );
};

export default ConnectSection;
