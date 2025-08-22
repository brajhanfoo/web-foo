import Image from 'next/image'
import { LOGO } from '@/lib/imagePaths'

const page = () => {
  return (
    <main className="flex flex-col items-center justify-center h-[calc(100vh-100px)] bg-gray-900">
      <Image src={LOGO} alt="Logo de FooTalentGroup" width={300} height={300} />
    </main>
  )
}

export default page
