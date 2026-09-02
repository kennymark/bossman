import vine from '@vinejs/vine'

import { JOB_QUEUES, MAX_HISTORY_DAYS } from '#utils/jobs'
import { MAX_PER_PAGE } from '#utils/vine'
import { confirmRule, reasonRule } from '#validators/destructive'

/**
 * Query and body shapes for the job monitor.
 *
 * `page` and `perPage` are clamped rather than rejected — they arrive from ordinary
 * navigation — but `perPage` can never exceed `MAX_PER_PAGE`, because it becomes the
 * `limit` of a query against the live job store.
 */
export const listJobsValidator = vine.create(
  vine.object({
    search: vine.string().trim().maxLength(200).optional(),
    queue: vine.enum(JOB_QUEUES).optional(),
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
  }),
)

export const historyJobsValidator = vine.create(
  vine.object({
    days: vine.number().min(1).max(MAX_HISTORY_DAYS).optional(),
    /** Narrow the chart to one job name (exact match). */
    name: vine.string().trim().maxLength(200).optional(),
  }),
)

/** Re-queuing runs customer-affecting code again, so it is reasoned and recorded. */
export const rerunJobValidator = vine.create(
  vine.object({
    reason: reasonRule,
  }),
)

/** Deleting also needs the retyped phrase, checked in the controller against the job's name. */
export const destroyJobValidator = vine.create(
  vine.object({
    reason: reasonRule,
    confirmation: confirmRule,
  }),
)
