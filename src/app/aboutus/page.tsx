import AboutHero from "./components/AboutHero";
import HistoriaSection from "./components/HistoriaSection";
import MisionVisionSection from "./components/MisionVisionSection";
import TeamSection from "./components/TeamSection";
import ValoresSection from "./components/ValoresSection";


export default function AboutUsPage() {
  return (
    <main>
      <AboutHero />
     <ValoresSection />
     <HistoriaSection/>
     <MisionVisionSection/>
     <TeamSection/>
    </main>
  )
}
