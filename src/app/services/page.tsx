import {
  Hero,
  ServicesSection,
  TestimoniosSection,
  FaqSection,
} from './components'
import { services } from './_data/services.data'
import ProjectsSection from './components/ProjectsSection'

const page = () => {
  return (
    // <main className=" bg-black">
    //   {/* <Hero />
    //   <ServicesSection services={services} />
    //   <ProjectsSection />
    //   <TestimoniosSection />
    //   <FaqSection /> */}
    // </main>
        <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white text-center px-6">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        Página en construcción
      </h1>
      <p className="text-lg md:text-xl text-gray-300 max-w-xl">
        Estamos trabajando para brindarte una mejor experiencia.
        <br />
        Muy pronto tendrás novedades.
      </p>
    </main>
  )
}

export default page
