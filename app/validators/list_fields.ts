import vine from '@vinejs/vine'

import { MAX_PER_PAGE, type QueryParams } from '#utils/vine'

/**
 * Pagination and search fields shared by the maintenance and documents list
 * validators. Mirrors the clamping in `queryParamsSchema`: a hand-edited page lands on
 * a sane page rather than a 422, and `perPage` never exceeds `MAX_PER_PAGE` because it
 * becomes a LIMIT against the customer databases.
 */
export const listPageFields = {
  page: vine
    .number()
    .optional()
    .transform((value) => (value === undefined ? undefined : Math.max(Math.trunc(value), 1))),
  perPage: vine
    .number()
    .optional()
    .transform((value) =>
      value === undefined ? undefined : Math.min(Math.max(Math.trunc(value), 1), MAX_PER_PAGE),
    ),
}

export const listSearchFields = {
  search: vine.string().trim().maxLength(200).optional(),
  sortOrder: vine.enum(['asc', 'desc'] as const).optional(),
}

export interface ListQueryInput {
  page?: number
  perPage?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/** Shapes a validated list query into what the `withPagination` macro reads. */
export function toPaginationParams(input: ListQueryInput): QueryParams {
  return {
    page: input.page,
    perPage: input.perPage,
    search: input.search,
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
  } as QueryParams
}
