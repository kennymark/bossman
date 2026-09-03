import { test } from '@japa/runner'

import {
  DEFAULT_INVOICE_STATUS,
  DEFAULT_PAYMENT_STATUS,
  isInvoiceStatusFilter,
  isPaymentStatusFilter,
  resolveInvoiceStatus,
  resolvePaymentStatus,
  statusLabel,
} from '#utils/payments'

/**
 * The Invoices tab opens on settled money. These cover the rule that decides it, since
 * getting it wrong either hides rows an operator asked for or floods the table with
 * thousands of future rent schedules.
 */
test.group('Payment and invoice status filters', () => {
  test('defaults to paid when nothing is asked for', ({ assert }) => {
    assert.equal(DEFAULT_PAYMENT_STATUS, 'paid')
    assert.equal(DEFAULT_INVOICE_STATUS, 'paid')
    assert.equal(resolvePaymentStatus(undefined), 'paid')
    assert.equal(resolveInvoiceStatus(undefined), 'paid')
  })

  test('treats an explicit "all" as no filter', ({ assert }) => {
    assert.isNull(resolvePaymentStatus('all'))
    assert.isNull(resolveInvoiceStatus('all'))
  })

  test('passes a recognised status through', ({ assert }) => {
    assert.equal(resolvePaymentStatus('unpaid'), 'unpaid')
    assert.equal(resolvePaymentStatus('overdue'), 'overdue')
    assert.equal(resolveInvoiceStatus('draft'), 'draft')
    assert.equal(resolveInvoiceStatus('void'), 'void')
  })

  test('falls back to the default rather than trusting an unknown value', ({ assert }) => {
    assert.equal(resolvePaymentStatus('; drop table payments'), 'paid')
    assert.equal(resolvePaymentStatus(42), 'paid')
    assert.equal(resolvePaymentStatus(null), 'paid')
    /** A Stripe payment status is not a Stripe invoice status. */
    assert.equal(resolveInvoiceStatus('unpaid'), 'paid')
  })

  test('recognises only its own vocabulary', ({ assert }) => {
    assert.isTrue(isPaymentStatusFilter('underpaid'))
    assert.isFalse(isPaymentStatusFilter('uncollectible'))
    assert.isTrue(isInvoiceStatusFilter('uncollectible'))
    assert.isFalse(isInvoiceStatusFilter('underpaid'))
  })

  test('labels a status for a dropdown', ({ assert }) => {
    assert.equal(statusLabel('all'), 'All statuses')
    assert.equal(statusLabel('paid'), 'Paid')
    assert.equal(statusLabel('uncollectible'), 'Uncollectible')
  })
})
