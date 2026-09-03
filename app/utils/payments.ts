/**
 * Status vocabularies shared by the customer page's Invoices tab and the endpoints
 * behind it.
 *
 * Client-safe: plain data and string helpers with no AdonisJS imports, so the filter
 * dropdowns offer exactly the set the server accepts (see `agent.md`).
 */

/** Rent payment statuses, as the `payments.status` column stores them. */
export const PAYMENT_STATUSES = [
  'paid',
  'unpaid',
  'underpaid',
  'overpaid',
  'processing',
  'pending',
  'failed',
  'refunded',
  'overdue',
  'zero',
] as const

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

/** `all` widens the list; every other value filters on it. */
export const PAYMENT_STATUS_FILTERS = ['all', ...PAYMENT_STATUSES] as const
export type PaymentStatusFilter = (typeof PAYMENT_STATUS_FILTERS)[number]

/**
 * Both lists open on settled money.
 *
 * Most rows in this table are unpaid rent schedules stretching into the future, which
 * bury the handful of payments an operator is usually looking for. The filter is
 * visible and one click from `all`, so nothing is hidden silently.
 */
export const DEFAULT_PAYMENT_STATUS: PaymentStatusFilter = 'paid'

/** Stripe invoice statuses (https://docs.stripe.com/api/invoices/object#invoice_object-status). */
export const INVOICE_STATUSES = ['draft', 'open', 'paid', 'uncollectible', 'void'] as const

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export const INVOICE_STATUS_FILTERS = ['all', ...INVOICE_STATUSES] as const
export type InvoiceStatusFilter = (typeof INVOICE_STATUS_FILTERS)[number]

export const DEFAULT_INVOICE_STATUS: InvoiceStatusFilter = 'paid'

/** "underpaid" -> "Underpaid", "all" -> "All statuses". */
export function statusLabel(value: string): string {
  if (value === 'all') return 'All statuses'
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ')
}

export function isPaymentStatusFilter(value: unknown): value is PaymentStatusFilter {
  return typeof value === 'string' && (PAYMENT_STATUS_FILTERS as readonly string[]).includes(value)
}

export function isInvoiceStatusFilter(value: unknown): value is InvoiceStatusFilter {
  return typeof value === 'string' && (INVOICE_STATUS_FILTERS as readonly string[]).includes(value)
}

/**
 * The status a request should filter on, or `null` for "do not filter".
 *
 * An absent parameter means the caller has expressed no preference and gets the
 * default; an explicit `all` means they asked for everything.
 */
export function resolvePaymentStatus(value: unknown): PaymentStatus | null {
  const filter = isPaymentStatusFilter(value) ? value : DEFAULT_PAYMENT_STATUS
  return filter === 'all' ? null : filter
}

export function resolveInvoiceStatus(value: unknown): InvoiceStatus | null {
  const filter = isInvoiceStatusFilter(value) ? value : DEFAULT_INVOICE_STATUS
  return filter === 'all' ? null : filter
}
