'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X, Award, Folder } from 'lucide-react'
import type { ProgramCardVM, ProgramFeature } from '../types/page'
import {
  formatEditionLine,
  formatPriceUSD,
  formatStartDateChip,
} from '../utils'

type ProgramCardProps = {
  item: ProgramCardVM
}

type AccentTokens = {
  borderClass: string
  glowClass: string
  pillClass: string
  iconWrapClass: string
  iconClass: string
  dotClass: string
  topRightIcon: 'award' | 'folder'
}

function tokensFor(vm: ProgramCardVM): AccentTokens {
  const accent = vm.content.accent
  const isOpen = vm.status === 'open'

  const PURPLE = '#A920D0'
  const TEAL = '#00D3D3'
  const EMERALD = '#00CCA4'

  if (accent === 'academy') {
    return {
      borderClass: isOpen
        ? `border-[1px] border-[${PURPLE}]/60`
        : 'border border-white/10',
      glowClass: isOpen
        ? 'shadow-[0_0_0_1px_rgba(169,32,208,0.30),0_0_48px_rgba(0,211,211,0.10)]'
        : '',
      pillClass: `bg-[${PURPLE}]/15 text-[${PURPLE}] border border-[${PURPLE}]/30`,
      iconWrapClass: isOpen
        ? `border border-[${EMERALD}]/25 bg-[${TEAL}]/10 text-[${EMERALD}]`
        : 'border border-white/10 bg-white/5',
      iconClass: isOpen ? `text-[${TEAL}]` : 'text-white/70',
      dotClass: `bg-[${TEAL}]`,
      topRightIcon: vm.content.badgeIcon,
    }
  }

  if (accent === 'projects') {
    return {
      borderClass: 'border border-white/10',
      glowClass: '',
      pillClass: 'bg-white/5 text-white/60 border border-white/10',
      iconWrapClass: 'border border-white/10 bg-white/5',
      iconClass: 'text-orange-400',
      dotClass: `bg-[${EMERALD}]`,
      topRightIcon: vm.content.badgeIcon,
    }
  }

  return {
    borderClass: 'border border-white/10',
    glowClass: '',
    pillClass: 'bg-white/5 text-white/60 border border-white/10',
    iconWrapClass: 'border border-white/10 bg-white/5',
    iconClass: 'text-white/70',
    dotClass: 'bg-white/50',
    topRightIcon: vm.content.badgeIcon,
  }
}

function FeatureRow(props: { feature: ProgramFeature }): React.JSX.Element {
  const { feature } = props
  return (
    <li className="flex items-start gap-3">
      <span className="mt-[2px]">
        {feature.enabled ? (
          <Check className="h-4 w-4 text-[#00CCA4]" />
        ) : (
          <X className="h-4 w-4 text-red-400/70" />
        )}
      </span>

      <span
        className={[
          'text-sm leading-relaxed',
          feature.enabled ? 'text-white/80' : 'text-white/35 line-through',
        ].join(' ')}
      >
        {feature.text}
      </span>
    </li>
  )
}

export function ProgramCard(props: ProgramCardProps): React.JSX.Element {
  const { item } = props

  const editionLine = useMemo(
    () => formatEditionLine(item.edition),
    [item.edition]
  )
  const startChip = useMemo(
    () => formatStartDateChip(item.edition?.starts_at ?? null),
    [item.edition?.starts_at]
  )

  const isOpen = item.status === 'open'
  const isSoon = item.status === 'soon'
  const tokens = tokensFor(item)

  const topRightIcon =
    tokens.topRightIcon === 'award' ? (
      <Award className={['h-5 w-5', tokens.iconClass].join(' ')} />
    ) : (
      <Folder className={['h-5 w-5', tokens.iconClass].join(' ')} />
    )

  const ctaText =
    item.program.slug === 'smart-projects'
      ? `VER SMART PROJECTS`
      : `VER PROJECT ACADEMY`

  // Smart Projects = CTA secundario, Academy = primario
  const ctaVariant: 'primary' | 'secondary' =
    item.program.slug === 'smart-projects' ? 'secondary' : 'primary'

  return (
    <Card
      className={[
        'relative overflow-hidden rounded-2xl bg-black/40 text-white',
        tokens.borderClass,
        tokens.glowClass,
      ].join(' ')}
    >
      {/* Frosted overlay (solo cuando está open) */}
      {isOpen ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#A920D0]/12 via-black/10 to-[#00D3D3]/10" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#A920D0]/80 via-[#00D3D3]/70 to-[#00CCA4]/80" />
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/5" />
        </>
      ) : null}

      {isSoon ? (
        <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-white/5 blur-2xl" />
      ) : null}

      <CardHeader className="relative pb-4">
        <div className="flex items-center justify-between">
          <Badge
            className={['text-[10px] tracking-wider', tokens.pillClass].join(
              ' '
            )}
          >
            {item.content.pillLabel}
          </Badge>

          <div className="flex items-center gap-3">
            {item.status === 'open' ? (
              <Badge className="bg-[#00CCA4]/15 text-[#00CCA4] border border-[#00CCA4]/25">
                <span
                  className={[
                    'mr-2 inline-block h-1.5 w-1.5 rounded-full',
                    tokens.dotClass,
                  ].join(' ')}
                />
                ABIERTO
              </Badge>
            ) : item.status === 'closed' ? (
              <Badge className="bg-white/5 text-white/60 border border-white/10">
                CERRADO
              </Badge>
            ) : (
              <Badge className="bg-white/5 text-white/60 border border-white/10">
                PRÓXIMAMENTE
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-2xl md:text-3xl font-semibold">
              {item.program.title}
            </CardTitle>

            <p className="text-sm md:text-base text-white/60 max-w-[62ch] whitespace-pre-line">
              {item.program.description ?? '—'}
            </p>
          </div>

          <div
            className={[
              'h-11 w-11 rounded-xl flex items-center justify-center',
              tokens.iconWrapClass,
            ].join(' ')}
          >
            {topRightIcon}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {item.content.features.length > 0 ? (
          <ul className="space-y-3">
            {item.content.features.map((f) => (
              <FeatureRow key={f.id} feature={f} />
            ))}
          </ul>
        ) : (
          <div className="text-sm text-white/60">Información próximamente.</div>
        )}

        <div className="h-px bg-white/10" />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-white/40">
              Modalidad
            </div>
            <div className="text-sm font-semibold text-white/85">
              {item.content.modalityLabel}
            </div>

            {editionLine ? (
              <div className="text-xs text-white/50">
                {editionLine}
                {startChip ? (
                  <span className="text-white/40"> · Inicio: {startChip}</span>
                ) : null}
              </div>
            ) : (
              <div className="text-xs text-white/40">Sin edición</div>
            )}
          </div>

          <div className="text-right space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-white/40">
              Inversión
            </div>
            <div className="text-sm font-semibold text-white">
              {formatPriceUSD(item.program.price_usd)}
            </div>
          </div>
        </div>

        {/* CTA único (sin link extra abajo) */}
        {ctaVariant === 'secondary' ? (
          <Button
            asChild
            variant="outline"
            className="w-full rounded-xl py-6 font-semibold bg-black/20 text-white border border-white/15 hover:bg-white/5"
          >
            <Link href={`/programas/${item.program.slug}`}>{ctaText}</Link>
          </Button>
        ) : (
          <Button
            asChild
            className="w-full rounded-xl py-6 font-semibold bg-[#00CCA4] text-black hover:bg-[#00CCA4]/90"
          >
            <Link href={`/programas/${item.program.slug}`}>{ctaText}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// 'use client'

// import React, { useMemo } from 'react'
// import Link from 'next/link'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
// import { Button } from '@/components/ui/button'
// import { Check, X, Award, Folder } from 'lucide-react'
// import type { ProgramCardVM, ProgramFeature } from '../types/page'
// import {
//   formatEditionLine,
//   formatPriceUSD,
//   formatStartDateChip,
// } from '../utils'

// type ProgramCardProps = {
//   item: ProgramCardVM
// }

// type AccentTokens = {
//   borderClass: string
//   glowClass: string
//   pillClass: string
//   iconWrapClass: string
//   iconClass: string
//   dotClass: string
//   topRightIcon: 'award' | 'folder'
// }

// function tokensFor(vm: ProgramCardVM): AccentTokens {
//   const accent = vm.content.accent
//   const isOpen = vm.status === 'open'

//   // Paleta base
//   const PURPLE = '#A920D0'
//   const TEAL = '#00D3D3'
//   const EMERALD = '#00CCA4'

//   if (accent === 'academy') {
//     return {
//       borderClass: isOpen
//         ? `border-[1px] border-[${PURPLE}]/60`
//         : 'border border-white/10',
//       glowClass: isOpen
//         ? `shadow-[0_0_0_1px_rgba(169,32,208,0.30),0_0_48px_rgba(0,211,211,0.10)]`
//         : '',
//       pillClass: `bg-[${PURPLE}]/15 text-[${PURPLE}] border border-[${PURPLE}]/30`,
//       iconWrapClass: isOpen
//         ? `border border-[${EMERALD}]/25 bg-[${TEAL}]/10 text-[${EMERALD}]`
//         : 'border border-white/10 bg-white/5',
//       iconClass: isOpen ? `text-[${TEAL}]` : 'text-white/70',
//       dotClass: `bg-[${TEAL}]`,
//       topRightIcon: vm.content.badgeIcon,
//     }
//   }

//   if (accent === 'projects') {
//     return {
//       borderClass: 'border border-white/10',
//       glowClass: '',
//       pillClass: 'bg-white/5 text-white/60 border border-white/10',
//       iconWrapClass: 'border border-white/10 bg-white/5',
//       iconClass: 'text-orange-400',
//       dotClass: `bg-[${EMERALD}]`,
//       topRightIcon: vm.content.badgeIcon,
//     }
//   }

//   return {
//     borderClass: 'border border-white/10',
//     glowClass: '',
//     pillClass: 'bg-white/5 text-white/60 border border-white/10',
//     iconWrapClass: 'border border-white/10 bg-white/5',
//     iconClass: 'text-white/70',
//     dotClass: 'bg-white/50',
//     topRightIcon: vm.content.badgeIcon,
//   }
// }

// function FeatureRow(props: { feature: ProgramFeature }): React.JSX.Element {
//   const { feature } = props
//   return (
//     <li className="flex items-start gap-3">
//       <span className="mt-[2px]">
//         {feature.enabled ? (
//           <Check className="h-4 w-4 text-[#00CCA4]" />
//         ) : (
//           <X className="h-4 w-4 text-red-400/70" />
//         )}
//       </span>

//       <span
//         className={[
//           'text-sm leading-relaxed',
//           feature.enabled ? 'text-white/80' : 'text-white/35 line-through',
//         ].join(' ')}
//       >
//         {feature.text}
//       </span>
//     </li>
//   )
// }

// export function ProgramCard(props: ProgramCardProps): React.JSX.Element {
//   const { item } = props

//   const editionLine = useMemo(
//     () => formatEditionLine(item.edition),
//     [item.edition]
//   )
//   const startChip = useMemo(
//     () => formatStartDateChip(item.edition?.starts_at ?? null),
//     [item.edition?.starts_at]
//   )

//   const isOpen = item.status === 'open'
//   const isSoon = item.status === 'soon'
//   const tokens = tokensFor(item)

//   const topRightIcon =
//     tokens.topRightIcon === 'award' ? (
//       <Award className={['h-5 w-5', tokens.iconClass].join(' ')} />
//     ) : (
//       <Folder className={['h-5 w-5', tokens.iconClass].join(' ')} />
//     )

//   const ctaDisabled = item.status !== 'open'
//   const ctaText =
//     item.status === 'open'
//       ? item.content.ctaLabel
//       : item.status === 'closed'
//         ? 'CONVOCATORIA CERRADA'
//         : 'PRÓXIMAMENTE'

//   return (
//     <Card
//       className={[
//         'relative overflow-hidden rounded-2xl bg-black/40 text-white',
//         tokens.borderClass,
//         tokens.glowClass,
//       ].join(' ')}
//     >
//       {/* Frosted overlay (solo cuando está open) */}
//       {isOpen ? (
//         <>
//           <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#A920D0]/12 via-black/10 to-[#00D3D3]/10" />
//           <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#A920D0]/80 via-[#00D3D3]/70 to-[#00CCA4]/80" />
//           <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/5" />
//         </>
//       ) : null}

//       {isSoon ? (
//         <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-white/5 blur-2xl" />
//       ) : null}

//       <CardHeader className="relative pb-4">
//         <div className="flex items-center justify-between">
//           <Badge
//             className={['text-[10px] tracking-wider', tokens.pillClass].join(
//               ' '
//             )}
//           >
//             {item.content.pillLabel}
//           </Badge>

//           <div className="flex items-center gap-3">
//             {/* status pill */}
//             {item.status === 'open' ? (
//               <Badge className="bg-[#00CCA4]/15 text-[#00CCA4] border border-[#00CCA4]/25">
//                 <span
//                   className={[
//                     'mr-2 inline-block h-1.5 w-1.5 rounded-full',
//                     tokens.dotClass,
//                   ].join(' ')}
//                 />
//                 ABIERTO
//               </Badge>
//             ) : item.status === 'closed' ? (
//               <Badge className="bg-white/5 text-white/60 border border-white/10">
//                 CERRADO
//               </Badge>
//             ) : (
//               <Badge className="bg-white/5 text-white/60 border border-white/10">
//                 PRÓXIMAMENTE
//               </Badge>
//             )}
//           </div>
//         </div>

//         <div className="mt-5 flex items-start justify-between gap-4">
//           <div className="space-y-2">
//             <CardTitle className="text-2xl md:text-3xl font-semibold">
//               {item.program.title}{' '}
//             </CardTitle>

//             <p className="text-sm md:text-base text-white/60 max-w-[62ch] whitespace-pre-line">
//               {item.program.description ?? '—'}
//             </p>
//           </div>
//           <div
//             className={[
//               'h-11 w-11 rounded-xl flex items-center justify-center',
//               tokens.iconWrapClass,
//             ].join(' ')}
//           >
//             {topRightIcon}
//           </div>{' '}
//         </div>
//       </CardHeader>

//       <CardContent className="relative space-y-6">
//         {/* features */}
//         {item.content.features.length > 0 ? (
//           <ul className="space-y-3">
//             {item.content.features.map((f) => (
//               <FeatureRow key={f.id} feature={f} />
//             ))}
//           </ul>
//         ) : (
//           <div className="text-sm text-white/60">Información próximamente.</div>
//         )}

//         <div className="h-px bg-white/10" />

//         {/* bottom row */}
//         <div className="flex items-center justify-between gap-4">
//           <div className="space-y-1">
//             <div className="text-[10px] uppercase tracking-widest text-white/40">
//               Modalidad
//             </div>
//             <div className="text-sm font-semibold text-white/85">
//               {item.content.modalityLabel}
//             </div>

//             {editionLine ? (
//               <div className="text-xs text-white/50">
//                 {editionLine}
//                 {startChip ? (
//                   <span className="text-white/40"> · Inicio: {startChip}</span>
//                 ) : null}
//               </div>
//             ) : (
//               <div className="text-xs text-white/40">Sin edición</div>
//             )}
//           </div>

//           <div className="text-right space-y-1">
//             <div className="text-[10px] uppercase tracking-widest text-white/40">
//               Inversión
//             </div>
//             <div className="text-sm font-semibold text-white">
//               {formatPriceUSD(item.program.price_usd)}
//             </div>
//           </div>
//         </div>

//         {/* CTA */}
//         <Button
//           asChild={!ctaDisabled}
//           disabled={ctaDisabled}
//           className={[
//             'w-full rounded-xl py-6 font-semibold',
//             ctaDisabled
//               ? 'bg-white/5 text-white/40 border border-white/10'
//               : 'bg-[#00CCA4] text-black hover:bg-[#00CCA4]/90',
//           ].join(' ')}
//         >
//           {ctaDisabled ? (
//             <span>{ctaText}</span>
//           ) : (
//             <Link href={`/programas/${item.program.slug}`}>{ctaText}</Link>
//           )}
//         </Button>

//         {/* subtle footer link */}
//         <div className="text-center">
//           <Link
//             href={`/programas/${item.program.slug}`}
//             className="text-xs text-white/50 hover:text-white/70 underline underline-offset-4"
//           >
//             Ver detalles del programa
//           </Link>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }
