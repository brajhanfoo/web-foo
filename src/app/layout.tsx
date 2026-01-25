import Navbar from '@/components/ui/Navbar'
import { LOGOWEB } from '@/lib/imagePaths'
import './globals.css'

import type { Metadata } from 'next'
import Footer from '@/components/ui/Footer'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Foo Talent Group',
  description: 'Plataforma de servicios para empresas y talentos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <Navbar logoSrc={LOGOWEB} logoAlt="Foo Talent Group" />
        {children}
        <Footer />
        <Toaster richColors position="top-right" expand={false} closeButton />
      </body>
    </html>
  )
}
