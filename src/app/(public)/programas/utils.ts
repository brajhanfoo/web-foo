import type {
  ApplicationFormRow,
  EditionRow,
  ProgramAccent,
  ProgramStatus,
} from './types/types'

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

function parseDateYYYYMMDD(
  value: string
): { y: number; m: number; d: number } | null {
  const v = value.trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (!match) return null
  const y = Number(match[1])
  const m = Number(match[2])
  const d = Number(match[3])
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d))
    return null
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

export function formatDateRangeChip(
  startsAt: string | null,
  endsAt: string | null
): string | null {
  const start = formatStartDateChip(startsAt)
  const end = formatStartDateChip(endsAt)
  if (!start && !end) return null
  if (start && end) return `${start} - ${end}`
  return start ?? end ?? null
}

export function formatEditionLine(edition: EditionRow | null): string | null {
  if (!edition) return null
  const name = edition.edition_name.trim()
  return name ? name : null
}

export function computeProgramStatus(params: {
  isPublished: boolean
  edition: EditionRow | null
  form?: ApplicationFormRow | null
  now?: Date
}): ProgramStatus {
  if (!params.isPublished) return 'soon'
  if (!params.edition) return 'closed'
  if (!params.edition.is_open) return 'closed'
  if (!params.form) return 'closed'

  const now = params.now ?? new Date()
  const opensAt = params.form.opens_at ? new Date(params.form.opens_at) : null
  const closesAt = params.form.closes_at ? new Date(params.form.closes_at) : null

  if (opensAt && now < opensAt) return 'closed'
  if (closesAt && now > closesAt) return 'closed'

  return params.form.is_active ? 'open' : 'closed'
}

export function pickAccentFromSlug(slug: string): ProgramAccent {
  if (slug === 'project-academy') return 'academy'
  if (slug === 'smart-projects') return 'projects'
  return 'default'
}

export function formatPriceUSD(price: number | string | null): string {
  const numeric = typeof price === 'string' ? Number(price) : price
  if (typeof numeric !== 'number' || !Number.isFinite(numeric)) return '—'
  const rounded = Math.round(numeric * 100) / 100
  const asInt = Math.floor(rounded)
  const isInteger = Math.abs(rounded - asInt) < 0.000001
  return isInteger ? `$${asInt} USD` : `$${rounded.toFixed(2)} USD`
}
