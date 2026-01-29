import Image from 'next/image'
import { Project } from '../_data/projectsData'

interface Properties {
  project: Project
}

export default function ProjectCard({ project }: Properties) {
  return (
    <div className=" text-white p-6 rounded-lg shadow hover:shadow-lg transition bg-[radial-gradient(ellipse_at_center,rgba(158,110,230,0.28)_0%,rgba(158,110,230,0)_60%)] grid">
      <div className="relative w-[500px] h-[250px] overflow-hidden rounded-md">
        {/* Fondo con la misma imagen */}
        <div
          className="absolute inset-0 bg-center bg-cover opacity-15 scale-125 rounded-md "
          style={{ backgroundImage: `url(${project.imageUrl})` }}
        />

        {/* Imagen principal */}
        <Image
          src={project.imageUrl}
          alt={project.title}
          width={300}
          height={200}
          className="relative z-10 rounded-md object-cover"
        />
      </div>
      <div className="">
        <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
        <p className="text-sm mb-4">{project.description}</p>
      </div>
    </div>
  )
}
