import type {
  ProgramCardContent,
  ProgramFeature,
  ProgramRow,
} from './types/types'

function feature(id: string, text: string, enabled: boolean): ProgramFeature {
  return { id, text, enabled }
}

export function getProgramCardContent(program: ProgramRow): ProgramCardContent {
  if (program.slug === 'project-academy') {
    return {
      pillLabel: 'MENTORÍA EXPERTA',
      modalityLabel: 'Programas Intensivos',
      ctaLabel: 'VER PROJECT ACADEMY',
      badgeIcon: 'award',
      accent: 'academy',
      features: [
        feature(
          'Proyecto aplicado de software',
          'Aprende haciendo — Desarrolla un producto de software de forma práctica',
          true
        ),
        feature(
          'expert',
          'Ve más allá de tu especialidad — Entiende cómo se conectan negocio, producto y tech',
          true
        ),
        feature(
          '1-1',
          'Mentoría técnica — Recibe acompañamiento personalizado durante el proceso',
          true
        ),
        feature(
          'workshops',
          'Workshops en vivo — Aprende con especialistas en Producto, UX, Desarrollo y QA',
          true
        ),
        feature(
          'rituales',
          'Metodologías ágiles aplicadas — Fortalece tu forma de trabajar en equipos digitales',
          true
        ),
        feature(
          'coaching',
          'Career coaching — Mejora tu perfil, portafolio y preparación profesional',
          true
        ),
        feature(
          'support',
          'Acompañamiento continuo — Avanza con soporte cercano durante toda la experiencia',
          true
        ),
      ],
    }
  }

  if (program.slug === 'smart-projects') {
    return {
      pillLabel: 'AUTOGESTIONADO',
      modalityLabel: 'Autogestionado',
      ctaLabel: 'EXPLORAR SMART PROJECTS',
      badgeIcon: 'folder',
      accent: 'projects',
      features: [
        feature(
          'admission',
          'Proceso de admisión técnico — Entrevista, evaluación y feedback personalizado',
          true
        ),
        feature(
          'community',
          'Comunidad de talento seleccionado — Trabaja con perfiles filtrados por nivel y compromiso',
          true
        ),
        feature(
          'briefs',
          'Proyectos colaborativos de software — Construye soluciones junto a otras áreas',
          true
        ),
        feature(
          'sim',
          'Entorno exigente de ejecución — Dinámicas como reviews y demo day',
          true
        ),
        feature('aco', 'Acompañamiento estructurado', true),
        feature(
          'career',
          'Desarrollo integral guiado por especialidad y contexto de producto',
          false
        ),
        feature('mentor', 'Mentoría técnica continua', false),
        feature('workshops', 'Workshops o clases en vivo', false),
        feature('step', 'Career coaching personalizado', false),
      ],
    }
  }

  return {
    pillLabel: 'PROGRAMA',
    modalityLabel: 'En línea',
    ctaLabel: 'VER PROGRAMA',
    badgeIcon: 'folder',
    accent: 'default',
    features: [],
  }
}
