export function normalizeDigitsOnly(input: string): string {
  return input.replace(/\D/g, '')
}

export function buildE164Phone(
  dialCode: string,
  nationalNumberDigits: string
): string {
  const sanitizedDialCode = dialCode.startsWith('+') ? dialCode : `+${dialCode}`
  const sanitizedNational = normalizeDigitsOnly(nationalNumberDigits)
  return `${sanitizedDialCode}${sanitizedNational}`
}

export function isE164Like(phoneE164: string): boolean {
  // + y 8 a 15 dígitos
  return /^\+[1-9]\d{7,14}$/.test(phoneE164)
}
