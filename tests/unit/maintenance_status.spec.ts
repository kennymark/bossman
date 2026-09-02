import { test } from '@japa/runner'

import { isMaintenanceOverdue, parseOverdueFlag } from '#utils/maintenance_status'

const NOW = new Date('2026-09-02T12:00:00.000Z')
const DAY_MS = 24 * 60 * 60 * 1000
const daysFromNow = (days: number) => new Date(NOW.getTime() + days * DAY_MS).toISOString()

test.group('maintenance overdue rule', () => {
  test('a past due date on an open request is overdue', ({ assert }) => {
    assert.isTrue(isMaintenanceOverdue(daysFromNow(-1), 'todo', NOW))
    assert.isTrue(isMaintenanceOverdue(daysFromNow(-1), 'in_progress', NOW))
    /** Postponed but never re-dated still counts: the date was not moved. */
    assert.isTrue(isMaintenanceOverdue(daysFromNow(-1), 'postponed', NOW))
  })

  test('a complete request is never overdue', ({ assert }) => {
    assert.isFalse(isMaintenanceOverdue(daysFromNow(-30), 'complete', NOW))
  })

  test('a future or missing due date is not overdue', ({ assert }) => {
    assert.isFalse(isMaintenanceOverdue(daysFromNow(1), 'todo', NOW))
    assert.isFalse(isMaintenanceOverdue(null, 'todo', NOW))
    assert.isFalse(isMaintenanceOverdue(undefined, 'todo', NOW))
    assert.isFalse(isMaintenanceOverdue('', 'todo', NOW))
    assert.isFalse(isMaintenanceOverdue('garbage', 'todo', NOW))
  })

  test('accepts Date objects', ({ assert }) => {
    assert.isTrue(isMaintenanceOverdue(new Date(daysFromNow(-2)), 'todo', NOW))
  })
})

test.group('overdue query flag', () => {
  test('accepts the forms a query string carries', ({ assert }) => {
    assert.isTrue(parseOverdueFlag('1'))
    assert.isTrue(parseOverdueFlag('true'))
    assert.isTrue(parseOverdueFlag(' TRUE '))
    /** The client hook auto-casts `?overdue=1` to a number before it is read back. */
    assert.isTrue(parseOverdueFlag(1))
    assert.isTrue(parseOverdueFlag(true))
  })

  test('anything else is off', ({ assert }) => {
    assert.isFalse(parseOverdueFlag(undefined))
    assert.isFalse(parseOverdueFlag(null))
    assert.isFalse(parseOverdueFlag(''))
    assert.isFalse(parseOverdueFlag('0'))
    assert.isFalse(parseOverdueFlag('false'))
    assert.isFalse(parseOverdueFlag('yes'))
    assert.isFalse(parseOverdueFlag(0))
  })
})
