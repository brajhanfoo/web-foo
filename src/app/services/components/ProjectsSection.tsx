'use client'

import { projectsData } from '../_data/projectsData'
import ProjectCard from './ProjectCard'
import Heading from './Heading'

export default function ProjectsSection() {
  const categories = Array.from(
    new Set(projectsData.map((project) => project.category))
  )
  const activeCategory = categories[0]

  return (
    <section className="py-16 px-4 grid">
      <Heading text="Proyectos" />

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mx-auto">
        {projectsData
          .filter((project) => project.category === activeCategory)
          .map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
      </div>
    </section>
  )
}
