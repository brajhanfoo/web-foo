import FaqItem from './FaqItem'
import { faqData } from '../_data/faqData'
import Heading from './Heading'

export default function FaqSection() {
  return (
    <div className="bg-black grid items-start px-10 md:px-12 lg:px-16 pt-16 pb-10 lg:pb-20">
      <Heading text="Preguntas Frecuentes" />
      <div className=" w-full text-white px-2 md:px-9 lg:px-20 pt-5 lg:pt-10">
        {faqData.map((faq) => (
          <FaqItem key={faq.id} faq={faq} />
        ))}
      </div>
      <div className="relative w-full ">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[400px]">
          <div className="flex h-full w-full justify-between">
            <div
              className="flex-1 opacity-30 mix-blend-screen 
            bg-[radial-gradient(ellipse_at_center,hsl(var(--blue-500)_/_0.28)_50%,hsl(var(--blue-500)_/_0)_100%)]"
            />
            <div
              className="flex-1 opacity-30 mix-blend-screen 
            bg-[radial-gradient(ellipse_at_center,hsl(var(--purple-500)_/_0.28)_50%,hsl(var(--purple-500)_/_0)_100%)]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
