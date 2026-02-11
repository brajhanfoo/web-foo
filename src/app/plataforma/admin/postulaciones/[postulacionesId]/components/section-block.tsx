'use client'

export function SectionBlock({
  title,
  description,
  items,
}: {
  title: string
  description?: string
  items?: { label: string; value: string }[]
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">{title}</div>

      {items?.length ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {items.map((item) => (
            <div key={item.label} className="rounded-md border p-3">
              <div className="text-xs text-slate-400">{item.label}</div>
              <div className="text-sm mt-1 break-words">{item.value}</div>
            </div>
          ))}
        </div>
      ) : null}

      {description ? (
        <div className="text-sm text-slate-400 whitespace-pre-wrap">
          {description}
        </div>
      ) : null}
    </div>
  )
}
