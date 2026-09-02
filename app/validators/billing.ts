import vine from '@vinejs/vine'

import { confirmRule, reasonRule } from '#validators/destructive'

/**
 * Feature flag overrides.
 *
 * Only keys from the plan catalogue (`app/data/plans.ts`) are declared, and VineJS
 * drops anything else, so an operator cannot write a flag the product does not know.
 * Limits are counts, so they cannot be negative; a `0` is a valid "none allowed".
 */
const limit = () => vine.number().min(0).optional()
const flag = () => vine.boolean().optional()

export const featureFlagsSchema = vine.object({
  tenantLimit: limit(),
  propertyLimit: limit(),
  storageLimit: limit(),
  teamSizeLimit: limit(),
  eSignDocsLimit: limit(),
  aiInvocationLimit: limit(),
  customTemplatesLimit: limit(),
  activityLogRetention: limit(),
  automatedEmail: flag(),
  eLease: flag(),
  togethaAI: flag(),
  marketing: flag(),
  prioritySupport: flag(),
  depositProtection: flag(),
  advancedReporting: flag(),
})

export const updateFeatureFlagsValidator = vine.create(
  vine.object({
    features: featureFlagsSchema,
    reason: reasonRule,
  }),
)

export const resetFeatureFlagsValidator = vine.create(
  vine.object({
    reason: reasonRule,
    /** Retyped by the operator; checked against the org name in the controller. */
    confirmation: confirmRule,
  }),
)
