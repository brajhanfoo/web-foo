import {
  Hero,
  ServicesSection,
  TestimoniosSection,
  FaqSection,
} from './components'
import { services } from './_data/services.data'

const page = () => {
  return (
    <main className=" bg-white-dark">
      <Hero />
      <ServicesSection services={services} />
      <TestimoniosSection />
      <FaqSection />
    </main>
  )
}

export default page
