import FaqItem from './FaqItem'
import { faqData } from '../_data/faqData'

export default function FaqSection() {
  return (
    <section className="py-16 px-4 md:px-8 lg:px-20 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-[28px] lg:text-[34px] font-medium text-black mb-6 lg:mb-8 text-center lg:text-start">
          Preguntas Frecuentes
        </h2>
        <div>
          {faqData.map((faq) => (
            <FaqItem key={faq.id} faq={faq} />
          ))}
        </div>
      </div>
    </section>
  )
}
