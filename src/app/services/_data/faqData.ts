export interface Faq {
  id: number
  question: string
  answer: string
}

export const faqData: Faq[] = [
  {
    id: 1,
    question: '¿Qué tipo de sitios web desarrollan?',
    answer:
      'Desde páginas informativas hasta tiendas en línea y plataformas personalizadas. Nos adaptamos a tus necesidades.',
  },
  {
    id: 2,
    question: '¿Cuánto tiempo lleva desarrollar un proyecto?',
    answer:
      'Depende de la complejidad del proyecto. Un sitio web promedio toma entre 4 y 8 semanas.',
  },
  {
    id: 3,
    question: '¿Trabajan con empresas de cualquier tamaño?',
    answer:
      'Sí, ayudamos tanto a emprendedores como grandes empresas a alcanzar sus objetivos digitales.',
  },
  {
    id: 4,
    question: '¿Qué es un proyecto UX/UI?',
    answer:
      'Es el primer paso para hacer realidad tu idea. Diseñamos una maqueta interactiva que muestra cómo funcionará tu sitio web o aplicación.',
  },
  {
    id: 5,
    question: '¿Qué diferencia hay entre un sitio web y una web app?',
    answer:
      'Un sitio web es más estático, como un folleto online. Una web app es más interactiva: puedes subir fotos, comprar, chatear y mucho más.',
  },
]
