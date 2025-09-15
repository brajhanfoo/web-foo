'use client'

import { useState } from 'react'
import { projectsData} from '../_data/projectsData'
import ProjectCard from './ProjectCard'

export default function ProjectsSection() {
  const categories = Array.from(new Set(projectsData.map((p) => p.category)))
  const [active, setActive] = useState(categories[0])

  return (
    <section className="py-16 bg-white px-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Proyectos</h2>
      {/* Opciones */}
      <ul role="tablist" className="flex justify-center gap-4 mb-8">
        {categories.map((cat) => (
          <li key={cat}>
            <button
              role="tab"
              aria-selected={active === cat}
              onClick={() => setActive(cat)}
              className={`px-4 py-2 rounded-t-lg ${
                active === cat
                  ? 'bg-gray-800 text-yellow-400'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {cat}
            </button>
          </li>
        ))}
      </ul>


      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {projectsData
          .filter((p) => p.category === active)
          .map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
      </div>
    </section>
  )
}