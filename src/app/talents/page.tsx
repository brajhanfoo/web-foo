import AboutSection from "./components/AboutSection";
import AdmissionsSection from "./components/AdmissionsSection";
import ContactSection from "./components/ContactSection";
import InstructoresMentores from "./components/InstructoresMentores";
import PreguntasFrecuentes from "./components/PreguntasFrecuentes";
import ProgramHero from "./components/ProgramHero";
import SprintsSection from "./components/SprintsSection";
import Timeline from "./components/Timeline";

export default function TalentsPage() {
  return (
    <div>
      <ProgramHero/>
      <AboutSection/>
      <Timeline/>
      <SprintsSection/>
      <AdmissionsSection/>
      <InstructoresMentores/>
      <PreguntasFrecuentes/>
      <ContactSection/>
    </div>
  )
}
