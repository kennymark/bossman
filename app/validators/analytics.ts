import vine from '@vinejs/vine'

/** ISO date (YYYY-MM-DD), the only shape the range filters accept. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Range for `GET /api/v1/analytics/revenue/stats`.
 *
 * Both bounds are optional and default to the last month in the controller. A value
 * that matches the pattern but is not a real calendar date (`2026-02-31`) is caught by
 * `parseDateRange`, which falls back to the default rather than reaching Stripe.
 */
export const revenueRangeValidator = vine.create(
  vine.object({
    startDate: vine.string().regex(ISO_DATE).optional(),
    endDate: vine.string().regex(ISO_DATE).optional(),
  }),
)
