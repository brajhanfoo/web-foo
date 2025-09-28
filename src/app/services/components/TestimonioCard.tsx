import { Testimonial } from '../_types/services.types'
import Image from 'next/image'

interface PropertiesTestimonio {
  testimonio: Testimonial
}

export default function TestimonioCard({ testimonio }: PropertiesTestimonio) {
  const { name, position, image, stars, company, testimonial } = testimonio
  return (
    <div className="relative bg-white-dark text-center p-6 rounded-xl shadow-md mx-2 w-72 flex-shrink-0">
      <div className="flex justify-center mb-4">
        {[...Array(5)].map((_, index) => (
          <span
            key={index}
            className={`text-yellow text-xl ${index >= stars! ? 'text-gray-300' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
      <p className="text-black mb-6 text-[14px] lg:text-[16px]">
        {testimonial}
      </p>
      <h3 className="font-semibold lg:text-[16px]">{name}</h3>
      <p className="text-[12px] lg:text-[14px] text-gray mb-2">{position}</p>
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <Image
          src={image!}
          alt={name}
          width={78}
          height={78}
          className="w-16 lg:w-[78px] h-16 lg:h-[78px] rounded-full border-4 border-yellow"
        />
      </div>
    </div>
  )
}
