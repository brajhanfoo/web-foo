import React from 'react'
import type { ResolvedProgramPricing } from '@/lib/pricing'
import type { ProgramRow } from '@/types/programs'

import ProgramHeroSmartProjects from '@/app/(public)/programas/[program]/components/ProgramHeroSmartProjects'
import AboutSection from '@/app/(public)/programas/[program]/components/AboutSection'
import Timeline from '@/app/(public)/programas/[program]/components/Timeline'
import SprintsSection from '@/app/(public)/programas/[program]/components/SprintsSection'
import AdmissionsSection from '@/app/(public)/programas/[program]/components/AdmissionsSection'
import InstructoresMentores from '@/app/(public)/programas/[program]/components/InstructoresMentores'
import PreguntasFrecuentes from '@/app/(public)/programas/[program]/components/PreguntasFrecuentes'
import ContactSection from '@/app/(public)/programas/[program]/components/ContactSection'
import HeroProjectAcademy from './components/project_academy/HeroProjectAcademy'
import IsThisProgramForYou from './components/project_academy/IsThisProgramForYou'
import AboutProjectAcademySection from './components/project_academy/AboutProjectAcademySection'
import RealWorldProductSection from './components/project_academy/RealWorldProductSection'
import ProgramStructureAccordion from './components/project_academy/ProgramStructureAccordion'
import TracksSection from './components/project_academy/TracksSection'
import SolutionDefinitionSection from './components/project_academy/SolutionDefinitionSection'
import AgileRitualsSection from './components/project_academy/AgileRitualsSection'
import CareerIntensiveSection from './components/project_academy/CareerIntensiveSection'
import EvaluationCertificationSection from './components/project_academy/EvaluationCertificationSection'
import CareerOutcomeSection from './components/project_academy/CareerOutcomeSection'
import LaunchInvestmentSection from './components/project_academy/LaunchInvestmentSection'
import FinalCtaSection from './components/project_academy/FinalCtaSection'
import FAQSection from './components/FAQSection'
import EnrollmentStepsSection from './components/project_academy/ProjectAcademyEnrollmentSteps'
import AdmissionProcess from './components/AdmissionProcess'
import AdmissionPricing from './components/AdmissionPricing'

// Temporal: ocultar bloque de inversion/precio en landing publica de Project Academy.
// Para reactivar, cambiar a `true`.
const SHOW_PROJECT_ACADEMY_PRICING_SECTION = false

type ProgramRenderParams = {
  program: ProgramRow
  countryCode: string | null
  pricing: ResolvedProgramPricing
}

type ProgramRenderSpec = {
  title: string
  renderSections: (params: ProgramRenderParams) => React.ReactNode[]
}

export const PROGRAM_SPECS: Record<string, ProgramRenderSpec> = {
  'smart-projects': {
    title: 'Smart Projects',
    renderSections: ({ program, countryCode, pricing }) => [
      <ProgramHeroSmartProjects key="hero" />,
      <AboutSection key="about" />,
      <Timeline key="timeline" />,
      <SprintsSection key="sprints" />,
      <AdmissionsSection key="admissions" />,
      <AdmissionProcess key="admission-process" />,
      <InstructoresMentores key="mentors" />,
      <AdmissionPricing
        key="admission-pricing"
        program={program}
        countryCode={countryCode}
        initialPricing={pricing}
      />,
      <PreguntasFrecuentes key="faq" />,
      <ContactSection key="contact" />,
    ],
  },

  'project-academy': {
    title: 'Project Academy',
    renderSections: ({ program, countryCode, pricing }) => [
      <div key="placeholder" className="px-6 md:py-16 text-white">
        <HeroProjectAcademy />
        <IsThisProgramForYou />
        <AboutProjectAcademySection />
        <RealWorldProductSection />
        <ProgramStructureAccordion />
        <EnrollmentStepsSection />
        <CareerIntensiveSection />
        <EvaluationCertificationSection />
        <CareerOutcomeSection />
        {SHOW_PROJECT_ACADEMY_PRICING_SECTION ? (
          <LaunchInvestmentSection
            program={program}
            countryCode={countryCode}
            initialPricing={pricing}
          />
        ) : null}
        <FinalCtaSection />
        <FAQSection />
      </div>,
    ],
  },
}
