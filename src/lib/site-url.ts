const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL?.trim()

function normalize(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

export function getSiteUrl() {
  if (rawSiteUrl) return normalize(rawSiteUrl)
  if (vercelUrl) return normalize(`https://${vercelUrl}`)

  // Fallback for providers where NEXT_PUBLIC_SITE_URL is missing at build time.
  if (typeof window !== 'undefined' && window.location.origin) {
    return normalize(window.location.origin)
  }

  return ''
}
