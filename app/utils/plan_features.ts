/**
 * Pure plan-feature logic: what an org's effective features are, how an override
 * merges onto them, and how close a usage figure is to its limit.
 *
 * Client-safe (no AdonisJS imports) so the billing and feature-flag tabs render the
 * same answer the server computes. Mirrors `Org.featureList` / `Org.planName` in the
 * product: `customPlanFeatures` overrides everything; otherwise the plan id resolves to
 * a catalogue tier, falling back to `standard`.
 */
import {
  type FeatureMap,
  type FeatureValue,
  PLAN_ID_TO_NAME,
  type PlanTier,
  planCatalogueFeatures,
  planTierFromName,
} from '../data/plans.js'

export type { FeatureMap, FeatureValue } from '../data/plans.js'

export type FeatureSource = 'plan' | 'custom'

export interface PlanFeatureInput {
  planId?: number | string | null
  customPlanFeatures?: unknown
}

export interface EffectiveFeatures {
  /** `custom` when overrides exist, otherwise the plan name (`standard_monthly`). */
  planName: string
  /** The plan the id points at, regardless of overrides; null when there is no plan. */
  basePlanName: string | null
  tier: PlanTier
  source: FeatureSource
  /** What the product will actually enforce. */
  features: FeatureMap
  /** What the plan alone would give, for the "default" column and for resets. */
  planDefaults: FeatureMap
}

export function isFeatureValue(value: unknown): value is FeatureValue {
  return typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))
}

/**
 * Keeps only entries the product could act on.
 *
 * `customPlanFeatures` is a free JSON column; anything that is not a finite number or a
 * boolean is noise for limit checks and would be a nuisance to render.
 */
export function sanitiseFeatureMap(input: unknown): FeatureMap {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  const out: FeatureMap = {}
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (isFeatureValue(value)) out[key] = value
  }
  return out
}

export function planDefaults(planId: number | string | null | undefined): {
  basePlanName: string | null
  tier: PlanTier
  defaults: FeatureMap
} {
  const id = planId === null || planId === undefined || planId === '' ? null : Number(planId)
  const basePlanName = id !== null && Number.isFinite(id) ? (PLAN_ID_TO_NAME[id] ?? null) : null
  const tier = planTierFromName(basePlanName) ?? 'standard'
  return { basePlanName, tier, defaults: planCatalogueFeatures(tier) }
}

/** The product treats any non-null `customPlanFeatures` — even `{}` — as a custom plan. */
export function hasCustomPlan(customPlanFeatures: unknown): boolean {
  return (
    customPlanFeatures !== null &&
    customPlanFeatures !== undefined &&
    typeof customPlanFeatures === 'object'
  )
}

export function effectiveFeatures(org: PlanFeatureInput): EffectiveFeatures {
  const { basePlanName, tier, defaults } = planDefaults(org.planId)

  if (hasCustomPlan(org.customPlanFeatures)) {
    return {
      planName: 'custom',
      basePlanName,
      tier,
      source: 'custom',
      features: sanitiseFeatureMap(org.customPlanFeatures),
      planDefaults: defaults,
    }
  }

  return {
    planName: basePlanName ?? tier,
    basePlanName,
    tier,
    source: 'plan',
    features: { ...defaults },
    planDefaults: defaults,
  }
}

/** Overrides win; the base is copied, never mutated. */
export function mergeFeatures(base: FeatureMap, overrides: unknown): FeatureMap {
  return { ...base, ...sanitiseFeatureMap(overrides) }
}

export type FeatureChange = { from: FeatureValue | null; to: FeatureValue | null }

/** Only the keys whose value changed, for the audit trail. */
export function featureDiff(before: FeatureMap, after: FeatureMap): Record<string, FeatureChange> {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  const diff: Record<string, FeatureChange> = {}
  for (const key of keys) {
    const from = before[key] ?? null
    const to = after[key] ?? null
    if (from !== to) diff[key] = { from, to }
  }
  return diff
}

export type LimitStatus = 'ok' | 'near' | 'over' | 'unknown'

/** Usage at or above this share of the limit is "near". */
export const NEAR_LIMIT_RATIO = 0.8

export interface LimitReading {
  used: number | null
  limit: number | null
  /** Rounded to one decimal; null when either side is unknown. */
  percent: number | null
  status: LimitStatus
}

/**
 * Where a usage figure sits against its limit.
 *
 * The product blocks the *next* action once `used >= limit`, so reaching the limit is
 * reported as `over` — from the customer's point of view they are already blocked.
 */
export function limitStatus(
  used: number | null | undefined,
  limit: FeatureValue | null | undefined,
): LimitReading {
  const limitNumber = typeof limit === 'number' && Number.isFinite(limit) ? limit : null
  const usedNumber = typeof used === 'number' && Number.isFinite(used) ? used : null

  if (usedNumber === null || limitNumber === null) {
    return { used: usedNumber, limit: limitNumber, percent: null, status: 'unknown' }
  }

  if (limitNumber <= 0) {
    const over = usedNumber > 0
    return {
      used: usedNumber,
      limit: limitNumber,
      percent: over ? 100 : 0,
      status: over ? 'over' : 'ok',
    }
  }

  const percent = Math.round((usedNumber / limitNumber) * 1000) / 10
  const status: LimitStatus =
    percent >= 100 ? 'over' : percent >= NEAR_LIMIT_RATIO * 100 ? 'near' : 'ok'

  return { used: usedNumber, limit: limitNumber, percent, status }
}

/** Usage figures the plan service collects; null when a metric could not be read. */
export interface PlanUsage {
  leases: number | null
  storageMb: number | null
  teamMembers: number | null
  properties: number | null
  eSignDocsThisMonth: number | null
}

export interface UsageLimitDefinition {
  key: string
  featureKey: string
  usageKey: keyof PlanUsage
  label: string
  unit?: string
}

/** Which usage figure each enforced limit is measured against. */
export const USAGE_LIMITS: readonly UsageLimitDefinition[] = [
  { key: 'tenants', featureKey: 'tenantLimit', usageKey: 'leases', label: 'Tenancies' },
  {
    key: 'storage',
    featureKey: 'storageLimit',
    usageKey: 'storageMb',
    label: 'Storage',
    unit: 'MB',
  },
  { key: 'team', featureKey: 'teamSizeLimit', usageKey: 'teamMembers', label: 'Team members' },
  { key: 'properties', featureKey: 'propertyLimit', usageKey: 'properties', label: 'Properties' },
  {
    key: 'esign',
    featureKey: 'eSignDocsLimit',
    usageKey: 'eSignDocsThisMonth',
    label: 'E-sign documents this month',
  },
]

export interface LimitRow extends LimitReading {
  key: string
  featureKey: string
  label: string
  unit?: string
}

export function limitRows(features: FeatureMap, usage: PlanUsage): LimitRow[] {
  return USAGE_LIMITS.map((def) => ({
    key: def.key,
    featureKey: def.featureKey,
    label: def.label,
    unit: def.unit,
    ...limitStatus(usage[def.usageKey], features[def.featureKey]),
  }))
}
