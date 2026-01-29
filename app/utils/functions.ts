import app from '@adonisjs/core/services/app'

// convert bytes to mb
export function convertBytesToMb(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(2)
}

export function startCase(str?: string): string {
  if (!str) {
    return ''
  }
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // add space between camelCase words
    .replace(/[_-]/g, ' ') // replace underscores and hyphens with spaces
    .replace(/\b\w/g, (match) => match.toUpperCase()) // capitalize first letter of each word
}

export function formatFileSize(size: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(size) / Math.log(1024))
  return `${(size / 1024 ** i).toFixed(2)} ${units[i]}`
}

export const DateFormats = {
  short: 'dd LLL yyyy',
}

export const generateTogethaReference = (name: string, isDeposit: boolean) => {
  // get first 2 letters and last 2 letters of name
  const firstTwo = name.substring(0, 2).toLowerCase()
  const lastTwo = name.substring(name.length - 2, name.length).toLowerCase()
  const month = new Date().getMonth() + 1
  const year = new Date().getFullYear()
  const monthYear = `${month}${year}`

  const ref = `tog-${firstTwo}-${monthYear}-${lastTwo}-${isDeposit ? 'DE' : 'RE'}`
  return ref
}

/**
 * @description Return an object containing the breakdown of a monthly rent in daily, weekly, monthly and yearly amounts
 */
export function rentBreakdown(monthlyRent: number, frequency: 'monthly' | 'quarterly' | 'yearly') {
  const dailyRent = monthlyRent / 30.44 // Approximation
  const weeklyRent = dailyRent * 7
  const yearlyRent = monthlyRent * 12

  let actualAmount: number

  switch (frequency) {
    case 'monthly':
      actualAmount = monthlyRent
      break
    case 'quarterly':
      actualAmount = monthlyRent * 3
      break
    case 'yearly':
      actualAmount = monthlyRent * 12
      break
    default:
      throw new Error(`Invalid frequency: ${frequency}`)
  }

  return {
    dailyRent,
    weeklyRent,
    monthlyRent,
    yearlyRent,
    actualAmount,
  }
}

export function formatCurrency(value: number, currency?: string): string {
  if (!value) return '£0.00'

  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency || 'GBP',
    maximumFractionDigits: 2,
  })

  return formatter.format(value)
}

export function pluralize(num: number, word: string): string {
  if (num === 1) {
    return word
  }
  return `${word}s`
}

// export function calculatePerformance(description: string, fn: () => void) {
//   console.log(`Starting ${description}...`)
//   const startTime = hrtime()
//   fn()
//   const endTime = hrtime(startTime)
//   console.log(`${description} took ${string.prettyHrTime(endTime)} to execute.`)
// }

export const waitFor = (ms: number) => new Promise((r) => setTimeout(r, ms))
export const sleepFor = waitFor

export function ordinalize(num: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = num % 100
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
}

export function trimSymbols(str: string): string {
  const listOfSymbols = ['_', '-', '?']
  let result = ''

  for (const char of str) {
    if (!listOfSymbols.includes(char)) {
      result += char
    }
  }

  return result
}

//given a number, generate an array of numbers from 1 to that number
export function generateArrayFromNumber(num: number) {
  return Array.from(Array(num).keys()).map((i) => i + 1)
}

export async function runInProdOnly(fn: () => Promise<void> | void, rationale = '') {
  if (app.inProduction) {
    await fn()
  } else {
    console.log(`Skipping ${rationale} because NODE_ENV is not production`)
  }
}

export async function runInDevOnly(fn: () => Promise<void> | void, rationale = '') {
  if (app.inDev) {
    console.log('🧰 ~ runInDevOnly ~ development:')
    await fn()
    console.log('🧰 ~ runInDevOnly ~ complete:')
  } else {
    console.log(`Skipping ${rationale} because NODE_ENV is not development`)
  }
}

export async function runIfTrue(
  condition: boolean,
  fn: () => Promise<void> | void,
  rationale = '',
) {
  if (condition) {
    await fn()
  } else {
    console.log(`Skipping ${rationale} because condition is false`)
  }
}

export async function runIfFalse(
  condition: boolean,
  fn: () => Promise<void> | void,
  rationale = '',
) {
  if (!condition) {
    await fn()
  } else {
    console.log(`Skipping ${rationale} because condition is true`)
  }
}

export function generateOTP(length = 6): string {
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString()
  }
  return otp
}
