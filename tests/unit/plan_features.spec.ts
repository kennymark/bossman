import { test } from '@japa/runner'

import {
  effectiveFeatures,
  featureDiff,
  limitRows,
  limitStatus,
  mergeFeatures,
  sanitiseFeatureMap,
} from '#utils/plan_features'

import { plansFeatureList } from '../../app/data/subscription.js'

/**
 * These helpers decide what the billing tab says a customer is entitled to and what
 * the feature flag editor writes back, so they have to agree with the product's own
 * `Org.featureList` exactly.
 */
test.group('effective plan features', () => {
  test('resolves a plan id to its catalogue tier', ({ assert }) => {
    const result = effectiveFeatures({ planId: 3, customPlanFeatures: null })

    assert.equal(result.source, 'plan')
    assert.equal(result.planName, 'essential_monthly')
    assert.equal(result.basePlanName, 'essential_monthly')
    assert.equal(result.tier, 'essential')
    assert.deepEqual(result.features, plansFeatureList.essential)
    assert.deepEqual(result.planDefaults, plansFeatureList.essential)
  })

  test('falls back to standard for a missing or unknown plan', ({ assert }) => {
    const missing = effectiveFeatures({ planId: null })
    const unknown = effectiveFeatures({ planId: 999 })

    assert.equal(missing.tier, 'standard')
    assert.isNull(missing.basePlanName)
    assert.deepEqual(missing.features, plansFeatureList.standard)
    assert.equal(unknown.tier, 'standard')
    assert.deepEqual(unknown.features, plansFeatureList.standard)
  })

  test('custom plan features override the plan entirely', ({ assert }) => {
    const result = effectiveFeatures({
      planId: 5,
      customPlanFeatures: { tenantLimit: 40, prioritySupport: true, note: 'ignored' },
    })

    assert.equal(result.source, 'custom')
    assert.equal(result.planName, 'custom')
    assert.equal(result.basePlanName, 'premium_monthly')
    assert.deepEqual(result.features, { tenantLimit: 40, prioritySupport: true })
    /** Defaults still describe the underlying plan so the UI can show what changed. */
    assert.deepEqual(result.planDefaults, plansFeatureList.premium)
  })

  test('an empty override object still counts as custom, like the product', ({ assert }) => {
    assert.equal(effectiveFeatures({ planId: 1, customPlanFeatures: {} }).source, 'custom')
  })

  test('accepts a string plan id as stored by some drivers', ({ assert }) => {
    assert.equal(effectiveFeatures({ planId: '2' }).planName, 'standard_yearly')
  })
})

test.group('feature maps', () => {
  test('sanitise keeps only finite numbers and booleans', ({ assert }) => {
    assert.deepEqual(
      sanitiseFeatureMap({ a: 1, b: true, c: 'x', d: null, e: Number.NaN, f: Infinity, g: {} }),
      { a: 1, b: true },
    )
    assert.deepEqual(sanitiseFeatureMap(null), {})
    assert.deepEqual(sanitiseFeatureMap([1, 2]), {})
  })

  test('merge applies overrides onto a copy of the base', ({ assert }) => {
    const base = { tenantLimit: 4, eLease: true }
    const merged = mergeFeatures(base, { tenantLimit: 10, marketing: true, junk: 'no' })

    assert.deepEqual(merged, { tenantLimit: 10, eLease: true, marketing: true })
    assert.deepEqual(base, { tenantLimit: 4, eLease: true })
  })

  test('diff lists only the keys that changed', ({ assert }) => {
    const diff = featureDiff({ a: 1, b: true, c: 3 }, { a: 1, b: false, d: 4 })

    assert.deepEqual(diff, {
      b: { from: true, to: false },
      c: { from: 3, to: null },
      d: { from: null, to: 4 },
    })
  })
})

test.group('limit status', () => {
  test('is ok below 80 percent', ({ assert }) => {
    assert.equal(limitStatus(3, 4).status, 'ok')
    assert.equal(limitStatus(0, 4).status, 'ok')
    assert.equal(limitStatus(3, 4).percent, 75)
  })

  test('is near at or above 80 percent', ({ assert }) => {
    assert.equal(limitStatus(8, 10).status, 'near')
    assert.equal(limitStatus(9, 10).status, 'near')
  })

  test('is over once the limit is reached, because the product blocks at >=', ({ assert }) => {
    assert.equal(limitStatus(4, 4).status, 'over')
    assert.equal(limitStatus(5, 4).status, 'over')
    assert.equal(limitStatus(5, 4).percent, 125)
  })

  test('treats a zero limit as nothing allowed', ({ assert }) => {
    assert.equal(limitStatus(0, 0).status, 'ok')
    assert.equal(limitStatus(1, 0).status, 'over')
    assert.equal(limitStatus(1, 0).percent, 100)
  })

  test('is unknown when either side is missing or not numeric', ({ assert }) => {
    assert.equal(limitStatus(null, 4).status, 'unknown')
    assert.equal(limitStatus(2, undefined).status, 'unknown')
    assert.equal(limitStatus(2, true).status, 'unknown')
    assert.isNull(limitStatus(null, 4).percent)
  })

  test('limit rows pair each enforced limit with its usage figure', ({ assert }) => {
    const rows = limitRows(
      { tenantLimit: 4, storageLimit: 50, teamSizeLimit: 1, eSignDocsLimit: 10 },
      { leases: 2, storageMb: 45, teamMembers: null, properties: 3, eSignDocsThisMonth: 10 },
    )
    const byKey = Object.fromEntries(rows.map((row) => [row.key, row]))

    assert.equal(rows.length, 5)
    assert.equal(byKey.tenants.status, 'ok')
    assert.equal(byKey.storage.status, 'near')
    assert.equal(byKey.team.status, 'unknown')
    /** No propertyLimit on this plan: the product does not enforce one, so it is unknown. */
    assert.equal(byKey.properties.status, 'unknown')
    assert.equal(byKey.esign.status, 'over')
  })
})
