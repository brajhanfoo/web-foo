import { Service } from '../_types/services.types'

interface PropertiesServices {
  service: Service
}

export default function ServiceCard({ service }: PropertiesServices) {
  const IconComponent = service.icon
  return (
    <div className="bg-white shadow-md rounded-lg p-6 flex flex-col hover:shadow-lg transition">
      <div className=" text-violeta mb-4">
        <IconComponent size={30} />
      </div>
      <h3 className="text-2xl lg:text-[28px] font-semibold mb-2">
        {service.title}
      </h3>
      <p className=" text-[16px] lg:text-[18px] text-gray flex-grow">
        {service.description}
      </p>
      <hr className="my-4 border-gray-200" />
      <button className="self-start bg-yellow font-medium text-black px-4 py-2 rounded-full hover:bg-yellow-500 transition cursor-pointer">
        Saber más
      </button>
    </div>
  )
}
