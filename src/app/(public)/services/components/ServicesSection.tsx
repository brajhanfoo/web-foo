import { Heading, ServiceCard } from '../components'
import { Service } from '../_types/services.types'

interface PropertiesServices {
  services: Service[]
}

export default function ServicesSection({ services }: PropertiesServices) {
  return (
    <section className="px-4 py-12 mx-auto grid">
      <Heading text="Servicios" />

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s.title} service={s} />
        ))}
      </div>
    </section>
  )
}
