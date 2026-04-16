// src/app/plataforma/talento/mis-postulaciones/components/shell-card.tsx
'use client'

import type * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { ApplicationStatus } from '../types'
import { borderAccentClass, topDotClass, iconGlowClass } from '../helpers'

export function ShellCard(props: {
  status: ApplicationStatus
  variant?: 'default' | 'admitted'
  topLeft: React.ReactNode
  topRight: React.ReactNode
  icon: React.ReactNode
  title: string
  description: string
  bottomLeft: React.ReactNode
  bottomRight: React.ReactNode
  bottomRightAlign?: 'start' | 'end'
  className?: string
}) {
  const variant = props.variant ?? 'default'

  if (variant === 'admitted') {
    // Layout “como captura”: cuerpo en 2 columnas (texto + CTA)
    return (
      <Card
        className={[
          'relative overflow-hidden border shadow-sm',
          'backdrop-blur supports-[backdrop-filter]:bg-background/10',
          borderAccentClass(props.status),
          props.className ? props.className : '',
        ].join(' ')}
      >
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={[
                  'h-2 w-2 rounded-full',
                  topDotClass(props.status),
                ].join(' ')}
              />
              <span className="truncate">{props.topLeft}</span>
            </div>
            <div className="shrink-0">{props.topRight}</div>
          </div>
        </CardHeader>

        <CardContent className="pb-5">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
            {/* Left: icon + text */}
            <div className="flex items-start gap-4">
              <div
                className={[
                  'relative grid h-14 w-14 place-items-center rounded-xl',
                  'bg-gradient-to-br from-black/60 to-black/90',
                  'border transition-all duration-300',
                  iconGlowClass(props.status),
                ].join(' ')}
              >
                {props.icon}
              </div>

              <div className="min-w-0">
                <div className="text-xl font-semibold leading-tight text-amber-50">
                  {props.title}
                </div>
                <div className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  {props.description}
                </div>

                <div className="mt-4">{props.bottomLeft}</div>
              </div>
            </div>

            {/* Right: CTA */}
            <div className="flex w-full flex-col items-stretch gap-2 md:w-[260px]">
              {props.bottomRight}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default layout (el que ya tenías)
  return (
    <Card
      className={[
        'relative overflow-hidden border bg-background/10',
        'backdrop-blur supports-[backdrop-filter]:bg-background/10',
        'shadow-sm',
        borderAccentClass(props.status),
        props.className ? props.className : '',
      ].join(' ')}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={[
                'h-2 w-2 rounded-full',
                topDotClass(props.status),
              ].join(' ')}
            />
            <span className="truncate">{props.topLeft}</span>
          </div>
          <div className="shrink-0">{props.topRight}</div>
        </div>
      </CardHeader>

      <CardContent className="pb-5">
        <div className="flex items-start gap-4">
          <div
            className={[
              'relative grid h-14 w-14 place-items-center rounded-xl',
              'bg-gradient-to-br from-black/60 to-black/90',
              'border transition-all duration-300',
              iconGlowClass(props.status),
            ].join(' ')}
          >
            {props.icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-xl font-semibold leading-tight text-amber-50">
              {props.title}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {props.description}
            </div>

            <Separator className="my-4 opacity-40" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                {props.bottomLeft}
              </div>
              <div
                className={[
                  'flex flex-wrap items-center gap-2',
                  props.bottomRightAlign === 'start'
                    ? 'justify-start'
                    : 'justify-end',
                ].join(' ')}
              >
                {props.bottomRight}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// // src/app/plataforma/talento/mis-postulaciones/components/shell-card.tsx

// 'use client'

// import type * as React from 'react'
// import { Card, CardContent, CardHeader } from '@/components/ui/card'
// import { Separator } from '@/components/ui/separator'
// import type { ApplicationStatus } from '../types'
// import { borderAccentClass, topDotClass, iconGlowClass } from '../helpers'

// export function ShellCard(props: {
//   status: ApplicationStatus
//   topLeft: React.ReactNode
//   topRight: React.ReactNode
//   icon: React.ReactNode
//   title: string
//   description: string
//   bottomLeft: React.ReactNode
//   bottomRight: React.ReactNode
//   bottomRightAlign?: 'start' | 'end'
// }) {
//   return (
//     <Card
//       className={[
//         'relative overflow-hidden border bg-background/10',
//         'backdrop-blur supports-[backdrop-filter]:bg-background/10',
//         'shadow-sm',
//         borderAccentClass(props.status),
//       ].join(' ')}
//     >
//       <CardHeader className="pb-3">
//         <div className="flex items-center justify-between gap-3">
//           <div className="flex items-center gap-2 text-xs text-muted-foreground">
//             <span
//               className={[
//                 'h-2 w-2 rounded-full',
//                 topDotClass(props.status),
//               ].join(' ')}
//             />
//             <span className="truncate">{props.topLeft}</span>
//           </div>
//           <div className="shrink-0">{props.topRight}</div>
//         </div>
//       </CardHeader>

//       <CardContent className="pb-5 text-amber-50">
//         <div className="flex items-start gap-4">
//           <div
//             className={[
//               'relative grid h-14 w-14 place-items-center rounded-xl',
//               'bg-gradient-to-br from-black/60 to-black/90',
//               'border',
//               'transition-all duration-300',
//               iconGlowClass(props.status),
//             ].join(' ')}
//           >
//             {props.icon}
//           </div>

//           <div className="min-w-0 flex-1">
//             <div className="text-xl font-semibold leading-tight">
//               {props.title}
//             </div>
//             <div className="mt-1 text-sm text-muted-foreground">
//               {props.description}
//             </div>

//             <Separator className="my-4 opacity-40" />

//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//               <div className="text-xs text-muted-foreground">
//                 {props.bottomLeft}
//               </div>
//               <div
//                 className={[
//                   'flex items-center gap-2',
//                   props.bottomRightAlign === 'start'
//                     ? 'justify-start'
//                     : 'justify-end',
//                 ].join(' ')}
//               >
//                 {props.bottomRight}
//               </div>
//             </div>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }
