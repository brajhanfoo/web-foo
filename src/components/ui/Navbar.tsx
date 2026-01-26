'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FaBars, FaTimes } from 'react-icons/fa'
import { FiUsers } from 'react-icons/fi'

interface NavbarProperties {
  logoSrc: string
  logoAlt: string
}

const navItems = [
  { name: 'Inicio', href: '/' },
  { name: 'Smart Projects', href: '/talents', icon: <FiUsers /> },
  { name: 'Nosotros', href: '/aboutus', icon: <FiUsers /> },
]

export default function Navbar({ logoSrc, logoAlt }: NavbarProperties) {
  const [menuOpen, setMenuOpen] = useState(false)

  // 🔒 Bloquear scroll cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : 'auto'
  }, [menuOpen])

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between w-full bg-black px-10 py-5 md:px-4 lg:px-16 xl:px-32">
      <Link href="/" className="z-50">
        <Image
          src={logoSrc}
          alt={logoAlt}
          width={50}
          height={30}
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

      <a
        href="https://wa.me/51930428602?text=Hola%20Foo%20Talent%20Group,%20quisiera%20más%20información"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:block text-white bg-gradient-to-b from-[#780B90] to-[#31053A] px-4 py-2 rounded-md"
      >
        Contáctanos
      </a>

      {/* Hamburger */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden text-2xl text-white z-50"
      >
        {menuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 bg-black z-40 flex flex-col px-6 py-24 space-y-8 transition-transform duration-300
        ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {navItems.map(({ name, href, icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMenuOpen(false)} // 👈 clave
            className="flex items-center space-x-3 text-2xl text-white"
          >
            {icon}
            <span>{name}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
