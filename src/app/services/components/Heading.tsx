import Image from 'next/image'
import React from 'react'
interface HeadingProps {
  text: string
}
export default function Heading({ text }: HeadingProps) {
  return (
    <div className="mx-auto mb-10">
      <div className="relative inline-flex items-center gap-3 rounded-full px-5 py-3 text-white bg-transparent border border-gray-100/10">
        <span className="pointer-events-none absolute top-0 left-1/2 h-[2px] w-[55%] -translate-x-1/2 rounded-full bg-[linear-gradient(90deg,transparent,rgba(216,70,239,0.7),transparent)]" />
        <span className="relative grid size-10 place-items-center rounded-full bg-[radial-gradient(ellipse_at_center,hsl(var(--purple-400))_0%,hsl(var(--purple-600))_70%)] ring-1 ring-white/15 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.35),0_8px_16px_rgba(216,70,239,0.18)]">
          <Image
            src="./setting.svg"
            alt="Servicios"
            width={20}
            height={20}
            className="text-white"
          />
        </span>
        <span className="text-lg font-medium">{text}</span>
      </div>
    </div>
  )
}
