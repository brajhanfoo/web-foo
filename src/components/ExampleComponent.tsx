'use client' // Asegura que el componente se ejecuta del lado del cliente (importante si usarás hooks)

import React from 'react'
import Image from 'next/image' // 1) Uso de <Image>: evita usar <img> directamente y mejora carga de imágenes
import Link from 'next/link' // 2) Uso de <Link>: navegaciones internas más eficientes y compatibles con Next.js

// 3) Definición clara de tipos (evita el uso de any, mejora la seguridad)
interface User {
  id: string
  name: string
  avatarUrl: string
}

/**
 * 4) Componente funcional nombrado (mejor para debugging y traza de errores)
 * @param user — Objeto de usuario con tipo definido
 */
export default function ExampleComponent({ user }: { user: User }) {
  return (
    <article className="flex items-center space-x-4 p-4 bg-white shadow rounded-md">
      {/* 5) Accessibility: alt descriptivo y uso de `<Image>` cumple con reglas de Next.js */}
      <Image
        src={user.avatarUrl}
        alt={`${user.name}'s avatar`}
        width={64}
        height={64}
        className="rounded-full"
      />

      <div>
        {/* 6) Tipado limpio: uso de tipos por propiedad */}
        <h2 className="text-lg font-semibold">{user.name}</h2>

        {/* 7) Next.js routing con `<Link>` (evita advertencia `no-html-link-for-pages`) */}
        <Link href={`/users/${user.id}`}>
          <a className="text-blue-600 hover:underline">View Profile</a>
        </Link>
      </div>
    </article>
  )
}
