export interface Project {
  id: number
  category: string
  title: string
  description: string
  imageUrl: string
  link?: string
}

export const projectsData: Project[] = [
  {
    id: 1,
    category: 'Sitios web',
    title: 'Variable X',
    description:
      'Variable X es un centro educativo que ofrece una experiencia única...',
    imageUrl:
      'https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1757895246/Foo%20Talent%20group/EmpresasLogo/Vector_ghp78h.jpg?_s=public-apps',
    link: '#',
  },
  {
    id: 3,
    category: 'Sitios web',
    title: 'Proyecto Y',
    description:
      'Proyecto Y es una plataforma innovadora que conecta a usuarios...',
    imageUrl:
      'https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1757895246/Foo%20Talent%20group/EmpresasLogo/Vector_ghp78h.jpg?_s=public-apps',
    link: '#',
  },
  {
    id: 4,
    category: 'Marketing digital',
    title: 'Campaña Z',
    description:
      'Campaña Z es una estrategia de marketing digital que ha logrado...',
    imageUrl:
      'https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1757895246/Foo%20Talent%20group/EmpresasLogo/Vector_ghp78h.jpg?_s=public-apps',
    link: '#',
  },
  {
    id: 2,
    category: 'Marketing digital',
    title: 'Variable X',
    description:
      'Variable X es un centro educativo que ofrece una experiencia única...',
    imageUrl:
      'https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1757895246/Foo%20Talent%20group/EmpresasLogo/Vector_ghp78h.jpg?_s=public-apps',
    link: '#',
  },
  {
    id: 5,
    category: 'Sitios web',
    title: 'App Móvil A',
    description:
      'App Móvil A es una aplicación revolucionaria que transforma la manera...',
    imageUrl:
      'https://res.cloudinary.com/dtaybaydq/image/upload/fl_preserve_transparency/v1757895246/Foo%20Talent%20group/EmpresasLogo/Vector_ghp78h.jpg?_s=public-apps',
    link: '#',
  },
]
