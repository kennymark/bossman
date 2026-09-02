/**
 * Pure revenue maths. Client-safe: no AdonisJS imports, no Stripe SDK.
 *
 * Stripe amounts arrive in minor units (pence, cents). Everything here keeps minor
 * units until the final `toDecimal` so that rounding happens once, at the edge.
 */

export type BillingInterval = 'day' | 'week' | 'month' | 'year'

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused'

export interface SubscriptionItemLike {
  priceId: string
  /** Minor units per interval; null for metered / tiered prices without a flat amount. */
  unitAmount: number | null
  currency: string
  interval: BillingInterval | null
  intervalCount: number
  quantity: number
}

export interface SubscriptionLike {
  id: string
  status: SubscriptionStatus
  /** Unix seconds. */
  created: number
  /** Unix seconds, or null while the subscription is live. */
  canceledAt: number | null
  /** Unix seconds, or null when there is no trial. */
  trialEnd: number | null
  customerId: string | null
  items: SubscriptionItemLike[]
}

/** Statuses that count towards MRR: paying now, or expected to pay once dunning resolves. */
export const MRR_STATUSES: readonly SubscriptionStatus[] = ['active', 'past_due']

const DAYS_PER_MONTH = 365 / 12
const WEEKS_PER_MONTH = 52 / 12

/**
 * Normalises one price to a monthly figure in minor units. Yearly is `/12`, quarterly
 * is a month interval with `intervalCount = 3`, weekly and daily scale up.
 */
export function normaliseToMonthly(
  unitAmount: number | null,
  interval: BillingInterval | null,
  intervalCount = 1,
  quantity = 1,
): number {
  if (unitAmount === null || !interval) return 0
  const count = intervalCount > 0 ? intervalCount : 1
  const perInterval = unitAmount * (quantity > 0 ? quantity : 1)
  switch (interval) {
    case 'year':
      return perInterval / (12 * count)
    case 'month':
      return perInterval / count
    case 'week':
      return (perInterval * WEEKS_PER_MONTH) / count
    case 'day':
      return (perInterval * DAYS_PER_MONTH) / count
    default:
      return 0
  }
}

/** Minor units to a decimal with two places, without float drift. */
export function toDecimal(minor: number): number {
  return Math.round(minor) / 100
}

export interface MrrResult {
  /** The dominant currency's MRR, as a decimal. */
  amount: number
  /** Lower-case ISO code, e.g. `gbp`. Empty when there are no subscriptions. */
  currency: string
  byCurrency: { currency: string; amount: number; subscriptions: number }[]
}

/** MRR per currency; the headline figure is the currency with the largest total. */
export function computeMrr(subscriptions: SubscriptionLike[]): MrrResult {
  const totals = new Map<string, { minor: number; subscriptions: number }>()

  for (const sub of subscriptions) {
    if (!MRR_STATUSES.includes(sub.status)) continue
    const perCurrency = new Map<string, number>()
    for (const item of sub.items) {
      const monthly = normaliseToMonthly(
        item.unitAmount,
        item.interval,
        item.intervalCount,
        item.quantity,
      )
      if (monthly === 0) continue
      const currency = item.currency.toLowerCase()
      perCurrency.set(currency, (perCurrency.get(currency) ?? 0) + monthly)
    }
    for (const [currency, minor] of perCurrency) {
      const current = totals.get(currency) ?? { minor: 0, subscriptions: 0 }
      totals.set(currency, {
        minor: current.minor + minor,
        subscriptions: current.subscriptions + 1,
      })
    }
  }

  const byCurrency = [...totals.entries()]
    .map(([currency, { minor, subscriptions }]) => ({
      currency,
      amount: toDecimal(minor),
      subscriptions,
    }))
    .sort((a, b) => b.amount - a.amount)

  const top = byCurrency[0]
  return { amount: top?.amount ?? 0, currency: top?.currency ?? '', byCurrency }
}

export function countByStatus(subscriptions: SubscriptionLike[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const sub of subscriptions) counts[sub.status] = (counts[sub.status] ?? 0) + 1
  return counts
}

export interface PlanBreakdown {
  plan: string
  count: number
  /** Monthly recurring revenue attributable to the plan, decimal, in `currency`. */
  mrr: number
  currency: string
}

/**
 * Counts live subscriptions by plan. `planFor` maps a price id to a label; a
 * subscription with several prices is attributed to its first item.
 */
export function countByPlan(
  subscriptions: SubscriptionLike[],
  planFor: (priceId: string) => string,
): PlanBreakdown[] {
  const rows = new Map<string, PlanBreakdown & { minor: number }>()
  for (const sub of subscriptions) {
    const first = sub.items[0]
    const plan = first ? planFor(first.priceId) : 'unknown'
    const key = plan
    const row = rows.get(key) ?? { plan, count: 0, mrr: 0, currency: '', minor: 0 }
    row.count += 1
    if (MRR_STATUSES.includes(sub.status)) {
      for (const item of sub.items) {
        row.minor += normaliseToMonthly(
          item.unitAmount,
          item.interval,
          item.intervalCount,
          item.quantity,
        )
        if (!row.currency) row.currency = item.currency.toLowerCase()
      }
    }
    rows.set(key, row)
  }
  return [...rows.values()]
    .map(({ minor, ...row }) => ({ ...row, mrr: toDecimal(minor) }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Churn rate over a range: cancellations divided by the base that was active at the
 * start. The base is approximated as "active now + canceled in range", which is exact
 * when nothing new started in the range and slightly generous otherwise.
 */
export function churnRate(canceledInRange: number, activeNow: number): number {
  const base = activeNow + canceledInRange
  if (base <= 0) return 0
  return Math.round((canceledInRange / base) * 10000) / 100
}

/** `YYYY-MM` for a unix-seconds timestamp, in UTC. */
export function monthKey(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 7)
}

/** The last `count` month keys ending with the month containing `now`, oldest first. */
export function lastMonthKeys(count: number, now = new Date()): string[] {
  const keys: string[] = []
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - i, 1))
    keys.push(d.toISOString().slice(0, 7))
  }
  return keys
}

export interface MonthlyMovement {
  month: string
  new: number
  canceled: number
}

/** New (by `created`) vs canceled (by `canceledAt`) per month for the last `months`. */
export function monthlyNewVsCanceled(
  subscriptions: SubscriptionLike[],
  months = 6,
  now = new Date(),
): MonthlyMovement[] {
  const keys = lastMonthKeys(months, now)
  const rows = new Map(keys.map((month) => [month, { month, new: 0, canceled: 0 }]))
  for (const sub of subscriptions) {
    const created = rows.get(monthKey(sub.created))
    if (created) created.new += 1
    if (sub.canceledAt !== null) {
      const canceled = rows.get(monthKey(sub.canceledAt))
      if (canceled) canceled.canceled += 1
    }
  }
  return keys.map((month) => rows.get(month)!)
}

/** Subscriptions canceled inside an inclusive `YYYY-MM-DD` range. */
export function canceledInRange(
  subscriptions: SubscriptionLike[],
  startDate: string,
  endDate: string,
): SubscriptionLike[] {
  const start = Date.parse(`${startDate}T00:00:00Z`) / 1000
  const end = Date.parse(`${endDate}T23:59:59.999Z`) / 1000
  return subscriptions.filter(
    (sub) => sub.canceledAt !== null && sub.canceledAt >= start && sub.canceledAt <= end,
  )
}

/** Trials that end within the next `days` days (and have not already ended). */
export function trialsEndingWithin(
  subscriptions: SubscriptionLike[],
  days: number,
  now = new Date(),
): SubscriptionLike[] {
  const from = now.getTime() / 1000
  const to = from + days * 86400
  return subscriptions.filter(
    (sub) =>
      sub.status === 'trialing' &&
      sub.trialEnd !== null &&
      sub.trialEnd >= from &&
      sub.trialEnd <= to,
  )
}

export interface CohortRow {
  month: string
  signups: number
  retained: number
  /** Percentage, two decimals. */
  retention: number
}

/** Retention per signup month: share of the cohort with an active subscription today. */
export function cohortRetention(
  rows: { month: string; signups: number; retained: number }[],
): CohortRow[] {
  return rows.map(({ month, signups, retained }) => ({
    month,
    signups,
    retained,
    retention: signups > 0 ? Math.round((retained / signups) * 10000) / 100 : 0,
  }))
}
