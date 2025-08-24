import { Hero, ServicesSection } from './components'
import { services } from './_data/services.data'

const page = () => {
  return (
    <main className=" bg-white-dark">
      <Hero />
      <ServicesSection services={services} />
    </main>
  )
}

export default page
