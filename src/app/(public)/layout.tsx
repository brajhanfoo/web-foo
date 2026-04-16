import Navbar from '@/components/ui/Navbar'
import Footer from '@/components/ui/Footer'
import { LOGOWEB } from '@/lib/imagePaths'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar logoSrc={LOGOWEB} logoAlt="Foo Talent Group" />
      {children}
      <Footer />
    </>
  )
}
