import { Hero } from './components'
import Form from './components/Form'

const page = () => {
  return (
    <main className="flex min-h-screen flex-col items-center gap-20 bg-black px-4 py-20 text-white sm:gap-24 sm:px-6 md:gap-32">
      <Hero />
      <Form />
    </main>
  )
}

export default page
