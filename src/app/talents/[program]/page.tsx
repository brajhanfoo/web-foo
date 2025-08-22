import { notFound } from 'next/navigation'
import { MdConstruction } from 'react-icons/md'

type ProgramPageProperties = {
  params: Promise<{ program: string }>
}

export default async function ProgramPage({ params }: ProgramPageProperties) {
  const { program } = await params

  const validPrograms = ['smart-projects', 'tech-projects']

  if (!validPrograms.includes(program)) {
    return notFound()
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
