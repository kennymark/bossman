/**
 * The plan catalogue, shared by the server and the browser.
 *
 * Client-safe: no AdonisJS imports (see `agent.md`). This is a port of how the product
 * (togetha-v2) resolves an org's `planId`: `app/enum/sub_plan.ts` maps the id to a name
 * such as `standard_monthly`, whose prefix indexes `plansFeatureList`.
 */
import { plansFeatureList } from './subscription.js'

export type FeatureValue = number | boolean
export type FeatureMap = Record<string, FeatureValue>

/** Port of the product's `SubPlansReversed` (`subscription_plans.id` → plan name). */
export const PLAN_ID_TO_NAME: Readonly<Record<number, string>> = {
  1: 'standard_monthly',
  2: 'standard_yearly',
  3: 'essential_monthly',
  4: 'essential_yearly',
  5: 'premium_monthly',
  6: 'premium_yearly',
}

export type PlanTier = keyof typeof plansFeatureList
export const PLAN_TIERS = Object.keys(plansFeatureList) as PlanTier[]

export type FeatureType = 'number' | 'boolean'

export interface FeatureDefinition {
  key: string
  label: string
  type: FeatureType
  /** Unit shown after a numeric value, e.g. `MB`. */
  unit?: string
  description: string
}

/**
 * Every feature key the product's plans know about, in display order.
 *
 * This is the allow-list for feature flag updates: a key not listed here is dropped by
 * the validator, so an operator cannot invent a flag the product would silently ignore
 * (or worse, act on).
 */
export const FEATURE_DEFINITIONS: readonly FeatureDefinition[] = [
  {
    key: 'tenantLimit',
    label: 'Tenancy limit',
    type: 'number',
    description: 'Maximum non-archived leases.',
  },
  {
    key: 'propertyLimit',
    label: 'Property limit',
    type: 'number',
    description: 'Maximum properties. Only enforced on custom plans.',
  },
  {
    key: 'storageLimit',
    label: 'Storage limit',
    type: 'number',
    unit: 'MB',
    description: 'Total size of uploaded files.',
  },
  {
    key: 'teamSizeLimit',
    label: 'Team size limit',
    type: 'number',
    description: 'Team members the owner may invite.',
  },
  {
    key: 'eSignDocsLimit',
    label: 'E-sign documents',
    type: 'number',
    unit: '/ month',
    description: 'E-signed leases created per calendar month.',
  },
  {
    key: 'aiInvocationLimit',
    label: 'AI invocations',
    type: 'number',
    unit: '/ month',
    description: 'Togetha AI calls per calendar month.',
  },
  {
    key: 'customTemplatesLimit',
    label: 'Custom templates',
    type: 'number',
    description: 'Custom document templates.',
  },
  {
    key: 'activityLogRetention',
    label: 'Activity log retention',
    type: 'number',
    unit: 'days',
    description: 'How long activity is kept.',
  },
  {
    key: 'automatedEmail',
    label: 'Automated emails',
    type: 'boolean',
    description: 'Scheduled reminder and digest emails.',
  },
  { key: 'eLease', label: 'E-lease', type: 'boolean', description: 'Electronic lease creation.' },
  { key: 'togethaAI', label: 'Togetha AI', type: 'boolean', description: 'AI features.' },
  {
    key: 'marketing',
    label: 'Marketing',
    type: 'boolean',
    description: 'Listing syndication (Rightmove / Zoopla).',
  },
  {
    key: 'prioritySupport',
    label: 'Priority support',
    type: 'boolean',
    description: 'Priority support queue.',
  },
  {
    key: 'depositProtection',
    label: 'Deposit protection',
    type: 'boolean',
    description: 'Deposit protection integration.',
  },
  {
    key: 'advancedReporting',
    label: 'Advanced reporting',
    type: 'boolean',
    description: 'Advanced reports.',
  },
]

export const FEATURE_KEYS: readonly string[] = FEATURE_DEFINITIONS.map((d) => d.key)

export function featureDefinition(key: string): FeatureDefinition | undefined {
  return FEATURE_DEFINITIONS.find((d) => d.key === key)
}

/** `standard_monthly` → `standard`; `free_trial` stays as is, like the product. */
export function planTierFromName(planName: string | null | undefined): PlanTier | null {
  if (!planName) return null
  const tier = planName === 'free_trial' ? planName : planName.split('_')[0]
  return tier in plansFeatureList ? (tier as PlanTier) : null
}

/**
 * The catalogue features for a tier, copied so callers can merge without mutating the
 * shared table. Falls back to `standard`, which is what the product does for an
 * unknown or missing plan.
 */
export function planCatalogueFeatures(tier: PlanTier | null | undefined): FeatureMap {
  const list = (tier && plansFeatureList[tier]) || plansFeatureList.standard
  return { ...(list as FeatureMap) }
}

export interface PlanCatalogueEntry {
  tier: PlanTier
  /** `subscription_plans.id` values that resolve to this tier. */
  planIds: number[]
  planNames: string[]
  features: FeatureMap
}

/** The full catalogue, one entry per tier, for the plans endpoint and the UI. */
export function planCatalogue(): PlanCatalogueEntry[] {
  return PLAN_TIERS.map((tier) => {
    const ids = Object.entries(PLAN_ID_TO_NAME)
      .filter(([, name]) => planTierFromName(name) === tier)
      .map(([id]) => Number(id))
    return {
      tier,
      planIds: ids,
      planNames: ids.map((id) => PLAN_ID_TO_NAME[id]),
      features: planCatalogueFeatures(tier),
    }
  })
}
