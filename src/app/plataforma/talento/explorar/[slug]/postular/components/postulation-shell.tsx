'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function PostulationShell({
  stepLabel,
  title,
  programTitle,
  subtitle,
  children,
}: {
  stepLabel: string
  title: string
  programTitle?: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-black">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-240px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute left-[10%] top-[30%] h-[340px] w-[340px] rounded-full bg-emerald-400/5 blur-3xl" />
        <div className="absolute right-[10%] top-[40%] h-[340px] w-[340px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[1200px] px-4 pb-10 pt-8 md:px-6">
        <div className="mb-6 flex flex-col gap-2 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-2 uppercase tracking-widest">
            <span>
              {programTitle
                ? `${programTitle} - Proceso de postulación`
                : 'Proceso de postulación'}
            </span>
          </div>
          <div className="uppercase tracking-widest md:text-right">
            {stepLabel}
          </div>
        </div>

        <Card
          className={cn(
            'overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_80px_rgba(0,0,0,0.7)]'
          )}
        >
          <CardHeader className="border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
            <div className="mx-auto w-full max-w-4xl">
              <div className="text-center">
                <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-300/80">
                  {stepLabel}
                </div>
                <h1 className="mt-3 text-balance text-2xl font-semibold text-white md:text-3xl">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mx-auto mt-2 max-w-2xl text-sm text-white/60">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </CardHeader>

          <CardContent className="mx-auto w-full max-w-4xl p-6 md:p-10">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
