import { ModelQueryBuilder } from '@adonisjs/lucid/orm'
import type {
  ChainableContract,
  ExcutableQueryBuilderContract,
} from '@adonisjs/lucid/types/querybuilder'

import DateService from '#utils/date'
import type { QueryParams } from '#utils/vine'

interface ModelTypes {
  whereTrue(column: string): this
  whereFalse(column: string): this
  getCount(): Promise<{ total: number }>
  getSum(column: string): Promise<{ total: number }>
  getAvg(column: string): Promise<{ total: number }>
  notArchived(): this
  search(searchQuery?: string, columns?: readonly string[]): this
  sortByLatest(): this
  sortByLatestUpdate(): this
  sortBy(column?: string, direction?: 'asc' | 'desc', allowed?: readonly string[]): this
  betweenDates(startDate?: string, endDate?: string): this
  betweenCreatedDates(startDate?: string, endDate?: string): this
  withArchivedStatus(isArchived?: boolean): this
  noGreaterThisMonthYear(column?: string): this
  /**
   * Pagination methods
   * Ensure you have the `paginate` method imported from `@adonisjs/lucid/orm`
   */
  withPagination(data: QueryParams, options?: PaginationMacroOptions): Promise<any>
}

/**
 * Per-call configuration for `withPagination`. Both lists are developer-supplied
 * allow-lists — never request input — because they name SQL identifiers.
 */
export interface PaginationMacroOptions {
  /** Columns an ILIKE `?search=` runs against. Omit to disable search entirely. */
  searchColumns?: readonly string[]
  /** Columns `?sortBy=` may name. Omit to ignore the request's sort column. */
  sortableColumns?: readonly string[]
  /** Column used when the request does not name a valid one. */
  defaultSort?: string
}

declare module '@adonisjs/lucid/orm' {
  interface ModelQueryBuilder extends ModelTypes {}
}

declare module '@adonisjs/lucid/types/model' {
  interface ModelQueryBuilderContract<Model extends LucidModel, Result = InstanceType<Model>>
    extends ChainableContract, ExcutableQueryBuilderContract<Result[]>, ModelTypes {}
}

/**
 * Guards every identifier that reaches raw SQL.
 *
 * Callers are supposed to pass literals or entries from their own allow-list, but this
 * is the last line of defence: an identifier is only ever a bare column name, optionally
 * table-qualified. Anything else throws rather than being interpolated.
 */
const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)?$/i

function assertSafeIdentifier(identifier: string, context: string): string {
  if (!SAFE_IDENTIFIER.test(identifier)) {
    throw new Error(`Unsafe SQL identifier passed to ${context}: ${identifier}`)
  }
  return identifier
}

/** Quotes an already-validated identifier so reserved words still work. */
function quoteIdentifier(identifier: string): string {
  return identifier
    .split('.')
    .map((part) => `"${part}"`)
    .join('.')
}

/** Escapes the LIKE wildcards so a search for `100%` matches the literal text. */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}

ModelQueryBuilder.macro('sortByLatest', function (this: ModelQueryBuilder) {
  return this.orderBy('created_at', 'desc')
})

ModelQueryBuilder.macro('sortByLatestUpdate', function (this: ModelQueryBuilder) {
  return this.orderBy('updated_at', 'desc')
})

ModelQueryBuilder.macro(
  'noGreaterThisMonthYear',
  function (this: ModelQueryBuilder, column?: string) {
    const today = DateService.now
    const target = quoteIdentifier(
      assertSafeIdentifier(column || 'created_at', 'noGreaterThisMonthYear'),
    )
    return this.whereRaw(`EXTRACT(YEAR FROM ${target}) <= ?`, [today.year]).whereRaw(
      `EXTRACT(MONTH FROM ${target}) <= ?`,
      [today.month],
    )
  },
)

ModelQueryBuilder.macro('whereTrue', function (this: ModelQueryBuilder, column: string) {
  return this.where(column, true)
})

ModelQueryBuilder.macro(
  'betweenCreatedDates',
  function (this: ModelQueryBuilder, startDate: string, endDate: string) {
    return this.if(startDate && endDate, (q) => q.whereBetween('created_at', [startDate, endDate]))
  },
)

ModelQueryBuilder.macro(
  'betweenDates',
  function (this: ModelQueryBuilder, startDate?: string, endDate?: string) {
    /** Bound, not interpolated: these values arrive from `?startDate=`/`?endDate=`. */
    return this.if(startDate && endDate, (q) =>
      q.whereRaw('start_date >= ? AND end_date <= ?', [startDate, endDate]),
    )
  },
)

ModelQueryBuilder.macro('whereFalse', function (this: ModelQueryBuilder, column: string) {
  return this.where(column, false)
})

ModelQueryBuilder.macro('getCount', async function (this: ModelQueryBuilder) {
  const result = this.count('* as total')
  const data = await result.pojo().first()
  return { total: Number(data.total) }
})

ModelQueryBuilder.macro('getSum', async function (this: ModelQueryBuilder, column: string) {
  const result = this.sum(`${assertSafeIdentifier(column, 'getSum')} as total`)
  const data = await result.pojo().first()
  return { total: Number(data.total) }
})

ModelQueryBuilder.macro('getAvg', async function (this: ModelQueryBuilder, column: string) {
  const result = this.avg(`${assertSafeIdentifier(column, 'getAvg')} as total`)
  const data = await result.pojo().first()
  return { total: Number(data.total) }
})

ModelQueryBuilder.macro(
  'sortBy',
  function (
    this: ModelQueryBuilder,
    column: string,
    direction: 'asc' | 'desc',
    allowed?: readonly string[],
  ) {
    /**
     * `column` is frequently `?sortBy=`. When the caller supplies an allow-list the
     * request may only name one of those columns; without one the request's column is
     * ignored, because an arbitrary identifier reaching ORDER BY is both a 500 waiting
     * to happen and a needless injection surface.
     */
    const resolved = allowed ? (allowed.includes(column) ? column : allowed[0]) : column
    if (!resolved) return this
    return this.orderBy(
      assertSafeIdentifier(resolved, 'sortBy'),
      direction === 'asc' ? 'asc' : 'desc',
    )
  },
)

ModelQueryBuilder.macro(
  'withArchivedStatus',
  function (this: ModelQueryBuilder, isArchived: boolean | undefined) {
    return this.if(
      isArchived,
      (q) => q.whereNotNull('archived_at'),
      (q) => q.whereNull('archived_at'),
    )
  },
)

ModelQueryBuilder.macro('notArchived', function (this: ModelQueryBuilder) {
  return this.whereNull('archived_at')
})

/**
 * Case-insensitive search across an explicit set of columns.
 *
 * The previous implementation interpolated the raw `?search=` value into a
 * `plainto_tsquery('...')` literal, which was both an injection point and — because no
 * caller passed a table name — a guaranteed 500 against a `_search` column that does
 * not exist. Columns are now named by the caller and the term is always bound.
 */
ModelQueryBuilder.macro(
  'search',
  function (this: ModelQueryBuilder, searchQuery?: string, columns?: readonly string[]) {
    const term = typeof searchQuery === 'string' ? searchQuery.trim() : ''
    if (!term || !columns?.length) return this

    const targets = columns.map((column) => quoteIdentifier(assertSafeIdentifier(column, 'search')))
    const pattern = `%${escapeLikePattern(term)}%`

    return this.where((builder: ChainableContract) => {
      for (const target of targets) {
        builder.orWhereRaw(`${target}::text ILIKE ? ESCAPE '\\'`, [pattern])
      }
    })
  },
)

/**
 * Pagination
 */
ModelQueryBuilder.macro(
  'withPagination',
  function (this: ModelQueryBuilder, data: QueryParams, options: PaginationMacroOptions = {}) {
    const { searchColumns, sortableColumns, defaultSort = 'created_at' } = options

    return this.betweenCreatedDates(data.startDate, data.endDate)
      .search(data.search, searchColumns)
      .sortBy(
        data.sortBy || defaultSort,
        data.sortOrder || 'desc',
        sortableColumns ?? [defaultSort],
      )
      .paginate(data.page || 1, data.perPage || 10)
  },
)
