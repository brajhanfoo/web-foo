import Image from 'next/image'
import { Project } from '../_data/projectsData'

interface Properties {
  project: Project
}

export default function ProjectCard({ project }: Properties) {
  return (
    <div className="bg-black text-white p-6 rounded-lg shadow hover:shadow-lg transition">
      <Image
        src={project.imageUrl}
        alt={project.title}
        width={300}
        height={200}
        className="rounded-md mb-4 object-cover"
      />
      <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
      <p className="text-sm mb-4">{project.description}</p>
      {project.link && (
        <a
          href={project.link}
          className="inline-block px-4 py-2 border border-yellow-400 text-yellow-400 rounded-full hover:bg-yellow-400 hover:text-gray-900 transition"
        >
          Ir al sitio
        </a>
      )}
    </div>
  )
}
