'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface User {
  id: string
  name: string
  avatarUrl: string
}

export default function ExampleComponent({ user }: { user: User }) {
  return (
    <article className="flex items-center space-x-4 rounded-md bg-white p-4 shadow">
      <Image
        src={user.avatarUrl}
        alt={`${user.name}'s avatar`}
        width={64}
        height={64}
        className="rounded-full"
      />

      <div>
        <h2 className="text-lg font-semibold">{user.name}</h2>

        <Link href={`/users/${user.id}`}>
          <a className="cursor-pointer text-blue-600 hover:underline">
            View Profile
          </a>
        </Link>
      </div>
    </article>
  )
}
