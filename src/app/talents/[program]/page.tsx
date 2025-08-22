import { notFound } from 'next/navigation'
import { MdConstruction } from 'react-icons/md'

type PropertiesPrograms = {
  params: {
    program: string
  }
}

export default function ProgramPage({ params }: PropertiesPrograms) {
  const { program } = params

  // lista de programas válidos (opcional)
  const validPrograms = ['smart-projects', 'tech-projects']

  if (!validPrograms.includes(program)) {
    return notFound() // muestra la página 404 de Next si no existe
  }

  return (
    <div className="p-6 bg-gray-900 h-[calc(100vh-100px)]">
      <h1 className="text-3xl font-bold capitalize text-white">
        {program.replace('-', ' ')}
      </h1>
      <p className="mt-2 text-gray-100">
        Bienvenido al programa <strong>{program.replace('-', ' ')}</strong>.
      </p>
      <div className="mt-10">
        <p className="text-gray-100">página en construcción...</p>
        <div className="text-[80px] text-gray-100 mt-4">
          <MdConstruction />
        </div>
      </div>
    </div>
  )
}
