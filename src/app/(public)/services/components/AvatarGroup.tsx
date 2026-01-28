import Image from 'next/image'

type AvatarGroupProperties = {
  avatars: string[]
  max?: number
}

export default function AvatarGroup({
  avatars,
  max = 3,
}: AvatarGroupProperties) {
  const visibleAvatars = avatars.slice(0, max)
  const hiddenCount = avatars.length - max

  return (
    <div className="flex -space-x-3">
      {visibleAvatars.map((source, index) => (
        <div
          key={index}
          className="relative w-13 h-13 rounded-full border-4 border-yellow overflow-hidden"
        >
          <Image
            src={source}
            alt={`Avatar ${index}`}
            fill
            className="object-cover"
          />
        </div>
      ))}

      {hiddenCount > 0 && (
        <div className="flex items-center justify-center w-13 h-13 rounded-full bg-yellow text-white-dark text-xl font-bold border-4 border-yellow">
          +{hiddenCount}
        </div>
      )}
    </div>
  )
}
