export type CountryPhoneOption = {
  iso2: string
  name: string
  dialCode: string // incluye "+"
}

// Lista amplia. Puedes seguir agregando países si lo necesitas.
// (Incluye todos los que mencionaste: HN, SV, BR, BO + Europa y América)
export const countryPhoneOptions: readonly CountryPhoneOption[] = [
  // --- América ---
  { iso2: 'AR', name: 'Argentina', dialCode: '+54' },
  { iso2: 'BO', name: 'Bolivia', dialCode: '+591' },
  { iso2: 'BR', name: 'Brasil', dialCode: '+55' },
  { iso2: 'CA', name: 'Canadá', dialCode: '+1' },
  { iso2: 'CL', name: 'Chile', dialCode: '+56' },
  { iso2: 'CO', name: 'Colombia', dialCode: '+57' },
  { iso2: 'CR', name: 'Costa Rica', dialCode: '+506' },
  { iso2: 'CU', name: 'Cuba', dialCode: '+53' },
  { iso2: 'DO', name: 'República Dominicana', dialCode: '+1' },
  { iso2: 'EC', name: 'Ecuador', dialCode: '+593' },
  { iso2: 'SV', name: 'El Salvador', dialCode: '+503' },
  { iso2: 'GT', name: 'Guatemala', dialCode: '+502' },
  { iso2: 'HN', name: 'Honduras', dialCode: '+504' },
  { iso2: 'MX', name: 'México', dialCode: '+52' },
  { iso2: 'NI', name: 'Nicaragua', dialCode: '+505' },
  { iso2: 'PA', name: 'Panamá', dialCode: '+507' },
  { iso2: 'PE', name: 'Perú', dialCode: '+51' },
  { iso2: 'PR', name: 'Puerto Rico', dialCode: '+1' },
  { iso2: 'PY', name: 'Paraguay', dialCode: '+595' },
  { iso2: 'US', name: 'Estados Unidos', dialCode: '+1' },
  { iso2: 'UY', name: 'Uruguay', dialCode: '+598' },
  { iso2: 'VE', name: 'Venezuela', dialCode: '+58' },

  // --- Europa (principales + general) ---

  { iso2: 'DE', name: 'Alemania', dialCode: '+49' },

  { iso2: 'ES', name: 'España', dialCode: '+34' },

  { iso2: 'GB', name: 'Reino Unido', dialCode: '+44' },

  { iso2: 'IT', name: 'Italia', dialCode: '+39' },

  { iso2: 'NL', name: 'Países Bajos', dialCode: '+31' },

  { iso2: 'PT', name: 'Portugal', dialCode: '+351' },

  // --- Resto (por si te llega gente global) ---
  { iso2: 'AU', name: 'Australia', dialCode: '+61' },
  { iso2: 'IN', name: 'India', dialCode: '+91' },
  { iso2: 'JP', name: 'Japón', dialCode: '+81' },
]
