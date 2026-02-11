'use client'

import { cn } from '@/lib/utils'
import {
  Brush,
  Code2,
  Database,
  ShieldCheck,
  BriefcaseBusiness,
  ClipboardList,
  Layers,
  Zap,
} from 'lucide-react'

export type RoleOption = {
  key:
    | 'ux_ui'
    | 'frontend'
    | 'backend'
    | 'qa'
    | 'product_manager'
    | 'analista_funcional'
    | 'project_manager'
    | 'no_code'
  title: string
  subtitle: string
}

const ROLE_ICON: Record<
  RoleOption['key'],
  React.ComponentType<{ className?: string }>
> = {
  ux_ui: Brush,
  frontend: Code2,
  backend: Database,
  qa: ShieldCheck,
  product_manager: BriefcaseBusiness,
  analista_funcional: ClipboardList,
  project_manager: Layers,
  no_code: Zap,
}

export function StepRole({
  options,
  selectedTitle,
  onSelect,
  onNext,
}: {
  options: RoleOption[]
  selectedTitle: string
  onSelect: (title: string) => void
  onNext: () => void
}) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {options.map((role) => {
          const Icon = ROLE_ICON[role.key]
          const selected = selectedTitle === role.title

          return (
            <button
              key={role.key}
              type="button"
              onClick={() => onSelect(role.title)}
              className={cn(
                'group relative rounded-2xl border p-5 text-left transition flex flex-col items-center ',
                'border-white/10 bg-white/[0.02] hover:border-emerald-400/35 hover:bg-emerald-400/[0.04]',
                selected && 'border-emerald-400/50 bg-emerald-400/[0.06]'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-emerald-200/90 group-hover:border-emerald-400/30">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5">
                <div className="text-sm font-semibold text-white">
                  {role.title}
                </div>
                <div className="mt-1 text-xs text-white/55">
                  {role.subtitle}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
        >
          Siguiente paso
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  )
}
