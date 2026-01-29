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
  search(searchQuery?: string, tableName?: string): this
  sortByLatest(): this
  sortByLatestUpdate(): this
  sortBy(column?: string, direction?: 'asc' | 'desc'): this
  betweenDates(startDate: string, endDate: string): this
  betweenCreatedDates(startDate?: string, endDate?: string): this
  withArchivedStatus(isArchived?: boolean): this
  noGreaterThisMonthYear(column?: string): this
  /**
   * Pagination methods
   * Ensure you have the `paginate` method imported from `@adonisjs/lucid/orm`
   */
  withPagination(data: QueryParams): Promise<any>
}

declare module '@adonisjs/lucid/orm' {
  interface ModelQueryBuilder extends ModelTypes {}
}

declare module '@adonisjs/lucid/types/model' {
  interface ModelQueryBuilderContract<Model extends LucidModel, Result = InstanceType<Model>>
    extends ChainableContract,
      ExcutableQueryBuilderContract<Result[]>,
      ModelTypes {}
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
    return this.whereRaw(`EXTRACT(YEAR FROM ${column || 'created_at'}) <= ${today.year}`).whereRaw(
      `EXTRACT(MONTH FROM ${column || 'created_at'}) <= ${today.month}`,
    )
  },
)

ModelQueryBuilder.macro('whereTrue', function (this: ModelQueryBuilder, column: string) {
  return this.where(column, true)
})

ModelQueryBuilder.macro(
  'betweenCreatedDates',
  function (this: ModelQueryBuilder, startDate: string, endDate: string) {
    const parsedS = startDate !== 'null' && startDate !== ''
    const parsedE = endDate !== 'null' && endDate !== ''

    console.log({ startDate, endDate })
    return this.if(parsedS && parsedE, (q) => q.whereBetween('created_at', [startDate, endDate]))
  },
)

ModelQueryBuilder.macro(
  'betweenDates',
  function (this: ModelQueryBuilder, startDate: string, endDate: string) {
    return this.whereRaw(`start_date >= '${startDate}' AND end_date <= '${endDate}'`)
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
  const result = this.sum(`${column} as total`)
  const data = await result.pojo().first()
  return { total: Number(data.total) }
})

ModelQueryBuilder.macro('getAvg', async function (this: ModelQueryBuilder, column: string) {
  const result = this.avg(`${column} as total`)
  const data = await result.pojo().first()
  return { total: Number(data.total) }
})

ModelQueryBuilder.macro(
  'sortBy',
  function (this: ModelQueryBuilder, column: string, direction: 'asc' | 'desc') {
    return this.if(column, (q) => q.orderBy(column, direction || 'desc'))
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

ModelQueryBuilder.macro(
  'search',
  function (this: ModelQueryBuilder, searchQuery: string, tableName: string) {
    return this.if(searchQuery, (q) =>
      q.whereRaw(`${tableName}_search @@ plainto_tsquery('${searchQuery}')`),
    )
  },
)

/**
 * Pagination
 */
ModelQueryBuilder.macro(
  'withPagination',
  function (this: ModelQueryBuilder, data: QueryParams, searchTable?: string) {
    return this.betweenCreatedDates(data.startDate, data.endDate)
      .search(data.search, searchTable || '')
      .sortBy(data.sortBy, data.sortOrder)
      .paginate(data.page || 1, data.perPage || 10)
  },
)
