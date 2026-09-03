import vine from '@vinejs/vine'

import { INVOICE_STATUS_FILTERS, PAYMENT_STATUS_FILTERS } from '#utils/payments'

/**
 * Query shapes for the customer page's Invoices tab.
 *
 * `vine.enum` rather than `vine.string()` on purpose: both status values reach a SQL
 * `where` or a Stripe list parameter, and the tenant filter reaches a subquery, so the
 * accepted set is fixed here rather than at the call site.
 */

const paginationFields = {
  page: vine.string().optional(),
  perPage: vine.string().optional(),
}

export const orgPaymentsValidator = vine.create(
  vine.object({
    ...paginationFields,
    status: vine.enum([...PAYMENT_STATUS_FILTERS]).optional(),
    /** A tenant id from `orgs/:id/payment-users`; anything else simply matches nothing. */
    tenantId: vine.string().trim().maxLength(64).optional(),
  }),
)

export const orgInvoicesValidator = vine.create(
  vine.object({
    status: vine.enum([...INVOICE_STATUS_FILTERS]).optional(),
  }),
)
