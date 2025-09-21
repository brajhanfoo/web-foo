export const pulseButton = {
  animate: {
    scale: [1, 1.05, 1],
    boxShadow: [
      '0 0 0 0 rgba(0,0,0,0.2)',
      '0 0 0 15px rgba(0,0,0,0)',
      '0 0 0 0 rgba(0,0,0,0.2)',
    ],
    transition: {
      duration: 1.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const floatingAnimation = {
  y: [-5, 10, -5],
  transition: {
    duration: 10,
    repeat: Number.POSITIVE_INFINITY,
    ease: 'easeInOut',
  },
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

export const slideStagger = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
}

export const slideIn = (direction: string, delay = 0) =>
  ({
    hidden: {
      opacity: 0,
      x: direction === 'left' ? -32 : 32,
      filter: 'blur(6px)',
    },
    show: {
      opacity: 1,
      x: 0,
      filter: 'blur(0px)',
      transition: { delay, duration: 0.6, ease: 'easeOut' },
    },
  }) as const
