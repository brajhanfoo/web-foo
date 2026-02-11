'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { FaBars, FaTimes } from 'react-icons/fa'
import { FiUsers } from 'react-icons/fi'

interface NavbarProperties {
  logoSrc: string
  logoAlt: string
}

const navItems = [
  { name: 'Servicios', href: '/servicios' },
  { name: 'Programas', href: '/programas', icon: <FiUsers /> },
  { name: 'Nosotros', href: '/aboutus', icon: <FiUsers /> },
]

export default function Navbar({ logoSrc, logoAlt }: NavbarProperties) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const isProgramActive =
    pathname?.startsWith('/programas/') && pathname !== '/programas'

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : 'auto'
  }, [menuOpen])

  useEffect(() => {
    let active = true

    const load = async () => {
      const { data } = await supabase.auth.getUser()
      if (!active) return
      setIsAuthed(Boolean(data.user))
      setAuthReady(true)
    }

    void load()

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_, session) => {
        if (!active) return
        setIsAuthed(Boolean(session?.user))
        setAuthReady(true)
      }
    )

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const handleIngresarClick = () => {
    setMenuOpen(false)
    router.push('/ingresar')
  }

  const handlePanelClick = () => {
    setMenuOpen(false)
    router.push('/plataforma')
  }

  // 🔥 función active
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between w-full bg-black px-6 py-4 md:px-4 lg:px-16 xl:px-32 shadow-lg">
      {/* LOGO */}
      <Link href="/" className="z-50">
        <Image
          src={logoSrc}
          alt={logoAlt}
          width={90}
          height={50}
          className="w-14 h-8 md:w-24 md:h-16"
        />
      </Link>

      {/* DESKTOP MENU */}
      <div className="hidden md:flex items-center space-x-8">
        {navItems.map(({ name, href }) => {
          const active = isActive(href)

          return (
            <Link key={href} href={href} className="text-white group relative">
              {name}

              {/* underline */}
              <span
                className={`
                  absolute left-0 -bottom-1 h-[2px] bg-yellow transition-[width] duration-300
                  ${active ? 'w-full' : 'w-0 group-hover:w-full'}
                `}
              />
            </Link>
          )
        })}
      </div>

      {/* BOTONES DESKTOP */}
      <div className="hidden md:flex items-center gap-4">
        {authReady ? (
          isAuthed ? (
            <button
              onClick={handlePanelClick}
              className="text-white bg-white/20 hover:bg-white/30 px-5 py-2.5 rounded-md transition-colors duration-300 cursor-pointer"
            >
              Mi panel
            </button>
          ) : (
            <button
              onClick={handleIngresarClick}
              className="text-white bg-white/20 hover:bg-white/30 px-5 py-2.5 rounded-md transition-colors duration-300 cursor-pointer"
            >
              Ingresar
            </button>
          )
        ) : null}

        {isProgramActive && (
          <button
            className="bg-[#00CCA4] hover:bg-[#00D3D3] cursor-pointer text-black font-semibold px-5 py-2.5 rounded-md transition-colors duration-300 shadow-md hover:shadow-lg"
            onClick={() => router.push('/ingresar')}
          >
            Postular
          </button>
        )}
      </div>

      {/* MOBILE BTN */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden text-2xl text-white z-50"
        aria-label={menuOpen ? 'Cerrar menu' : 'Abrir menu'}
      >
        {menuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* MOBILE MENU */}
      <div
        className={`fixed inset-0 bg-black z-40 flex flex-col px-6 py-24 space-y-6 transition-transform duration-300 ease-in-out
        ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {navItems.map(({ name, href, icon }) => {
          const active = isActive(href)

          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center space-x-3 text-2xl transition-colors duration-200
              ${active ? 'text-yellow-400' : 'text-white hover:text-yellow-400'}`}
            >
              {icon}
              <span>{name}</span>
            </Link>
          )
        })}

        <div className="border-t border-gray-700 my-4 pt-4">
          {isProgramActive && (
            <button
              onClick={() => {
                setMenuOpen(false)
                router.push('/ingresar')
              }}
              className="w-full bg-[#00CCA4] hover:bg-[#00D3D3] cursor-pointer text-black font-semibold text-lg py-3 px-4 rounded-md transition-colors duration-300 mb-4"
            >
              Postular al Programa
            </button>
          )}

          {authReady ? (
            isAuthed ? (
              <button
                onClick={handlePanelClick}
                className="w-full text-center text-white bg-white/20 hover:bg-white/30 text-lg py-3 px-4 rounded-md transition-colors duration-300 cursor-pointer"
              >
                Mi panel
              </button>
            ) : (
              <button
                onClick={handleIngresarClick}
                className="w-full text-center text-white bg-white/20 hover:bg-white/30 text-lg py-3 px-4 rounded-md transition-colors duration-300 cursor-pointer"
              >
                Ingresar
              </button>
            )
          ) : null}
        </div>
      </div>
    </nav>
  )
}
