import type { EditionRow, ProgramAccent, ProgramStatus } from './types/types'

const MONTHS_ES: string[] = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

function parseDateYYYYMMDD(value: string): { y: number; m: number; d: number } | null {
  const v = value.trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (!match) return null
  const y = Number(match[1])
  const m = Number(match[2])
  const d = Number(match[3])
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null
  if (m < 1 || m > 12) return null
  if (d < 1 || d > 31) return null
  return { y, m, d }
}

export function formatStartDateChip(startsAt: string | null): string | null {
  if (!startsAt) return null
  const parsed = parseDateYYYYMMDD(startsAt)
  if (!parsed) return null
  const month = MONTHS_ES[parsed.m - 1] ?? ''
  return `${parsed.d} ${month}`
}

export function formatEditionLine(edition: EditionRow | null): string | null {
  if (!edition) return null
  const name = edition.edition_name.trim()
  return name ? name : null
}

export function computeProgramStatus(params: {
  isPublished: boolean
  edition: EditionRow | null
}): ProgramStatus {
  if (!params.isPublished) return 'soon'
  if (!params.edition) return 'closed'
  return params.edition.is_open ? 'open' : 'closed'
}

export function pickAccentFromSlug(slug: string): ProgramAccent {
  if (slug === 'project-academy') return 'academy'
  if (slug === 'smart-projects') return 'projects'
  return 'default'
}

export function formatPriceUSD(price: number | null): string {
  if (typeof price !== 'number' || !Number.isFinite(price)) return '—'
  const rounded = Math.round(price * 100) / 100
  const asInt = Math.floor(rounded)
  const isInteger = Math.abs(rounded - asInt) < 0.000001
  return isInteger ? `$${asInt} USD` : `$${rounded.toFixed(2)} USD`
}
