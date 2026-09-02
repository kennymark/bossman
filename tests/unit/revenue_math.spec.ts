import { test } from '@japa/runner'

import {
  type SubscriptionLike,
  canceledInRange,
  churnRate,
  cohortRetention,
  computeMrr,
  countByPlan,
  countByStatus,
  lastMonthKeys,
  monthlyNewVsCanceled,
  normaliseToMonthly,
  toDecimal,
  trialsEndingWithin,
} from '#utils/revenue'

const NOW = new Date('2026-09-02T10:00:00Z')
const seconds = (iso: string) => Math.floor(Date.parse(iso) / 1000)

function sub(overrides: Partial<SubscriptionLike> & { id: string }): SubscriptionLike {
  return {
    status: 'active',
    created: seconds('2026-01-15T00:00:00Z'),
    canceledAt: null,
    trialEnd: null,
    customerId: 'cus_1',
    items: [
      {
        priceId: 'price_monthly',
        unitAmount: 2000,
        currency: 'gbp',
        interval: 'month',
        intervalCount: 1,
        quantity: 1,
      },
    ],
    ...overrides,
  }
}

test.group('Revenue maths', () => {
  test('normalises intervals to a monthly figure', ({ assert }) => {
    assert.equal(normaliseToMonthly(1200, 'year'), 100)
    assert.equal(normaliseToMonthly(2000, 'month'), 2000)
    assert.equal(normaliseToMonthly(3000, 'month', 3), 1000, 'quarterly')
    assert.closeTo(normaliseToMonthly(100, 'week'), (100 * 52) / 12, 0.0001)
    assert.closeTo(normaliseToMonthly(10, 'day'), (10 * 365) / 12, 0.0001)
    assert.equal(normaliseToMonthly(2000, 'month', 1, 3), 6000, 'quantity multiplies')
    assert.equal(normaliseToMonthly(null, 'month'), 0, 'metered prices carry no flat amount')
    assert.equal(normaliseToMonthly(2000, null), 0)
  })

  test('converts minor units to a rounded decimal', ({ assert }) => {
    assert.equal(toDecimal(1999), 19.99)
    assert.equal(toDecimal(1000 / 3), 3.33)
  })

  test('sums MRR for paying statuses only and picks the dominant currency', ({ assert }) => {
    const mrr = computeMrr([
      sub({ id: 'a' }),
      sub({
        id: 'b',
        items: [
          {
            priceId: 'price_yearly',
            unitAmount: 24000,
            currency: 'gbp',
            interval: 'year',
            intervalCount: 1,
            quantity: 1,
          },
        ],
      }),
      sub({ id: 'c', status: 'past_due' }),
      sub({ id: 'd', status: 'trialing' }),
      sub({ id: 'e', status: 'canceled' }),
      sub({
        id: 'f',
        items: [
          {
            priceId: 'price_usd',
            unitAmount: 500,
            currency: 'usd',
            interval: 'month',
            intervalCount: 1,
            quantity: 1,
          },
        ],
      }),
    ])

    assert.equal(mrr.currency, 'gbp')
    assert.equal(mrr.amount, 60, '20 + 20 (yearly / 12) + 20 (past due)')
    assert.deepEqual(mrr.byCurrency, [
      { currency: 'gbp', amount: 60, subscriptions: 3 },
      { currency: 'usd', amount: 5, subscriptions: 1 },
    ])
  })

  test('returns an empty result when nothing is billable', ({ assert }) => {
    assert.deepEqual(computeMrr([]), { amount: 0, currency: '', byCurrency: [] })
  })

  test('counts by status and by plan', ({ assert }) => {
    const subs = [
      sub({ id: 'a' }),
      sub({ id: 'b', status: 'trialing' }),
      sub({
        id: 'c',
        items: [
          {
            priceId: 'price_premium',
            unitAmount: 10000,
            currency: 'gbp',
            interval: 'month',
            intervalCount: 1,
            quantity: 1,
          },
        ],
      }),
    ]
    assert.deepEqual(countByStatus(subs), { active: 2, trialing: 1 })

    const byPlan = countByPlan(subs, (priceId) =>
      priceId === 'price_premium' ? 'premium_monthly' : 'standard_monthly',
    )
    assert.deepEqual(byPlan, [
      { plan: 'standard_monthly', count: 2, mrr: 20, currency: 'gbp' },
      { plan: 'premium_monthly', count: 1, mrr: 100, currency: 'gbp' },
    ])
  })

  test('churn rate is cancellations over the base at the start of the range', ({ assert }) => {
    assert.equal(churnRate(5, 95), 5)
    assert.equal(churnRate(1, 2), 33.33)
    assert.equal(churnRate(0, 0), 0, 'no base, no churn')
    assert.equal(churnRate(3, 0), 100)
  })

  test('filters cancellations to an inclusive date range', ({ assert }) => {
    const subs = [
      sub({ id: 'in', status: 'canceled', canceledAt: seconds('2026-08-31T23:59:00Z') }),
      sub({ id: 'edge', status: 'canceled', canceledAt: seconds('2026-08-01T00:00:00Z') }),
      sub({ id: 'out', status: 'canceled', canceledAt: seconds('2026-07-31T23:59:59Z') }),
      sub({ id: 'live' }),
    ]
    assert.deepEqual(
      canceledInRange(subs, '2026-08-01', '2026-08-31').map((s) => s.id),
      ['in', 'edge'],
    )
  })

  test('lists the last N month keys oldest first', ({ assert }) => {
    assert.deepEqual(lastMonthKeys(3, NOW), ['2026-07', '2026-08', '2026-09'])
    assert.deepEqual(lastMonthKeys(2, new Date('2026-01-10T00:00:00Z')), ['2025-12', '2026-01'])
  })

  test('buckets new and canceled subscriptions by month', ({ assert }) => {
    const rows = monthlyNewVsCanceled(
      [
        sub({ id: 'a', created: seconds('2026-09-01T00:00:00Z') }),
        sub({
          id: 'b',
          created: seconds('2026-07-10T00:00:00Z'),
          status: 'canceled',
          canceledAt: seconds('2026-08-20T00:00:00Z'),
        }),
        sub({ id: 'old', created: seconds('2025-01-01T00:00:00Z') }),
      ],
      3,
      NOW,
    )
    assert.deepEqual(rows, [
      { month: '2026-07', new: 1, canceled: 0 },
      { month: '2026-08', new: 0, canceled: 1 },
      { month: '2026-09', new: 1, canceled: 0 },
    ])
  })

  test('finds trials ending within a window', ({ assert }) => {
    const subs = [
      sub({ id: 'soon', status: 'trialing', trialEnd: seconds('2026-09-10T00:00:00Z') }),
      sub({ id: 'later', status: 'trialing', trialEnd: seconds('2026-10-10T00:00:00Z') }),
      sub({ id: 'past', status: 'trialing', trialEnd: seconds('2026-09-01T00:00:00Z') }),
      sub({ id: 'active', status: 'active', trialEnd: seconds('2026-09-10T00:00:00Z') }),
    ]
    assert.deepEqual(
      trialsEndingWithin(subs, 14, NOW).map((s) => s.id),
      ['soon'],
    )
  })

  test('cohort retention is a percentage of the cohort', ({ assert }) => {
    assert.deepEqual(
      cohortRetention([
        { month: '2026-07', signups: 8, retained: 2 },
        { month: '2026-08', signups: 0, retained: 0 },
      ]),
      [
        { month: '2026-07', signups: 8, retained: 2, retention: 25 },
        { month: '2026-08', signups: 0, retained: 0, retention: 0 },
      ],
    )
  })
})
