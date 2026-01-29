// Define all supported currencies directly in this file to avoid circular dependencies
export const togethaCurrencies = [
  'GBP',
  'USD',
  'GHS',
  'NGN',
  'SEK',
  'DKK',
  'NOK',
  'PLN',
  'ZAR',
  'ZMW',
  'TZS',
  'KES',
  'EUR',
] as const

export type TogethaCurrencies = (typeof togethaCurrencies)[number]

// Country to currency mapping
export const countryCurrencies = {
  'United Kingdom': 'GBP',
  'United States': 'USD',
  Ghana: 'GHS',
  Nigeria: 'NGN',
  Sweden: 'SEK',
  Denmark: 'DKK',
  Norway: 'NOK',
  Poland: 'PLN',
  'South Africa': 'ZAR',
  Zambia: 'ZMW',
  Tanzania: 'TZS',
  Kenya: 'KES',
} as const

// Type guard to check if a string is a valid currency
export function isValidCurrency(currency: string): currency is TogethaCurrencies {
  return togethaCurrencies.includes(currency as TogethaCurrencies)
}

// Get currency from country
export function getCurrencyFromCountry(country: string): TogethaCurrencies {
  return (countryCurrencies[country as keyof typeof countryCurrencies] ||
    'GBP') as TogethaCurrencies
}

export function formatCurrency(value: number, currency?: TogethaCurrencies) {
  const formatter = new Intl.NumberFormat(getCurrencyLocale(currency || 'GBP'), {
    style: 'currency',
    currency: currency || 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return formatter.format(value || 0)
}

export function getCurrencyLocale(currency: TogethaCurrencies) {
  const localeMap: Record<TogethaCurrencies, string> = {
    GBP: 'en-GB',
    USD: 'en-US',
    GHS: 'en-GH',
    NGN: 'en-NG',
    SEK: 'sv-SE',
    DKK: 'da-DK',
    NOK: 'nb-NO',
    PLN: 'pl-PL',
    ZAR: 'en-ZA',
    ZMW: 'en-ZM',
    TZS: 'sw-TZ',
    KES: 'sw-KE',
    EUR: 'de-DE', // Default for EUR
  }
  return localeMap[currency] || 'en-GB'
}
