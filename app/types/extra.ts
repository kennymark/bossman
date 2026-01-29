import type { MultipartFile } from '@adonisjs/core/bodyparser'
import type db from '@adonisjs/lucid/services/db'
import type { baseCountries } from '../data/countries.js'

export type AppCountries = (typeof baseCountries)[number]['name']

export type Transaction = Awaited<ReturnType<typeof db.transaction>>
export type Column<T> = {
  key: string
  header: string
  sortable?: boolean
  cell?: (row: T) => React.ReactNode
}
export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    currentPage: number
    perPage: number
    total: number
    lastPage: number
  }
}

export type File = MultipartFile | undefined
export type MultipleFiles = MultipartFile[] | undefined

export const plaidSupportedCountries: string[] = [
  'United Kingdom',
  'Germany',
  'France',
  'Netherlands',
  'Ireland',
  'Spain',
  'Sweden',
  'Denmark',
  'Poland',
  'Portugal',
  'Italy',
  'Lithuania',
  'Latvia',
  'Estonia',
  'Norway',
  'Belgium',
  'United States',
  'Canada',
  'Austria',
  'Finland',
]
export type PlaidSupportedCountries = (typeof plaidSupportedCountries)[number]
