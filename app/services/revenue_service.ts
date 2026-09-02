import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import type Stripe from 'stripe'

import { getStripe } from '#services/stripe_client'
import type { AppEnv } from '#types/env'
import {
  type BillingInterval,
  type CohortRow,
  type MonthlyMovement,
  type MrrResult,
  type PlanBreakdown,
  type SubscriptionLike,
  canceledInRange,
  churnRate,
  cohortRetention,
  computeMrr,
  countByPlan,
  countByStatus,
  monthlyNewVsCanceled,
  trialsEndingWithin,
} from '#utils/revenue'

import { getPlanName } from '../data/subscription.js'

/** Metered "custom plan" prices created by `StripeService.createCustomSubscription`. */
const CUSTOM_PLAN_PRICE_IDS = new Set([
  'price_1PY5AxHhNEQ5MjrctSprncNf',
  'price_1PY5fDHhNEQ5Mjrcmi7nb2bT',
])

/** Hard ceiling per status list; Stripe pages at 100. */
const MAX_SUBSCRIPTIONS = 1000
const CACHE_TTL_MS = 5 * 60 * 1000
const COHORT_MONTHS = 6
const MOVEMENT_MONTHS = 6
const TRIAL_WINDOW_DAYS = 14

export interface RevenueStats {
  configured: true
  appEnv: AppEnv
  fetchedAt: string
  /** True when a list hit `MAX_SUBSCRIPTIONS`; figures are then a floor. */
  truncated: boolean
  mrr: MrrResult
  byStatus: Record<string, number>
  byPlan: PlanBreakdown[]
  trialsEnding: {
    days: number
    count: number
    items: { id: string; customerId: string | null; plan: string; trialEnd: string }[]
  }
  churn: {
    startDate: string
    endDate: string
    canceled: number
    activeNow: number
    activeAtStart: number
    /** Percentage. */
    rate: number
  }
  monthly: MonthlyMovement[]
  cohorts: CohortRow[]
}

export type RevenueStatsResult = RevenueStats | { configured: false; appEnv: AppEnv }

interface CachedSubscriptions {
  fetchedAt: number
  subscriptions: SubscriptionLike[]
  truncated: boolean
}

const cache = new Map<AppEnv, CachedSubscriptions>()

function toItem(item: Stripe.SubscriptionItem) {
  const price = item.price
  return {
    priceId: price.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval: (price.recurring?.interval ?? null) as BillingInterval | null,
    intervalCount: price.recurring?.interval_count ?? 1,
    quantity: item.quantity ?? 1,
  }
}

function toSubscriptionLike(sub: Stripe.Subscription): SubscriptionLike {
  return {
    id: sub.id,
    status: sub.status,
    created: sub.created,
    canceledAt: sub.canceled_at,
    trialEnd: sub.trial_end,
    customerId: typeof sub.customer === 'string' ? sub.customer : (sub.customer?.id ?? null),
    items: sub.items.data.map(toItem),
  }
}

export class RevenueService {
  /** Drops the cached lists for one environment (or all). */
  static clearCache(appEnv?: AppEnv) {
    if (appEnv) cache.delete(appEnv)
    else cache.clear()
  }

  /**
   * Live (active, trialing, past_due) plus canceled subscriptions, newest first, each
   * capped at `MAX_SUBSCRIPTIONS`. Cached for five minutes per environment so a page
   * that re-renders on every date change does not fan out to Stripe each time.
   */
  static async listSubscriptions(appEnv: AppEnv, stripe: Stripe): Promise<CachedSubscriptions> {
    const cached = cache.get(appEnv)
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached

    const statuses: Stripe.SubscriptionListParams.Status[] = [
      'active',
      'trialing',
      'past_due',
      'canceled',
    ]
    let truncated = false
    const lists = await Promise.all(
      statuses.map(async (status) => {
        const rows = await stripe.subscriptions
          .list({ status, limit: 100 })
          .autoPagingToArray({ limit: MAX_SUBSCRIPTIONS })
        if (rows.length >= MAX_SUBSCRIPTIONS) truncated = true
        return rows.map(toSubscriptionLike)
      }),
    )

    const entry = { fetchedAt: Date.now(), subscriptions: lists.flat(), truncated }
    cache.set(appEnv, entry)
    return entry
  }

  static planFor(appEnv: AppEnv) {
    return (priceId: string): string => {
      if (CUSTOM_PLAN_PRICE_IDS.has(priceId)) return 'custom'
      return getPlanName(priceId, appEnv)?.fullName ?? 'other'
    }
  }

  /**
   * Retention by signup month from the customer database. Never throws: a missing
   * column degrades to an empty table with a logged warning.
   */
  static async cohorts(appEnv: AppEnv): Promise<CohortRow[]> {
    try {
      const result = await db.connection(appEnv).rawQuery(
        `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
                COUNT(*)::int AS signups,
                COUNT(*) FILTER (WHERE has_active_subscription = true)::int AS retained
         FROM orgs
         WHERE is_test_account = false
           AND created_at >= date_trunc('month', NOW()) - (? || ' months')::interval
         GROUP BY 1
         ORDER BY 1`,
        [String(COHORT_MONTHS - 1)],
      )
      const rows = result.rows as { month: string; signups: number; retained: number }[]
      return cohortRetention(
        rows.map((r) => ({
          month: r.month,
          signups: Number(r.signups),
          retained: Number(r.retained),
        })),
      )
    } catch (err) {
      logger.warn({ err, appEnv }, 'Revenue cohorts unavailable')
      return []
    }
  }

  static async stats(
    appEnv: AppEnv,
    range: { startDate: string; endDate: string },
  ): Promise<RevenueStatsResult> {
    const stripe = getStripe(appEnv)
    if (!stripe) return { configured: false, appEnv }

    const [{ subscriptions, fetchedAt, truncated }, cohorts] = await Promise.all([
      RevenueService.listSubscriptions(appEnv, stripe),
      RevenueService.cohorts(appEnv),
    ])

    const live = subscriptions.filter((s) => s.status !== 'canceled')
    const planFor = RevenueService.planFor(appEnv)
    const canceled = canceledInRange(subscriptions, range.startDate, range.endDate)
    const activeNow = live.filter((s) => s.status === 'active' || s.status === 'past_due').length
    const trials = trialsEndingWithin(live, TRIAL_WINDOW_DAYS)

    return {
      configured: true,
      appEnv,
      fetchedAt: new Date(fetchedAt).toISOString(),
      truncated,
      mrr: computeMrr(live),
      byStatus: countByStatus(live),
      byPlan: countByPlan(live, planFor),
      trialsEnding: {
        days: TRIAL_WINDOW_DAYS,
        count: trials.length,
        items: trials
          .sort((a, b) => (a.trialEnd ?? 0) - (b.trialEnd ?? 0))
          .slice(0, 50)
          .map((s) => ({
            id: s.id,
            customerId: s.customerId,
            plan: s.items[0] ? planFor(s.items[0].priceId) : 'unknown',
            trialEnd: new Date((s.trialEnd ?? 0) * 1000).toISOString(),
          })),
      },
      churn: {
        startDate: range.startDate,
        endDate: range.endDate,
        canceled: canceled.length,
        activeNow,
        activeAtStart: activeNow + canceled.length,
        rate: churnRate(canceled.length, activeNow),
      },
      monthly: monthlyNewVsCanceled(subscriptions, MOVEMENT_MONTHS),
      cohorts,
    }
  }
}
