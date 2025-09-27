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
    name: 'Inicio',
    href: '/',
  },
  {
    name: 'Servicios',
    href: '/services',
    icon: <HiOutlineLightBulb />,
  },
  { name: 'Proyectos', href: '/projects', icon: <IoRocketOutline /> },
  { name: 'Preguntas Frecuentes', href: '/faq', icon: <FiUsers /> },
  { name: 'Contacto', href: '/contact', icon: <FiUsers /> },
]

export default function Navbar({ logoSrc, logoAlt }: NavbarProperties) {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen((previous) => !previous)
  return (
    <>
      <nav className="sticky top-0 z-50 grid grid-flow-col items-center justify-between w-full bg-black backdrop-blur px-10 py-5 md:px-4 lg:px-16 xl:px-32">
        <Link href="/" className="flex items-center z-50 ">
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={50}
            height={30}
            className="w-14 h-8 md:w-24 md:h-16"
          />
        </Link>
        <div className="hidden md:flex items-center space-x-8 w-full">
          {navItems.map(({ name, href }) => (
            <Link
              href={href}
              className="text-white transition-colors duration-300 hover:text-gray-100 group"
              key={href}
            >
              {name}
              <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-[2px] bg-yellow"></span>
            </Link>
          ))}
        </div>
        <button className="text-white bg-amber-300 px-4 py-2 rounded-md hover:bg-amber-400 transition duration-300 hidden md:block">
          Contáctanos
        </button>
        <button
          onClick={toggleMenu}
          className="md:hidden text-2xl z-50 text-white"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
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
    </>
  )
}
