import React from 'react'

type ComingSoonItem = {
  title: string
  description: string
  badge?: string
}

const DEFAULT_ITEMS: ComingSoonItem[] = [
  {
    title: 'Tech Discovery',
    description:
      'Descubre tu rol ideal con assessment guiado, recursos y tu primer proyecto.',
    badge: 'COMING SOON',
  },
  {
    title: 'Tech Projects',
    description:
      'Especialízate en Frontend, Backend, UX/UI o QA con proyectos reales y mentoría.',
    badge: 'COMING SOON',
  },
  {
    title: 'Career Accelerator',
    description:
      'Aumenta tu valor en el mercado, sin importar tu nivel actual.',
    badge: 'COMING SOON',
  },
]

export function ComingSoonStrip(props: { items?: ComingSoonItem[] }) {
  const items = props.items ?? DEFAULT_ITEMS

  return (
    <section className="pt-12">
      <div className="text-center text-xs tracking-[0.35em] text-white/50">
        {'< '}PRÓXIMAMENTE EN EL ECOSISTEMA{' />'}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3 max-w-6xl mx-auto opacity-60">
        {items.map((x) => (
          <div
            key={x.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">{x.title}</div>
              {x.badge ? (
                <div className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-black/30 text-white/60">
                  {x.badge}
                </div>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-white/60">{x.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

