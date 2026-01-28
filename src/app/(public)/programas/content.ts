import type { ProgramCardContent, ProgramFeature, ProgramRow } from './types/page'

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
          'stakeholders',
          'Proyectos con stakeholders Reales - Resuelves problemas reales',
          true
        ),
        feature(
          'expert',
          'Acompañamiento experto - Técnicos, de Producto y de Carrera',
          true
        ),
        feature('1-1', 'Mentoría técnica 1:1 - Resuelve tus dudas específicas', true),
        feature('workshops', 'Workshops en vivo - Clases de producto/UX/DEV/QA', true),
        feature('rituales', 'Rituales ágiles guiados', true),
        feature('coaching', 'Career coaching dedicado', true),
        feature('support', 'Soporte diario', true),
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
        feature('admission', 'Proceso de admisión - Entrevista técnica + feedback', true),
        feature('community', 'Comunidad de talento filtrado - Solo trabajas con los mejores', true),
        feature('briefs', 'Briefs de proyectos con stakeholders', true),
        feature('resources', 'Recursos y guías de autoestudio', true),
        feature('sim', 'Entorno laboral simulado 100% realista', true),
        feature('mentor', 'Mentoría experta dedicada', false),
        feature('workshops', 'Workshops + career services', false),
        feature('step', 'Acompañamiento paso a paso', false),
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
