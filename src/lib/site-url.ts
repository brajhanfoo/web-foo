const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL

const baseUrl = rawSiteUrl ?? (vercelUrl ? `https://${vercelUrl}` : '')

export function getSiteUrl() {
  if (!baseUrl) return ''
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}
