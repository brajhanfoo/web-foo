export const PLATFORM_TIMEZONE = 'America/Argentina/Buenos_Aires'
export const PLATFORM_TIMEZONE_LABEL = 'Buenos Aires, Argentina (ART)'
export const PLATFORM_LOCALE = 'es-AR'

type DateInput = Date | string | number | null | undefined

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export function isValidIanaTimeZone(timeZone: string): boolean {
  const clean = String(timeZone ?? '').trim()
  if (!clean) return false
  try {
    Intl.DateTimeFormat('en-US', { timeZone: clean }).format(new Date())
    return true
  } catch {
    return false
  }
}

export function formatDateTimeInTimeZone(
  value: DateInput,
  timeZone: string = PLATFORM_TIMEZONE,
  locale: string = PLATFORM_LOCALE
): string {
  const date = toDate(value)
  if (!date) return '--'

  return new Intl.DateTimeFormat(locale, {
    timeZone,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatDateOnlyInTimeZone(
  value: DateInput,
  timeZone: string = PLATFORM_TIMEZONE,
  locale: string = PLATFORM_LOCALE
): string {
  const date = toDate(value)
  if (!date) return ''

  return new Intl.DateTimeFormat(locale, {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function parseGmtOffsetLabel(label: string): number | null {
  const clean = String(label ?? '').trim().toUpperCase()
  const match = /^(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(clean)
  if (!match) return null

  const sign = match[1] === '-' ? -1 : 1
  const hours = Number(match[2] ?? '0')
  const minutes = Number(match[3] ?? '0')
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null

  return sign * (hours * 60 + minutes)
}

function getOffsetMinutesAtInstant(timeZone: string, instant: Date): number {
  let parts: Intl.DateTimeFormatPart[] = []
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(instant)
  } catch {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(instant)
  }

  const tzPart = parts.find((part) => part.type === 'timeZoneName')?.value ?? ''
  const parsed = parseGmtOffsetLabel(tzPart)
  if (parsed === null) {
    if (timeZone === PLATFORM_TIMEZONE) {
      return -180
    }
    throw new Error(`No se pudo resolver offset para timezone ${timeZone}`)
  }
  return parsed
}

function parseLocalDateTimeInput(value: string): {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
} | null {
  const clean = String(value ?? '').trim()
  const match =
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(clean)
  if (!match) return null

  const year = Number(match[1] ?? '0')
  const month = Number(match[2] ?? '0')
  const day = Number(match[3] ?? '0')
  const hour = Number(match[4] ?? '0')
  const minute = Number(match[5] ?? '0')
  const second = Number(match[6] ?? '0')

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    !Number.isFinite(second)
  ) {
    return null
  }

  return { year, month, day, hour, minute, second }
}

// Converts a local datetime (without offset) interpreted in a target timezone to UTC ISO.
export function localDateTimeToUtcIso(
  localDateTime: string,
  timeZone: string = PLATFORM_TIMEZONE
): string | null {
  if (!isValidIanaTimeZone(timeZone)) return null
  const parsed = parseLocalDateTimeInput(localDateTime)
  if (!parsed) return null

  const { year, month, day, hour, minute, second } = parsed
  const sourceUtc = Date.UTC(year, month - 1, day, hour, minute, second)
  let candidateUtc = sourceUtc

  for (let i = 0; i < 3; i += 1) {
    const offsetMinutes = getOffsetMinutesAtInstant(timeZone, new Date(candidateUtc))
    const nextUtc = sourceUtc - offsetMinutes * 60_000
    if (Math.abs(nextUtc - candidateUtc) < 1000) {
      candidateUtc = nextUtc
      break
    }
    candidateUtc = nextUtc
  }

  return new Date(candidateUtc).toISOString()
}
