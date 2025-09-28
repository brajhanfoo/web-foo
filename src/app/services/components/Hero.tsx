'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { slideIn } from '@/util/animations'

const Hero = () => {
  return (
    <div className="bg-black min-h-screen flex items-start px-10 md:px-12 lg:px-16 pt-16">
      <div className="absolute inset-0 pt-60">
        <div className="relative h-[300px] w-full bg-[#0b0614]">
          <div
            className="absolute inset-0
          bg-[radial-gradient(ellipse_at_center,rgba(158,110,230,0.28)_0%,rgba(158,110,230,0)_60%)]"
          ></div>
          <div
            className="absolute inset-0
          bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_30%,rgba(0,0,0,0.85)_100%)]"
          ></div>
        </div>
      </div>
      <div className="grid w-1/2 text-white">
        <motion.h1
          className="text-6xl font-semibold pb-8"
          variants={slideIn('left', 0.3)}
          initial="hidden"
          animate="show"
        >
          Transforma tu visión en{' '}
          <motion.span
            className="bg-gradient-to-r from-fuchsia-500 via-violet-600 to-purple-800 bg-clip-text text-transparent"
            variants={slideIn('left', 0.4)}
            initial="hidden"
            animate="show"
          >
            Realidad digital
          </motion.span>
        </motion.h1>
        <motion.p
          className="font-normal text-2xl md:pr-2 pb-16"
          variants={slideIn('left', 0.5)}
          initial="hidden"
          animate="show"
        >
          Desarrollamos sitios y aplicaciones web que conectan con tu público y
          potencian tu negocio.
        </motion.p>
        <motion.button
          className="bg-gradient-to-b from-[#780B90] to-[#31053A] lg:w-1/5 py-3 text-2xl font-semibold rounded-2xl"
          variants={slideIn('left', 0.6)}
          initial="hidden"
          animate="show"
        >
          Hablemos
        </motion.button>
      </div>
      <motion.div
        className="relative w-1/2 hidden md:block"
        variants={slideIn('right', 0.3)}
        initial="hidden"
        animate="show"
      >
        <Image
          src="/computer.png"
          alt="Description of the image"
          className="absolute -top-36"
          width={800}
          height={800}
        />
      </motion.div>{' '}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[300px]">
        <div className="flex h-full w-full">
          <div
            className="flex-1 opacity-30 mix-blend-screen
        bg-[radial-gradient(ellipse_at_center,hsl(var(--blue-500)_/_0.28)_0%,hsl(var(--blue-500)_/_0)_90%)]"
          />
          <div
            className="flex-1 opacity-30 mix-blend-screen
        bg-[radial-gradient(ellipse_at_center,hsl(var(--purple-500)_/_0.28)_0%,hsl(var(--purple-500)_/_0)_90%)]"
          />
        </div>
      </div>
    </div>
  )
}

export default Hero
