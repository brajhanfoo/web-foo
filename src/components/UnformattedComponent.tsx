import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface User {
  name: string
}

interface Props {
  user: User
}

export default function ExampleComponent({ user }: Props) {
  const [data, setData] = useState<User | null>(null)

  useEffect(() => {
    // ✅ Dependencia agregada correctamente
    setData(user)
  }, [user])

  return (
    <div>
      {/* ✅ Uso de <Image> en lugar de <img> */}
      <Image src="/logo.png" alt="Logo" width={100} height={100} />

      {/* ✅ Uso de <Link> en lugar de <a> */}
      <Link href="/about">About</Link>

      {/* ✅ Props tipadas, sin any */}
      <p>{data?.name}</p>
    </div>
  )
}
