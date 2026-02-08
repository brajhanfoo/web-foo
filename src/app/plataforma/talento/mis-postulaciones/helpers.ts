// src/app/plataforma/talento/mis-postulaciones/helpers.ts

import type {
  ApplicationStatus,
  ApplicationRow,
  EditionRow,
  PastCompletedItem,
} from './types'

export function safeTrim(value: string | null | undefined): string {
  return (value ?? '').trim()
}

export function fmtDateESFromISO(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Fecha no disponible'
  return d.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function fmtMonthYearFromDateISO(dateIso: string): string {
  // DATE => "YYYY-MM-DD" (evitamos new Date("YYYY-MM-DD") por timezone)
  const s = safeTrim(dateIso)
  if (!s) return 'Fecha no disponible'
  const parts = s.split('-')
  if (parts.length !== 3) return 'Fecha no disponible'

  const year = Number(parts[0])
  const month = Number(parts[1])

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    month < 1 ||
    month > 12
  ) {
    return 'Fecha no disponible'
  }

  const months = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ]

  return `${months[month - 1]} ${year}`
}

export function statusLabel(status: ApplicationStatus): string {
  if (status === 'received') return 'RECIBIDO'
  if (status === 'in_review') return 'EN REVISIÓN'
  if (status === 'approved') return 'ACEPTADO'
  if (status === 'admitted') return 'ADMITIDO'
  if (status === 'payment_pending') return 'PAGO PENDIENTE'
  if (status === 'enrolled') return 'MATRICULADO'
  return 'NO SELECCIONADO'
}

export function topDotClass(status: ApplicationStatus): string {
  if (status === 'received') return 'bg-[#3B82F6]'
  if (status === 'in_review') return 'bg-orange-500'
  if (
    status === 'approved' ||
    status === 'admitted' ||
    status === 'payment_pending'
  )
    return 'bg-[#E7E51A]'
  if (status === 'enrolled') return 'bg-fuchsia-400'
  return 'bg-zinc-500'
}

export function borderAccentClass(status: ApplicationStatus): string {
  if (status === 'received') return 'ring-1 ring-blue-500/20'
  if (status === 'in_review') return 'ring-1 ring-orange-500/20'
  if (
    status === 'approved' ||
    status === 'admitted' ||
    status === 'payment_pending'
  )
    return 'ring-1 ring-yellow-400/20'
  if (status === 'enrolled') return 'ring-1 ring-fuchsia-500/20'
  return 'ring-1 ring-muted/30'
}

export function badgeClass(status: ApplicationStatus): string {
  if (status === 'received')
    return 'border-blue-500/30 bg-blue-500/10 text-blue-300'
  if (status === 'in_review')
    return 'border-orange-500/30 bg-orange-500/10 text-orange-400'
  if (
    status === 'approved' ||
    status === 'admitted' ||
    status === 'payment_pending'
  )
    return 'border-yellow-400/30 bg-yellow-400/10 text-yellow-300'
  if (status === 'enrolled')
    return 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300'
  return 'border-muted/30 bg-muted/10 text-muted-foreground'
}

export function roleTextClass(): string {
  // como tu captura (teal)
  return 'text-[11px] font-semibold tracking-wide text-emerald-300'
}

export function headerLine(programTitle: string, role: string): string {
  const a = safeTrim(programTitle)
  const b = safeTrim(role)
  if (a && b) return `${a} · ${b}`
  if (a) return a
  if (b) return b
  return 'Programa'
}

export function buildPastCompletedItems(
  past: ApplicationRow[]
): PastCompletedItem[] {
  return past.map((row) => {
    const programTitle = row.program ? row.program.title : 'Programa'
    const editionLabel = row.edition ? row.edition.edition_name : 'Edición'

    const finishedLabel =
      row.edition?.ends_at && safeTrim(row.edition.ends_at)
        ? `Finalizado: ${fmtMonthYearFromDateISO(row.edition.ends_at)}`
        : `Postulado: ${fmtDateESFromISO(row.created_at)}`

    return {
      id: row.id,
      programTitle,
      editionLabel,
      finishedLabel,
    }
  })
}

type DateParts = {
  year: number
  month: number
  day: number
}

function parseDateParts(dateIso: string): DateParts | null {
  const s = safeTrim(dateIso)
  if (!s) return null
  const parts = s.split('-')
  if (parts.length !== 3) return null
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null
  }
  return { year, month, day }
}

function toDateParts(date: Date): DateParts {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  }
}

function compareDateParts(a: DateParts, b: DateParts): number {
  if (a.year !== b.year) return a.year < b.year ? -1 : 1
  if (a.month !== b.month) return a.month < b.month ? -1 : 1
  if (a.day !== b.day) return a.day < b.day ? -1 : 1
  return 0
}

export function isEditionEnded(edition: EditionRow | null, now: Date): boolean {
  if (!edition?.ends_at) return false
  const endParts = parseDateParts(edition.ends_at)
  if (!endParts) return false
  const todayParts = toDateParts(now)
  return compareDateParts(endParts, todayParts) < 0
}

export function splitByEditionEnd(
  rows: ApplicationRow[],
  now: Date
): { active: ApplicationRow[]; past: ApplicationRow[] } {
  const active: ApplicationRow[] = []
  const past: ApplicationRow[] = []

  for (const row of rows) {
    if (isEditionEnded(row.edition ?? null, now)) {
      past.push(row)
    } else {
      active.push(row)
    }
  }

  return { active, past }
}
export function iconGlowClass(status: ApplicationStatus): string {
  if (status === 'received')
    return 'shadow-[0_0_30px_rgba(59,130,246,0.35)] border-blue-500/40'

  if (status === 'in_review')
    return 'shadow-[0_0_30px_rgba(249,115,22,0.35)] border-orange-500/40'

  if (
    status === 'approved' ||
    status === 'admitted' ||
    status === 'payment_pending'
  )
    return 'shadow-[0_0_34px_rgba(250,204,21,0.40)] border-yellow-400/50'

  if (status === 'enrolled')
    return 'shadow-[0_0_30px_rgba(217,70,239,0.4)] border-fuchsia-500/40'

  return 'shadow-[0_0_20px_rgba(113,113,122,0.25)] border-zinc-500/30'
}
