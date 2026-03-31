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
import HeroProjectAcademy from './components/project_academy/HeroProjectAcademy'
import IsThisProgramForYou from './components/project_academy/IsThisProgramForYou'
import AboutProjectAcademySection from './components/project_academy/AboutProjectAcademySection'
import RealWorldProductSection from './components/project_academy/RealWorldProductSection'
import ProgramStructureAccordion from './components/project_academy/ProgramStructureAccordion'
import TracksSection from './components/project_academy/TracksSection'
import SolutionDefinitionSection from './components/project_academy/SolutionDefinitionSection'
import AgileRitualsSection from './components/project_academy/AgileRitualsSection'
import MentorshipSection from './components/project_academy/MentorshipSection'
import CareerIntensiveSection from './components/project_academy/CareerIntensiveSection'
import EvaluationCertificationSection from './components/project_academy/EvaluationCertificationSection'
import CareerOutcomeSection from './components/project_academy/CareerOutcomeSection'
import LaunchInvestmentSection from './components/project_academy/LaunchInvestmentSection'
import FinalCtaSection from './components/project_academy/FinalCtaSection'
import FAQSection from './components/FAQSection'

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
      <div key="placeholder" className="px-6 md:py-16 text-white">
        <HeroProjectAcademy />
        <IsThisProgramForYou />
        <AboutProjectAcademySection />
        <RealWorldProductSection />
        <ProgramStructureAccordion />
        <TracksSection />
        {/* <SolutionDefinitionSection /> */}
        <AgileRitualsSection />
        {/* <MentorshipSection /> */}
        <CareerIntensiveSection />
        <EvaluationCertificationSection />
        <CareerOutcomeSection />
        <LaunchInvestmentSection />
        <FinalCtaSection />
        <FAQSection />
      </div>,
    ],
  },
}
