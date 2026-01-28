'use client'

import { countryPhoneOptions } from '@/lib/phones/countries'

type PhoneCountryPickerProperties = {
  selectedDialCode: string
  onDialCodeChange: (newDialCode: string) => void
}

export function PhoneCountryPicker({
  selectedDialCode,
  onDialCodeChange,
}: PhoneCountryPickerProperties) {
  const sortedCountryOptions = [...countryPhoneOptions].sort((left, right) =>
    left.name.localeCompare(right.name)
  )

  return (
    <div className="relative">
      <select
        className="w-full appearance-none rounded-xl bg-black/30 border border-white/10 px-3 py-3 pr-10 text-white outline-none focus:border-emerald-400/60"
        value={selectedDialCode}
        onChange={(event) => onDialCodeChange(event.target.value)}
        aria-label="País y código de país"
      >
        {sortedCountryOptions.map((country) => (
          <option key={country.iso2} value={country.dialCode}>
            {country.name} ({country.dialCode})
          </option>
        ))}
      </select>

      {/* Flechita */}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70">
        ▼
      </span>
    </div>
  )
}
