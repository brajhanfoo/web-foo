'use client'

import { useState } from 'react'
import { Faq } from '../_data/faqData'
import { FiChevronDown } from 'react-icons/fi'

interface Properties {
  faq: Faq
}

export default function FaqItem({ faq }: Properties) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-violeta py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left cursor-pointer focus:outline-none"
      >
        <span className="text-base lg:text-[20px] font-medium text-black">
          {faq.question}
        </span>
        <FiChevronDown
          className={`text-xl text-violeta transition-transform ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {isOpen && (
        <p className="mt-2 text-sm lg:text-[18px] text-gray leading-relaxed">
          {faq.answer}
        </p>
      )}
    </div>
  )
}
