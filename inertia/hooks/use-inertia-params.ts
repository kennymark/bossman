import type { ModelObject } from '@adonisjs/lucid/types/model'
import { router } from '@inertiajs/react'

function debounce<TArgs extends unknown[]>(fn: (...args: TArgs) => void, delay: number) {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: TArgs) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

export const useInertiaParams = (initialQueryParams: QueryDefaults = {}, _only?: string[]) => {
  const currentParams = getQueryParams(initialQueryParams) as ModelObject

  const changePage = (page: number) => updateSearchParams({ ...currentParams, page })
  const changeRows = (perPage: number) => updateSearchParams({ ...currentParams, perPage, page: 1 })
  const changeDates = (startDate: string, endDate: string) =>
    updateSearchParams({ startDate, endDate })

  const searchTable = debounce((search: string) => {
    updateSearchParams({ search })
  }, 300)

  return {
    query: currentParams,
    changePage,
    changeRows,
    changeDates,
    updateQuery: updateSearchParams,
    searchTable,
  }
}

type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | (string | number | boolean | null | undefined)[]
type QueryDefaults = Record<string, QueryValue>

export function getQueryParams(defaults: QueryDefaults = {}): Record<string, QueryValue> {
  if (typeof window === 'undefined') return defaults

  const params = new URLSearchParams(window.location.search)
  const result: Record<string, QueryValue> = { ...defaults }

  for (const [key, value] of params.entries()) {
    result[key] = autoCast(value)
  }

  return result
}

function autoCast(value: string): QueryValue {
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  if (value === 'undefined') return undefined

  const trimmed = value.trim()
  // Keep integer-like values with leading zeros as strings (e.g. serial numbers)
  // so we don't lose important formatting: "000001532" should stay "000001532".
  const isIntegerLike = /^-?\d+$/.test(trimmed)
  const hasLeadingZeros = isIntegerLike && /^-?0\d+/.test(trimmed)
  if (!hasLeadingZeros) {
    const num = Number(trimmed)
    if (!Number.isNaN(num) && trimmed !== '') return num
  }

  if (value.includes(',')) return value.split(',').map(autoCast) as QueryValue

  return value
}

export function updateSearchParams(params: ModelObject) {
  const currentParams = getQueryParams()
  const updatedParams = { ...currentParams, ...params }
  router.get(window.location.pathname, updatedParams, {
    preserveState: true,
    preserveScroll: true,
  })
}
