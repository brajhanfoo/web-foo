'use client'

import { useState } from 'react'
import { projectsData } from '../_data/projectsData'
import ProjectCard from './ProjectCard'
import Image from 'next/image'
import Heading from './Heading'

export default function ProjectsSection() {
  const categories = Array.from(new Set(projectsData.map((p) => p.category)))
  const [active, setActive] = useState(categories[0])

  return (
    <section className="py-16  px-4 grid">
      <Heading text="Proyectos" />

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mx-auto">
        {projectsData
          .filter((p) => p.category === active)
          .map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
      </div>
    </section>
  )
}
