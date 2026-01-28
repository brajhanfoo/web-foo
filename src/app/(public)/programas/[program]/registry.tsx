import React from 'react'

// Smart Projects (tus componentes)
import ProgramHeroSmartProjects from '@/app/(public)/programas/[program]/components/ProgramHeroSmartProjects'
import AboutSection from '@/app/(public)/programas/[program]/components/AboutSection'
import Timeline from '@/app/(public)/programas/[program]/components/Timeline'
import SprintsSection from '@/app/(public)/programas/[program]/components/SprintsSection'
import AdmissionsSection from '@/app/(public)/programas/[program]/components/AdmissionsSection'
import InstructoresMentores from '@/app/(public)/programas/[program]/components/InstructoresMentores'
import PreguntasFrecuentes from '@/app/(public)/programas/[program]/components/PreguntasFrecuentes'
import ContactSection from '@/app/(public)/programas/[program]/components/ContactSection'

type ProgramRenderSpec = {
  title: string
  sections: React.ReactNode[]
}

export const PROGRAM_SPECS: Record<string, ProgramRenderSpec> = {
  'smart-projects': {
    title: 'Smart Projects',
    sections: [
      <ProgramHeroSmartProjects key="hero" />,
      <AboutSection key="about" />,
      <Timeline key="timeline" />,
      <SprintsSection key="sprints" />,
      <AdmissionsSection key="admissions" />,
      <InstructoresMentores key="mentors" />,
      <PreguntasFrecuentes key="faq" />,
      <ContactSection key="contact" />,
    ],
  },

  // Project Academy (arrancá así y luego le metés sus secciones propias)
  'project-academy': {
    title: 'Project Academy',
    sections: [
      <div key="placeholder" className="px-6 py-16 text-white">
        <h1 className="text-3xl font-semibold">Project Academy</h1>
        <p className="mt-2 text-white/60">Página en construcción…</p>
      </div>,
    ],
  },
}
