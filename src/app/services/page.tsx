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
    <main className=" bg-black">
      <Hero />
      <ServicesSection services={services} />
      <ProjectsSection/>
      <TestimoniosSection />
      <FaqSection />
    </main>
  )
}

export default page
