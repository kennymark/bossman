import vine from '@vinejs/vine'

/**
 * Query-string shapes for the CSV export endpoints.
 *
 * Each mirrors the filters of the index it sits beside, so a page can pass its current
 * query straight through and the file contains exactly the rows on screen (up to the
 * export cap). Every field is optional: an export with no filters is the whole table.
 *
 * Fixed sets use `vine.enum` so an unexpected value is a 422 rather than a silently
 * different file.
 */

const sortFields = {
  sortBy: vine.string().maxLength(64).optional(),
  sortOrder: vine.enum(['asc', 'desc'] as const).optional(),
}

/** Inclusive `YYYY-MM-DD` bounds, as read by the `paginationQs()` macro. */
const dateRangeFields = {
  startDate: vine.string().optional(),
  endDate: vine.string().optional(),
}

const searchField = { search: vine.string().trim().maxLength(200).optional() }

export const orgsExportValidator = vine.create(
  vine.object({
    ...searchField,
    ...sortFields,
    includeTestAccounts: vine.string().optional(),
    favouritesOnly: vine.string().optional(),
    ownerRole: vine.enum(['landlord', 'agency'] as const).optional(),
  }),
)

export const leasesExportValidator = vine.create(
  vine.object({ ...searchField, ...sortFields, ...dateRangeFields }),
)

export const leaseableEntitiesExportValidator = vine.create(
  vine.object({ ...searchField, ...sortFields, ...dateRangeFields }),
)

export const auditsExportValidator = vine.create(
  vine.object({
    ...searchField,
    ...dateRangeFields,
    action: vine.string().maxLength(64).optional(),
    appEnv: vine.enum(['dev', 'prod'] as const).optional(),
    actorId: vine.string().maxLength(64).optional(),
    outcome: vine.enum(['success', 'failed'] as const).optional(),
    targetType: vine.string().maxLength(64).optional(),
    targetId: vine.string().maxLength(64).optional(),
  }),
)
