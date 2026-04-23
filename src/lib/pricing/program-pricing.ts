import type { ProgramPaymentVariant, ProgramRow } from '@/types/programs'

export type PricingRegion = 'AR' | 'GLOBAL'
export type PricingCurrency = 'ARS' | 'USD'

export type ProgramPricingBlock = {
  currency: PricingCurrency
  listPrice: number | null
  discountPercent: number | null
  singlePaymentPrice: number | null
  hasInstallments: boolean
  installmentsPrice: number | null
  installmentsCount: number | null
  installmentsInterestFree: boolean | null
  installmentAmount: number | null
}

export type ResolvedProgramPricing = {
  region: PricingRegion
  displayCurrency: PricingCurrency
  checkoutCurrency: PricingCurrency
  regionPricing: ProgramPricingBlock
  hasListPrice: boolean
  listPrice: number | null
  hasDiscount: boolean
  discountPercent: number | null
  singlePaymentPrice: number | null
  hasInstallments: boolean
  installmentsPrice: number | null
  installmentsCount: number | null
  installmentsInterestFree: boolean | null
  installmentAmount: number | null
  showInstallmentsInUi: boolean
  availableVariants: ProgramPaymentVariant[]
  defaultPaymentVariant: ProgramPaymentVariant
  selectedPaymentVariant: ProgramPaymentVariant
  selectedPaymentPrice: number | null
}

export type ResolvedCheckoutPricing = ResolvedProgramPricing & {
  paymentVariant: ProgramPaymentVariant
  amount: number
  amountCents: number
  currency: PricingCurrency
}

export type ProgramPricingErrorCode =
  | 'PAYMENT_VARIANT_REQUIRED'
  | 'PAYMENT_VARIANT_NOT_SUPPORTED'
  | 'PRICE_CONFIGURATION_MISSING'
  | 'PRICE_VARIANT_NOT_CONFIGURED'

export class ProgramPricingError extends Error {
  code: ProgramPricingErrorCode

  constructor(code: ProgramPricingErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

type NumericLike = number | string | null | undefined

function toNumber(value: NumericLike): number | null {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

function toNonNegativeMoney(value: NumericLike): number | null {
  const parsed = toNumber(value)
  if (parsed === null || parsed < 0) return null
  return Math.round(parsed * 100) / 100
}

function toDiscountPercent(value: NumericLike): number | null {
  const parsed = toNumber(value)
  if (parsed === null || parsed <= 0 || parsed > 100) return null
  return Math.round(parsed * 100) / 100
}

function toPositiveInt(value: NumericLike): number | null {
  const parsed = toNumber(value)
  if (parsed === null || parsed <= 0) return null
  return Math.trunc(parsed)
}

function toNullableBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') {
    if (value === 1) return true
    if (value === 0) return false
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true' || normalized === '1') return true
    if (normalized === 'false' || normalized === '0') return false
  }
  return null
}

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const COUNTRY_LABEL_TO_CODE: Record<string, string> = {
  ar: 'AR',
  argentina: 'AR',
  arg: 'AR',
  us: 'US',
  usa: 'US',
  'united states': 'US',
  'estados unidos': 'US',
  ec: 'EC',
  ecuador: 'EC',
  pe: 'PE',
  peru: 'PE',
  co: 'CO',
  colombia: 'CO',
  cl: 'CL',
  chile: 'CL',
  uy: 'UY',
  uruguay: 'UY',
  bo: 'BO',
  bolivia: 'BO',
  mx: 'MX',
  mexico: 'MX',
  br: 'BR',
  brasil: 'BR',
  brazil: 'BR',
}

export function resolveCountryCode(
  countryCodeOrLabel: string | null | undefined
): string | null {
  if (!countryCodeOrLabel) return null

  const raw = countryCodeOrLabel.trim()
  if (!raw) return null

  const localeMatch = /^([a-z]{2,3})(?:[-_])([a-z]{2})$/i.exec(raw)
  if (localeMatch) {
    return localeMatch[2].toUpperCase()
  }

  if (/^[a-z]{2}$/i.test(raw)) {
    return raw.toUpperCase()
  }

  const normalized = normalizeText(raw)
  if (COUNTRY_LABEL_TO_CODE[normalized]) {
    return COUNTRY_LABEL_TO_CODE[normalized]
  }

  return null
}

export function resolveCountryCodeFromHeaders(headers: Headers): string | null {
  const direct =
    headers.get('x-vercel-ip-country') ??
    headers.get('cf-ipcountry') ??
    headers.get('cloudfront-viewer-country') ??
    headers.get('x-country-code')

  const directCode = resolveCountryCode(direct)
  if (directCode) return directCode

  const acceptLanguage = headers.get('accept-language')
  if (!acceptLanguage) return null

  const first = acceptLanguage.split(',')[0]?.trim()
  if (!first) return null

  return resolveCountryCode(first)
}

export function isArgentinaCountry(countryCodeOrLabel: string | null): boolean {
  return resolveCountryCode(countryCodeOrLabel) === 'AR'
}

function resolveRegion(countryCodeOrLabel: string | null | undefined): PricingRegion {
  return isArgentinaCountry(countryCodeOrLabel ?? null) ? 'AR' : 'GLOBAL'
}

function resolveUsdPricing(program: ProgramRow): ProgramPricingBlock {
  const singlePaymentPrice =
    toNonNegativeMoney(program.price_usd_final_single) ??
    toNonNegativeMoney(program.price_usd)

  const installmentsEnabled = Boolean(
    toNullableBoolean(program.price_usd_has_installments)
  )
  const installmentsPrice = toNonNegativeMoney(program.price_usd_final_installments)
  const hasInstallments = installmentsEnabled && installmentsPrice !== null

  return {
    currency: 'USD',
    listPrice: toNonNegativeMoney(program.price_usd_list),
    discountPercent: toDiscountPercent(program.price_usd_discount_percent),
    singlePaymentPrice,
    hasInstallments,
    installmentsPrice: hasInstallments ? installmentsPrice : null,
    installmentsCount: hasInstallments
      ? toPositiveInt(program.price_usd_installments_count)
      : null,
    installmentsInterestFree: hasInstallments
      ? toNullableBoolean(program.price_usd_installments_interest_free)
      : null,
    installmentAmount: hasInstallments
      ? toNonNegativeMoney(program.price_usd_installment_amount)
      : null,
  }
}

function resolveArsPricing(program: ProgramRow): ProgramPricingBlock {
  const singlePaymentPrice = toNonNegativeMoney(program.price_ars_final_single)
  const installmentsEnabled = Boolean(
    toNullableBoolean(program.price_ars_has_installments)
  )
  const installmentsPrice = toNonNegativeMoney(program.price_ars_final_installments)
  const hasInstallments = installmentsEnabled && installmentsPrice !== null

  return {
    currency: 'ARS',
    listPrice: toNonNegativeMoney(program.price_ars_list),
    discountPercent: toDiscountPercent(program.price_ars_discount_percent),
    singlePaymentPrice,
    hasInstallments,
    installmentsPrice: hasInstallments ? installmentsPrice : null,
    installmentsCount: hasInstallments
      ? toPositiveInt(program.price_ars_installments_count)
      : null,
    installmentsInterestFree: hasInstallments
      ? toNullableBoolean(program.price_ars_installments_interest_free)
      : null,
    installmentAmount: hasInstallments
      ? toNonNegativeMoney(program.price_ars_installment_amount)
      : null,
  }
}

export function isProgramPaymentVariant(
  value: unknown
): value is ProgramPaymentVariant {
  return value === 'single_payment' || value === 'installments'
}

export function resolveProgramPricing(
  program: ProgramRow,
  countryCodeOrLabel: string | null | undefined,
  selectedPaymentVariant?: ProgramPaymentVariant | null
): ResolvedProgramPricing {
  const region = resolveRegion(countryCodeOrLabel)
  const regionPricing = region === 'AR' ? resolveArsPricing(program) : resolveUsdPricing(program)

  const availableVariants: ProgramPaymentVariant[] = []
  if (regionPricing.singlePaymentPrice !== null) {
    availableVariants.push('single_payment')
  }
  if (regionPricing.hasInstallments && regionPricing.installmentsPrice !== null) {
    availableVariants.push('installments')
  }

  const showInstallmentsInUi = region === 'AR' && regionPricing.hasInstallments
  const preferredDefault: ProgramPaymentVariant =
    showInstallmentsInUi && availableVariants.includes('installments')
      ? 'installments'
      : 'single_payment'

  const defaultPaymentVariant: ProgramPaymentVariant =
    availableVariants.includes(preferredDefault)
      ? preferredDefault
      : (availableVariants[0] ?? 'single_payment')

  const nextSelected = selectedPaymentVariant ?? defaultPaymentVariant
  const selectedPaymentVariantResolved = availableVariants.includes(nextSelected)
    ? nextSelected
    : defaultPaymentVariant

  const selectedPaymentPrice =
    selectedPaymentVariantResolved === 'installments'
      ? regionPricing.installmentsPrice
      : regionPricing.singlePaymentPrice

  const hasListPrice =
    regionPricing.listPrice !== null &&
    selectedPaymentPrice !== null &&
    regionPricing.listPrice > selectedPaymentPrice

  const hasDiscount =
    regionPricing.discountPercent !== null && regionPricing.discountPercent > 0

  return {
    region,
    displayCurrency: regionPricing.currency,
    checkoutCurrency: regionPricing.currency,
    regionPricing,
    hasListPrice,
    listPrice: hasListPrice ? regionPricing.listPrice : null,
    hasDiscount,
    discountPercent: hasDiscount ? regionPricing.discountPercent : null,
    singlePaymentPrice: regionPricing.singlePaymentPrice,
    hasInstallments: regionPricing.hasInstallments,
    installmentsPrice: regionPricing.installmentsPrice,
    installmentsCount: regionPricing.installmentsCount,
    installmentsInterestFree: regionPricing.installmentsInterestFree,
    installmentAmount: regionPricing.installmentAmount,
    showInstallmentsInUi,
    availableVariants,
    defaultPaymentVariant,
    selectedPaymentVariant: selectedPaymentVariantResolved,
    selectedPaymentPrice,
  }
}

export function toAmountCents(amount: number): number {
  return Math.round(amount * 100)
}

export function resolveCheckoutPricingOrThrow(params: {
  program: ProgramRow
  countryCodeOrLabel: string | null | undefined
  paymentVariant: ProgramPaymentVariant | null | undefined
}): ResolvedCheckoutPricing {
  if (!params.paymentVariant) {
    throw new ProgramPricingError(
      'PAYMENT_VARIANT_REQUIRED',
      'Debes enviar paymentVariant para iniciar el checkout.'
    )
  }

  const resolved = resolveProgramPricing(
    params.program,
    params.countryCodeOrLabel,
    params.paymentVariant
  )

  if (resolved.availableVariants.length === 0) {
    throw new ProgramPricingError(
      'PRICE_CONFIGURATION_MISSING',
      'El programa no tiene pricing configurado para esta region.'
    )
  }

  if (!resolved.availableVariants.includes(params.paymentVariant)) {
    throw new ProgramPricingError(
      'PAYMENT_VARIANT_NOT_SUPPORTED',
      'La modalidad de pago seleccionada no esta disponible para este programa.'
    )
  }

  const amount =
    params.paymentVariant === 'installments'
      ? resolved.installmentsPrice
      : resolved.singlePaymentPrice

  if (amount === null) {
    throw new ProgramPricingError(
      'PRICE_VARIANT_NOT_CONFIGURED',
      'No hay precio configurado para la modalidad de pago seleccionada.'
    )
  }

  return {
    ...resolved,
    paymentVariant: params.paymentVariant,
    amount,
    amountCents: toAmountCents(amount),
    currency: resolved.checkoutCurrency,
  }
}

export function formatCurrencyAmount(params: {
  amount: number | null | undefined
  currency: PricingCurrency
  locale?: string
}): string | null {
  if (params.amount === null || params.amount === undefined) return null
  if (!Number.isFinite(params.amount)) return null
  return new Intl.NumberFormat(params.locale ?? 'es-AR', {
    style: 'currency',
    currency: params.currency,
    currencyDisplay: 'code',
    maximumFractionDigits: params.currency === 'ARS' ? 0 : 2,
  }).format(params.amount)
}
