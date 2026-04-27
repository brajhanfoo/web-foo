import { NextRequest, NextResponse } from 'next/server'

import { resolveCountryCodeFromHeaders } from '@/lib/pricing'

type GeoCountryResponse = {
  ok: boolean
  countryCode: string | null
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<GeoCountryResponse>> {
  const countryCode = resolveCountryCodeFromHeaders(request.headers)
  return NextResponse.json(
    {
      ok: true,
      countryCode,
    },
    { status: 200 }
  )
}
