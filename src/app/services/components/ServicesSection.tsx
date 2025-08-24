import { ServiceCard } from '../components'
import { Service } from '../_types/services.types'

interface PropertiesServices {
  services: Service[]
}

export default function ServicesSection({ services }: PropertiesServices) {
  return (
    <section className="px-4 py-12 max-w-7xl mx-auto">
      <h2 className="text-[28px] lg:text-[32px] xl:text-[34px] font-normal lg:font-semibold mb-8 text-center lg:text-start ">
        Nuestros Servicios
      </h2>
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s.title} service={s} />
        ))}
      </div>
    </section>
  )
}
