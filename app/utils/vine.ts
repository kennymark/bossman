import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

export type QueryParams = Infer<typeof queryParamsSchema>

/**
 * Hard ceiling on any single page of results.
 *
 * `perPage` is request input that becomes a SQL LIMIT against the live customer
 * databases. Without a cap, `?perPage=1000000` pulled an unbounded result set out of
 * production. `page` is floored at 1 for the same reason: a negative page produced a
 * negative OFFSET and a 500 straight from the driver.
 */
export const MAX_PER_PAGE = 100

/** ISO date (YYYY-MM-DD), the only shape the analytics and range filters accept. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export const queryParamsSchema = vine.create(
  vine.object({
    /**
     * Clamped rather than rejected: these arrive from ordinary navigation, and a
     * hand-edited URL should land on a sane page rather than a 400.
     */
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
    search: vine.string().trim().maxLength(200).optional(),
    startDate: vine.string().regex(ISO_DATE).optional(),
    endDate: vine.string().regex(ISO_DATE).optional(),

    sortBy: vine.string().maxLength(64).optional(),
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
    ownerRole: vine.string().maxLength(64).optional(),

    id: vine.string().maxLength(64).optional(),
    email: vine.string().maxLength(320).optional(),
    tab: vine.string().maxLength(64).optional(),

    /**
     * Every page's status filter passes through here, so this cannot name one page's
     * vocabulary.
     *
     * It used to be `vine.enum(['all', 'published', 'scheduled', 'draft'])` — the blog
     * manage filter. `InertiaMiddleware.share` runs `paginationQs()` on every Inertia
     * render and several controllers call it directly, so any other page carrying a
     * `?status=` it did not recognise answered 400: `/maintenance?status=todo` and the
     * customer page's payment filter both failed that way.
     *
     * A status that reaches SQL is validated by the owning controller's own validator
     * against its own enum (see `#validators/maintenance`, `#validators/org_payments`);
     * the blog compares this value rather than querying with it.
     */
    status: vine.string().maxLength(64).optional(),
  }),
)

export const validateQueryParams = async (queryParams: Record<string, string>) => {
  return queryParamsSchema.validate(queryParams) as Promise<Required<QueryParams>>
}
