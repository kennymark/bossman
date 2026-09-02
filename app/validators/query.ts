import vine from '@vinejs/vine'

/**
 * Query-string shapes for endpoints that read `request.qs()` directly.
 *
 * These exist so Tuyau can type the query side of a request: it derives an endpoint's
 * `query` type from the validator a controller passes to `request.validateUsing`, and
 * an endpoint without one is typed `query: {}` — which makes passing any query
 * parameter from the client a *compile error* rather than an untyped escape hatch.
 *
 * They are deliberately permissive. Every field is an optional string, mirroring what
 * a query string actually carries and what these controllers already accept; the
 * controllers keep their own coercion (`Number(...) || 20`, `?? 1`) and their own
 * clamping. The point is to describe the contract, not to start rejecting requests
 * that worked before — a stricter rule here would turn a silently-defaulted parameter
 * into a 422 for callers that have been getting away with it for a long time.
 *
 * Tighten one of these only together with the controller that reads it.
 */

/** `page` / `perPage`, as read by the `paginationQs()` macro. */
const paginationFields = {
  page: vine.string().optional(),
  perPage: vine.string().optional(),
  sortBy: vine.string().optional(),
  sortOrder: vine.string().optional(),
}

/** Inclusive `YYYY-MM-DD` bounds. */
const dateRangeFields = {
  startDate: vine.string().optional(),
  endDate: vine.string().optional(),
}

export const paginationQueryValidator = vine.create(vine.object({ ...paginationFields }))

/** The five `analytics/<entity>/stats` endpoints all read the same range. */
export const analyticsRangeValidator = vine.create(vine.object({ ...dateRangeFields }))

/** The five `analytics/<entity>/entities` endpoints add pagination to that range. */
export const analyticsEntitiesValidator = vine.create(
  vine.object({ ...dateRangeFields, ...paginationFields }),
)

/** Cursor pagination over the Resend API, not offset pagination. */
export const emailsListValidator = vine.create(
  vine.object({
    limit: vine.string().optional(),
    after: vine.string().optional(),
    before: vine.string().optional(),
  }),
)

export const auditActionsValidator = vine.create(
  vine.object({
    ...paginationFields,
    ...dateRangeFields,
    action: vine.string().optional(),
    appEnv: vine.string().optional(),
    actorId: vine.string().optional(),
    outcome: vine.string().optional(),
    targetType: vine.string().optional(),
    targetId: vine.string().optional(),
    search: vine.string().optional(),
  }),
)

export const auditsIndexValidator = vine.create(
  vine.object({
    ...paginationFields,
    event: vine.string().optional(),
    auditableType: vine.string().optional(),
    userId: vine.string().optional(),
  }),
)

export const pushNotificationUsersValidator = vine.create(
  vine.object({ search: vine.string().optional() }),
)

/** `?refresh=1` bypasses the Railway read cache. */
export const railwayFreshValidator = vine.create(vine.object({ refresh: vine.string().optional() }))

export const railwayDeploymentsValidator = vine.create(
  vine.object({
    refresh: vine.string().optional(),
    environmentId: vine.string().optional(),
    projectId: vine.string().optional(),
  }),
)

/** `reason` lands in the admin action log for a restart or redeploy. */
export const railwayActionValidator = vine.create(vine.object({ reason: vine.string().optional() }))

export const railwayServiceDeployValidator = vine.create(
  vine.object({
    environmentId: vine.string().optional(),
    reason: vine.string().optional(),
  }),
)
