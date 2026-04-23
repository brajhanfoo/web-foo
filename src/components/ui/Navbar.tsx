'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { FaBars, FaTimes } from 'react-icons/fa'
import { FiUsers, FiBriefcase, FiInfo } from 'react-icons/fi'

interface NavbarProperties {
  logoSrc: string
  logoAlt: string
}

const navItems = [
  { name: 'Servicios', href: '/servicios', icon: <FiBriefcase /> },
  {
    name: 'Programas',
    href: '/programas',
    icon: <FiUsers />,
    children: [
      { name: 'Project Academy', href: '/programas/project-academy' },
      { name: 'Smart Projects', href: '/programas/smart-projects' },
    ],
  },
  { name: 'Nosotros', href: '/aboutus', icon: <FiInfo /> },
]

// 🔥 NavItem
function NavItem({ item, active, mobile = false, onClick }: any) {
  const [open, setOpen] = useState(false)
  const hasChildren = item.children?.length > 0

  if (hasChildren) {
    return (
      <div className="relative group py-2">
        <Link
          href={item.href}
          onClick={(e) => {
            if (mobile) {
              if (!open) {
                e.preventDefault()
                setOpen(true)
              } else {
                onClick?.()
              }
            }
          }}
          className="group relative flex items-center gap-2 text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          {item.icon && mobile && <span>{item.icon}</span>}
          <span className={mobile ? 'text-lg' : ''}>{item.name}</span>

          {/* underline ACTIVADO */}
          {!mobile && (
            <span
              className={`
                absolute left-0 -bottom-1 h-[2px] bg-yellow-400 transition-all duration-300
                ${active ? 'w-full' : 'w-0 group-hover:w-full'}
              `}
            />
          )}
        </Link>

        {/* Dropdown Desktop */}
        {!mobile && (
          <div className="absolute top-full left-0 hidden group-hover:block pt-2 z-50">
            <div className="bg-black/95 backdrop-blur border border-white/10 rounded-xl shadow-xl min-w-[220px] overflow-hidden">
              {item.children.map((child: any) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Mobile dropdown */}
        {mobile && open && (
          <div className="ml-6 mt-2 flex flex-col gap-2">
            {item.children.map((child: any) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={onClick}
                className="text-white/80 hover:text-white transition"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="group relative flex items-center gap-3 text-white/80 hover:text-white transition-colors cursor-pointer"
    >
      {item.icon && mobile && <span>{item.icon}</span>}
      <span className={mobile ? 'text-lg' : ''}>{item.name}</span>

      <span
        className={`
          absolute left-0 -bottom-1 h-[2px] bg-yellow-400 transition-all duration-300
          ${active ? 'w-full' : 'w-0 group-hover:w-full'}
        `}
      />
    </Link>
  )
}

// 🔥 NavActions
function NavActions({
  isAuthed,
  authReady,
  isProgramActive,
  onIngresar,
  onPanel,
  onPostular,
  mobile = false,
}: any) {
  if (!authReady) return null

  return (
    <div className={`flex ${mobile ? 'flex-col gap-4' : 'items-center gap-4'}`}>
      {isProgramActive && (
        <button
          onClick={onPostular}
          className={`bg-[#00CCA4] hover:bg-[#00D3D3] text-black font-semibold rounded-md transition cursor-pointer
          ${mobile ? 'w-full py-3' : 'px-5 py-2.5'}`}
        >
          Postular
        </button>
      )}

      <button
        onClick={isAuthed ? onPanel : onIngresar}
        className={`text-white bg-white/10 hover:bg-white/20 rounded-md transition cursor-pointer
        ${mobile ? 'w-full py-3 text-lg' : 'px-5 py-2.5'}`}
      >
        {isAuthed ? 'Mi panel' : 'Ingresar'}
      </button>
    </div>
  )
}

export default function Navbar({ logoSrc, logoAlt }: NavbarProperties) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const [authReady, setAuthReady] = useState(false)

  const pathname = usePathname()
  const router = useRouter()

  const isProgramActive =
    pathname?.startsWith('/programas/') && pathname !== '/programas'

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
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

  const handlePostularClick = () => {
    setMenuOpen(false)
    router.push('/plataforma')
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="sticky top-0 z-50 flex w-full items-center justify-between bg-black px-4 py-4 sm:px-6 lg:px-16 xl:px-32 shadow-lg">
      <Link href="/" className="z-50">
        <Image src={logoSrc} alt={logoAlt} width={90} height={50} />
      </Link>

      {/* DESKTOP */}
      <div className="hidden md:flex items-center space-x-8">
        {navItems.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </div>

      <div className="hidden md:flex">
        <NavActions
          isAuthed={isAuthed}
          authReady={authReady}
          isProgramActive={isProgramActive}
          onIngresar={handleIngresarClick}
          onPanel={handlePanelClick}
          onPostular={handlePostularClick}
        />
      </div>

      {/* MOBILE BTN */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden text-2xl text-white z-50"
      >
        {menuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* MOBILE MENU */}
      <div
        className={`fixed inset-0 z-40 flex flex-col bg-black px-6 py-24 pb-10 transition-transform duration-300
        ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col space-y-4">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={isActive(item.href)}
              mobile
              onClick={() => setMenuOpen(false)}
            />
          ))}
        </div>

        <div className="border-t border-gray-700 mt-6 pt-6">
          <NavActions
            mobile
            isAuthed={isAuthed}
            authReady={authReady}
            isProgramActive={isProgramActive}
            onIngresar={handleIngresarClick}
            onPanel={handlePanelClick}
            onPostular={handlePostularClick}
          />
        </div>
      </div>
    </nav>
  )
}
