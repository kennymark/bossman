import { test } from '@japa/runner'

import { leaseEndKind, leaseEndLabel, leaseTermLabel } from '#utils/lease_period'

/** Stands in for the UI's date formatter, so these stay about the wording, not the format. */
const fmt = (value: string | Date) => `<${String(value)}>`

/**
 * The end date is optional: a rolling tenancy runs until somebody ends it. Formatting
 * that absence as a date is what put "Invalid date" in the leases table.
 */
test.group('Lease term labels', () => {
  test('shows the date when there is one', ({ assert }) => {
    const lease = { endDate: '2026-01-31', isPermanentlyRolling: false }
    assert.equal(leaseEndKind(lease), 'date')
    assert.equal(leaseEndLabel(lease, fmt), '<2026-01-31>')
  })

  test('prefers the date even on a lease flagged rolling', ({ assert }) => {
    const lease = { endDate: '2026-01-31', isPermanentlyRolling: true }
    assert.equal(leaseEndLabel(lease, fmt), '<2026-01-31>')
  })

  test('says rolling when the lease is flagged rolling and has no end', ({ assert }) => {
    const lease = { endDate: null, isPermanentlyRolling: true }
    assert.equal(leaseEndKind(lease), 'rolling')
    assert.equal(leaseEndLabel(lease, fmt), 'Rolling')
  })

  test('does not invent a rolling term for a lease missing its end date', ({ assert }) => {
    const lease = { endDate: null, isPermanentlyRolling: false }
    assert.equal(leaseEndKind(lease), 'unknown')
    assert.equal(leaseEndLabel(lease, fmt), 'No end date')
  })

  test('never formats a missing date', ({ assert }) => {
    const seen: unknown[] = []
    const spy = (value: string | Date) => {
      seen.push(value)
      return 'formatted'
    }
    leaseEndLabel({ endDate: null, isPermanentlyRolling: true }, spy)
    leaseEndLabel({ endDate: undefined }, spy)
    assert.lengthOf(seen, 0)
  })

  test('builds the one-line term', ({ assert }) => {
    assert.equal(
      leaseTermLabel({ startDate: '2025-01-01', endDate: null, isPermanentlyRolling: true }, fmt),
      '<2025-01-01> – Rolling',
    )
    assert.equal(
      leaseTermLabel({ startDate: null, endDate: '2026-01-31' }, fmt),
      'No start date – <2026-01-31>',
    )
  })
})
