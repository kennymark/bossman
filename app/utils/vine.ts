import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

export type QueryParams = Infer<typeof queryParamsSchema>

export const queryParamsSchema = vine.create(
  vine.object({
    page: vine.number().optional(),
    perPage: vine.number().optional(),
    search: vine.string().optional(),
    startDate: vine.string().optional(),
    endDate: vine.string().optional(),

    sortBy: vine.string().optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),

    // Orgs index filters (query strings "true"/"false" cast to boolean)
    includeTestAccounts: vine
      .string()
      .optional()
      .transform((value) => value === 'true'),
    favouritesOnly: vine
      .string()
      .optional()
      .transform((value) => value === 'true'),
    ownerRole: vine.string().optional(),

    id: vine.string().optional(),
    email: vine.string().optional(),
    tab: vine.string().optional(),

    /** Blog manage: 'all' | 'published' | 'scheduled' | 'draft' */
    status: vine.enum(['all', 'published', 'scheduled', 'draft']).optional(),
  }),
)

export const validateQueryParams = async (queryParams: Record<string, string>) => {
  return queryParamsSchema.validate(queryParams) as Promise<Required<QueryParams>>
}
