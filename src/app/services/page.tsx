import { Hero, ServicesSection } from './components'
import { services } from './_data/services.data'
import TestimoniosSection from './components/TestimoniosSection'

const page = () => {
  return (
    <main className=" bg-white-dark">
      <Hero />
      <ServicesSection services={services} />
      <TestimoniosSection />
    </main>
  )
}

export default page
