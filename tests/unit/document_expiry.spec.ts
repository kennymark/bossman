import { test } from '@japa/runner'

import {
  classifyDocumentExpiry,
  daysUntilExpiry,
  matchesExpiryFilter,
} from '#utils/document_expiry'

/** A fixed clock so the windows are deterministic. */
const NOW = new Date('2026-09-02T12:00:00.000Z')
const DAY_MS = 24 * 60 * 60 * 1000
const daysFromNow = (days: number) => new Date(NOW.getTime() + days * DAY_MS).toISOString()

test.group('document expiry classification', () => {
  test('no date is no_expiry', ({ assert }) => {
    assert.equal(classifyDocumentExpiry(null, NOW), 'no_expiry')
    assert.equal(classifyDocumentExpiry(undefined, NOW), 'no_expiry')
    assert.equal(classifyDocumentExpiry('', NOW), 'no_expiry')
    assert.equal(classifyDocumentExpiry('not a date', NOW), 'no_expiry')
  })

  test('a past date is expired', ({ assert }) => {
    assert.equal(classifyDocumentExpiry(daysFromNow(-1), NOW), 'expired')
    assert.equal(classifyDocumentExpiry(daysFromNow(-400), NOW), 'expired')
    /** A date one second ago counts as expired: a lapsed certificate is lapsed. */
    assert.equal(
      classifyDocumentExpiry(new Date(NOW.getTime() - 1000).toISOString(), NOW),
      'expired',
    )
  })

  test('inside 30 days is expiring_30', ({ assert }) => {
    assert.equal(classifyDocumentExpiry(daysFromNow(0.5), NOW), 'expiring_30')
    assert.equal(classifyDocumentExpiry(daysFromNow(29), NOW), 'expiring_30')
  })

  test('between 30 and 90 days is expiring_90', ({ assert }) => {
    assert.equal(classifyDocumentExpiry(daysFromNow(30), NOW), 'expiring_90')
    assert.equal(classifyDocumentExpiry(daysFromNow(89), NOW), 'expiring_90')
  })

  test('90 days or more is valid', ({ assert }) => {
    assert.equal(classifyDocumentExpiry(daysFromNow(90), NOW), 'valid')
    assert.equal(classifyDocumentExpiry(daysFromNow(365), NOW), 'valid')
  })

  test('accepts Date objects as well as ISO strings', ({ assert }) => {
    assert.equal(classifyDocumentExpiry(new Date(daysFromNow(10)), NOW), 'expiring_30')
  })

  test('daysUntilExpiry floors towards the past', ({ assert }) => {
    assert.equal(daysUntilExpiry(daysFromNow(10), NOW), 10)
    assert.equal(daysUntilExpiry(daysFromNow(0.5), NOW), 0)
    assert.equal(daysUntilExpiry(daysFromNow(-0.5), NOW), -1)
    assert.isNull(daysUntilExpiry(null, NOW))
  })
})

test.group('document expiry filter', () => {
  test('all matches everything', ({ assert }) => {
    assert.isTrue(matchesExpiryFilter(null, 'all', NOW))
    assert.isTrue(matchesExpiryFilter(daysFromNow(-5), 'all', NOW))
  })

  test('expiring_90 includes the 30-day window', ({ assert }) => {
    assert.isTrue(matchesExpiryFilter(daysFromNow(5), 'expiring_90', NOW))
    assert.isTrue(matchesExpiryFilter(daysFromNow(60), 'expiring_90', NOW))
    assert.isFalse(matchesExpiryFilter(daysFromNow(120), 'expiring_90', NOW))
    assert.isFalse(matchesExpiryFilter(daysFromNow(-1), 'expiring_90', NOW))
  })

  test('expiring_30 excludes the wider window', ({ assert }) => {
    assert.isTrue(matchesExpiryFilter(daysFromNow(5), 'expiring_30', NOW))
    assert.isFalse(matchesExpiryFilter(daysFromNow(60), 'expiring_30', NOW))
  })

  test('expired and no_expiry are exact', ({ assert }) => {
    assert.isTrue(matchesExpiryFilter(daysFromNow(-1), 'expired', NOW))
    assert.isFalse(matchesExpiryFilter(daysFromNow(1), 'expired', NOW))
    assert.isTrue(matchesExpiryFilter(null, 'no_expiry', NOW))
    assert.isFalse(matchesExpiryFilter(daysFromNow(1), 'no_expiry', NOW))
  })
})
