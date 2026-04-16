'use client'

import React from 'react'
import Link from 'next/link'
import { FaUserCheck, FaTasks, FaComments } from 'react-icons/fa'
import { AiOutlineCheckCircle } from 'react-icons/ai'

const AdmissionPricing: React.FC = () => {
    return (
        <section className="w-full bg-black text-white py-20 px-6">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">
                        Acceso al proceso de admisión
                    </h2>
                    <p className="text-gray-400 mt-4">
                        Da el primer paso para ingresar a Smart Projects a través de una evaluación real de tu nivel.
                    </p>
                </div>

                {/* Card principal */}
                <div className="border border-gray-800 rounded-2xl p-8 md:p-10 bg-[#0A0A0A] flex flex-col md:flex-row gap-10 items-center justify-between">

                    {/* Lado izquierdo */}
                    <div className="text-center md:text-left">

                        {/* Badge */}
                        <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                            Cupos limitados
                        </span>

                        {/* Precio */}
                        <div className="mt-4">
                            <h3 className="text-5xl font-bold text-white">
                                $20 <span className="text-lg text-gray-400">USD</span>
                            </h3>
                            <p className="text-gray-400 text-sm mt-2">
                                Pago único por acceso al proceso de admisión
                            </p>
                        </div>

                        {/* Descripción */}
                        <p className="text-gray-300 mt-6 max-w-md">
                            Accede a una evaluación técnica real y recibe feedback personalizado sobre tu nivel actual.
                        </p>

                        {/* CTA */}
                        <Link href="/plataforma">
                            <button className="mt-6 px-6 py-3 bg-[#00CCA4] text-black font-semibold rounded-lg hover:opacity-90 transition cursor-pointer">
                                Iniciar proceso de admisión
                            </button>
                        </Link>
                    </div>

                    {/* Lado derecho */}
                    <div className="flex flex-col gap-4 text-sm text-gray-300">

                        <div className="flex items-center gap-3">
                            <FaComments className="text-[#77039F]" />
                            <span>Entrevista técnica por rol</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <FaTasks className="text-[#BDBE0B]" />
                            <span>Evaluación práctica aplicada</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <AiOutlineCheckCircle className="text-[#4ADE80]" />
                            <span>Feedback personalizado</span>
                        </div>
{/* 
                        <div className="flex items-center gap-3">
                            <FaUserCheck className="text-[#3B82F6]" />
                            <span>Posibilidad de ingreso a Smart Projects</span>
                        </div> */}
                    </div>
                </div>

                {/* Nota final */}
                <div className="text-center mt-8 max-w-xl mx-auto">
                    <p className="text-gray-500 text-xs">
                        Este pago corresponde únicamente al proceso de admisión y no garantiza el ingreso al programa.
                    </p>

                    <p className="text-gray-600 text-xs mt-3">
                        +7 ediciones realizadas con talento previamente seleccionado.
                    </p>
                </div>
            </div>
        </section>
    )
}

export default AdmissionPricing