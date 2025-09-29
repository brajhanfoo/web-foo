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
      'Es el primer paso para hacer realidad tu idea. Diseñamos una maqueta interactiva que muestra cómo funcionará tu sitio web o aplicación. Así puedes visualizar tu proyecto antes de desarrollarlo y evaluar si es lo que necesitas.',
  },
  {
    id: 5,
    question: '¿Tienes una idea de proyecto o app?',
    answer:
      'Nosotros analizamos si es factible desarrollarlo. De esta forma, te ahorras el gasto de implementar algo que quizás no funcione como esperabas.',
  },
  {
    id: 6,
    question: '¿Qué diferencia hay entre un sitio web y una web app?',
    answer:
      'Tendrás un sitio web es como un folleto o revista en internet. Tú entras, lees, ves cosas (como noticias, fotos, información de una empresa, etc) pero no haces mucho más. Es algo más estático, como visitar una vitrina donde solo miras.\n\nEn cambio, una web app es más como una herramienta interactiva. No solo miras, también puedes hacer cosas: subir fotos, chatear, comprar cosas, editar documentos, jugar, etc. Es como una aplicación de tu móvil, pero que funciona en tu navegador.',
  },
]
