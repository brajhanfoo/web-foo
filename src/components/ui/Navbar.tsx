'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { FaBars, FaTimes } from 'react-icons/fa'
import { FiUsers } from 'react-icons/fi'


interface NavbarProperties {
  logoSrc: string
  logoAlt: string
}

const navItems = [
  { name: 'Servicios', href: '/servicios' },
  {
    name: 'Programas',
    href: '/programas',
    icon: <FiUsers />,
  },
  { name: 'Nosotros', href: '/aboutus', icon: <FiUsers /> },
]

export default function Navbar({ logoSrc, logoAlt }: NavbarProperties) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Verificar si estamos en una ruta de programa activo
  const isProgramActive = pathname?.startsWith('/programas/') && pathname !== '/programas'

  // 🔒 Bloquear scroll cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : 'auto'
  }, [menuOpen])

  // Función para manejar el clic en "Ingresar"
  const handleIngresarClick = () => {
    setMenuOpen(false) // Cerrar menú móvil si está abierto
    router.push('/ingresar')
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between w-full bg-black px-6 py-4 md:px-4 lg:px-16 xl:px-32 shadow-lg">
      <Link href="/" className="z-50">
        <Image
          src={logoSrc}
          alt={logoAlt}
          width={90}
          height={50}
          className="w-14 h-8 md:w-24 md:h-16"
        />
      </Link>

      {/* Desktop menu */}
      <div className="hidden md:flex items-center space-x-8">
        {navItems.map(({ name, href }) => (
          <Link key={href} href={href} className="text-white group">
            {name}
            <span className="block max-w-0 group-hover:max-w-full transition-all duration-300 h-[2px] bg-yellow" />
          </Link>
        ))}
      </div>

      {/* Botones desktop */}
      <div className="hidden md:flex items-center gap-4">


        {/* Botón Ingresar */}
        <button
          onClick={handleIngresarClick}
          className="text-white bg-white/20 hover:bg-white/30 px-5 py-2.5 rounded-md transition-colors duration-300 cursor-pointer"
        >
          Ingresar
        </button>

        {/* Botón Postular (condicional) */}
        {isProgramActive && (
          <button className="bg-[#00CCA4] hover:bg-[#00D3D3] cursor-pointer text-black font-semibold px-5 py-2.5 rounded-md transition-colors duration-300 shadow-md hover:shadow-lg"
          onClick={()=>router.push('/ingresar')}>
            Postular
          </button>
        )}
      </div>

      {/* Hamburger button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden text-2xl text-white z-50"
      >
        {menuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 bg-black z-40 flex flex-col px-6 py-24 space-y-6 transition-transform duration-300 ease-in-out
        ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Navegación móvil */}
        {navItems.map(({ name, href, icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMenuOpen(false)}
            className="flex items-center space-x-3 text-2xl text-white hover:text-yellow-400 transition-colors duration-200"
          >
            {icon}
            <span>{name}</span>
          </Link>
        ))}

        {/* Separador */}
        <div className="border-t border-gray-700 my-4 pt-4">
          {/* Botón Postular móvil (condicional) */}
          {isProgramActive && (
            <button
              onClick={() => {
                setMenuOpen(false)
                // Aquí puedes agregar la lógica para postular
              }}
              className="w-full bg-[#00CCA4] hover:bg-[#00D3D3] cursor-pointer text-black font-semibold text-lg py-3 px-4 rounded-md transition-colors duration-300 mb-4"
            >
              Postular al Programa
            </button>
          )}

          {/* Botón Ingresar móvil - Ahora con router */}
          <button
            onClick={handleIngresarClick}
            className="w-full text-center text-white bg-white/20 hover:bg-white/30 text-lg py-3 px-4 rounded-md transition-colors duration-300 cursor-pointer"
          >
            Ingresar
          </button>
        </div>
      </div>
    </nav>
  )
}