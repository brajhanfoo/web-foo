'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Faq } from '../_data/faqData'
import { FiChevronDown } from 'react-icons/fi'

interface Properties {
  faq: Faq
}

export default function FaqItem({ faq }: Properties) {
  const [openId, setOpenId] = useState<number | null>(null)
  const isOpen = openId === faq.id

  const toggle = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <>
      <div className="w-full  mx-auto">
        <div
          key={faq.id}
          className="border-b border-gray-200 dark:border-violet-400"
        >
          <button
            type="button"
            onClick={() => toggle(faq.id)}
            className="flex w-full items-center justify-between py-5 text-left font-medium text-gray-800 dark:text-gray-200"
            aria-expanded={isOpen}
            aria-controls={`faq-panel-${faq.id}`}
            id={`faq-heading-${faq.id}`}
          >
            <span>{faq.question}</span>
            <FiChevronDown
              className={`shrink-0 text-xl text-violet-600 transition-transform duration-300 ${
                isOpen ? 'rotate-180' : 'rotate-0'
              }`}
              aria-hidden="true"
            />
          </button>

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                key="content"
                id={`faq-panel-${faq.id}`}
                role="region"
                aria-labelledby={`faq-heading-${faq.id}`}
                initial={{ height: 0, opacity: 0, y: -4 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -4 }}
                transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
                style={{ overflow: 'hidden' }} // no cambia tus classNames; solo para recorte durante la animación
              >
                <div className="pb-5 text-gray-600 dark:text-gray-300">
                  <p className="whitespace-pre-line">{faq.answer}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
