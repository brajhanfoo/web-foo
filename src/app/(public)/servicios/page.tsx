import { Hero } from "./components"
import Form from "./components/Form"


const page = () => {
  return (
  
    <main className="min-h-screen flex flex-col items-center bg-black text-white px-6 gap-32 py-20">
    <Hero />
    <Form />
    </main>
  )
}

export default page
