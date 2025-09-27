'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FaBars, FaTimes } from 'react-icons/fa'
import { HiOutlineLightBulb } from 'react-icons/hi'
import { IoRocketOutline } from 'react-icons/io5'
import { FiUsers } from 'react-icons/fi'

interface NavbarProperties {
  logoSrc: string
  logoAlt: string
}
const navItems = [
  {
    name: 'Servicios',
    href: '/services',
    icon: <HiOutlineLightBulb />,
  },
  { name: 'Programas', href: '/talents', icon: <IoRocketOutline /> },
  { name: 'Preguntas Frecuentes', href: '/#', icon: <FiUsers /> },
]

export default function Navbar({ logoSrc, logoAlt }: NavbarProperties) {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen((previous) => !previous)
  return (
    <nav className="w-full bg-black shadow h-[64px] md:h-[100px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-full">
        <Link href="/" className="flex items-center z-50">
          {/* Móvil: ancho 60px */}
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={50}
            height={30}
            className="block md:hidden"
          />
          {/* Desktop: ancho 100px, alto 68px */}
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={100}
            height={68}
            className="hidden md:block"
          />
        </Link>

        {/* Menú escritorio */}
        <ul className="hidden md:flex space-x-8">
          <li className="hidden md:inline-block">
            <Link href="/" className="group inline-block">
              <span className="transition-colors duration-300 text-white group-hover:text-gray-100">
                Inicio
              </span>
              <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-[2px] bg-yellow"></span>
            </Link>
          </li>
          {navItems.map(({ name, href }) => (
            <li key={href}>
              <Link href={href} className="group inline-block">
                <span className="transition-colors duration-300 text-white group-hover:text-gray-100">
                  {name}
                </span>
                <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-[2px] bg-yellow"></span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Botón móvil */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-2xl z-50 text-white"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Overlay móvil full-screen */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black z-40 flex flex-col px-5 py-20  space-y-8">
          {navItems.map(({ name, href, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center space-x-3 text-2xl text-white hover:text-gray-900"
            >
              {icon}
              <span>{name}</span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
