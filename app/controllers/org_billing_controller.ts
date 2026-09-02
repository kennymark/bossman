import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

import Org from '#models/org'
import { recordAdminAction } from '#services/admin_audit_service'
import PlanService from '#services/plan_service'
import StripeService from '#services/stripe_service'
import { CONFIRMATION_PHRASES, confirmationMatches, reasonIsValid } from '#utils/confirmation'
import { featureDiff, mergeFeatures } from '#utils/plan_features'
import { resetFeatureFlagsValidator, updateFeatureFlagsValidator } from '#validators/billing'

import { FEATURE_DEFINITIONS, PLAN_ID_TO_NAME, planCatalogue } from '../data/plans.js'

/**
 * Billing and plan features for one org.
 *
 * Reads go to Stripe and the customer database for `request.appEnv()`. The two writes
 * (feature flag update and reset) change `orgs.custom_plan_features`, which is exactly
 * how the product represents a custom plan, so they are treated as customer-affecting:
 * a reason is required, production needs a god admin, a reset is typed-confirmed, and
 * every write lands in `admin_actions` with the before/after feature maps.
 */
export default class OrgBillingController {
  /** The plan catalogue: every tier, its feature list, and the plan ids that map to it. */
  async plans({ response }: HttpContext) {
    return response.ok({
      plans: planCatalogue(),
      features: FEATURE_DEFINITIONS,
      planIds: PLAN_ID_TO_NAME,
    })
  }

  async subscription({ request, params, response }: HttpContext) {
    const appEnv = request.appEnv()
    const org = await this.findOrg(params.orgId, appEnv)
    if (!org) return response.notFound({ error: 'Organisation not found' })

    try {
      const subscription = await StripeService.getSubscriptionSummary(org.subscriptionId, appEnv)
      return response.ok({
        subscription,
        customerId: org.paymentCustomerId ?? null,
        hasActiveSubscription: Boolean(org.hasActiveSubscription),
      })
    } catch (err) {
      logger.error({ err, orgId: org.id, appEnv }, 'Could not read subscription from Stripe')
      return response.status(502).send({ error: 'Could not read the subscription from Stripe.' })
    }
  }

  async invoices({ request, params, response }: HttpContext) {
    const appEnv = request.appEnv()
    const org = await this.findOrg(params.orgId, appEnv)
    if (!org) return response.notFound({ error: 'Organisation not found' })

    if (!org.paymentCustomerId) {
      return response.ok({ configured: false, data: [], upcoming: null })
    }

    try {
      const [data, upcoming] = await Promise.all([
        StripeService.listInvoices(org.paymentCustomerId, 12),
        StripeService.getUpcomingInvoice(org.paymentCustomerId, org.subscriptionId),
      ])
      return response.ok({ configured: true, data, upcoming })
    } catch (err) {
      logger.error({ err, orgId: org.id, appEnv }, 'Could not read invoices from Stripe')
      return response.status(502).send({ error: 'Could not read invoices from Stripe.' })
    }
  }

  /** Effective plan features plus live usage against each enforced limit. */
  async plan({ request, params, response }: HttpContext) {
    const appEnv = request.appEnv()
    const org = await this.findOrg(params.orgId, appEnv)
    if (!org) return response.notFound({ error: 'Organisation not found' })

    return response.ok(await PlanService.overview(org, appEnv))
  }

  async featureFlags({ request, params, response }: HttpContext) {
    const org = await this.findOrg(params.orgId, request.appEnv())
    if (!org) return response.notFound({ error: 'Organisation not found' })

    return response.ok(this.featureFlagsPayload(org))
  }

  /**
   * Overrides one or more features.
   *
   * The new value set is the org's *effective* features with the overrides applied, so
   * an org moving off a plan keeps every default it had; the product does not merge
   * `customPlanFeatures` with the plan, it replaces it.
   */
  async updateFeatureFlags(ctx: HttpContext) {
    const { request, params, response, auth } = ctx
    /** Validated before anything is read: a bad body should never cost a customer-DB query. */
    const { features, reason } = await request.validateUsing(updateFeatureFlagsValidator)

    if (!reasonIsValid(reason)) {
      return response.badRequest({ error: 'A reason of at least 8 characters is required.' })
    }
    if (Object.keys(features).length === 0) {
      return response.badRequest({ error: 'Provide at least one feature to change.' })
    }

    const appEnv = request.appEnv()
    if (appEnv === 'prod' && !auth.user?.isGodAdmin) {
      return response.forbidden({
        error: 'Only a god admin can change feature flags in production.',
      })
    }

    const org = await this.findOrg(params.orgId, appEnv)
    if (!org) return response.notFound({ error: 'Organisation not found' })

    const before = PlanService.effectiveFeatures(org)
    const after = mergeFeatures(before.features, features)
    const changes = featureDiff(before.features, after)

    if (Object.keys(changes).length === 0) {
      return response.ok({ ...this.featureFlagsPayload(org), changed: false })
    }

    org.customPlanFeatures = after
    await org.save()

    await recordAdminAction(ctx, {
      action: 'org.feature_flags_update',
      appEnv,
      targetType: 'Org',
      targetId: org.id,
      targetLabel: this.orgLabel(org),
      reason,
      metadata: {
        sourceBefore: before.source,
        planName: before.basePlanName,
        before: before.features,
        after,
        changes,
      },
    })

    return response.ok({ ...this.featureFlagsPayload(org), changed: true, changes })
  }

  /** Drops every override so the org is back on its plan's catalogue features. */
  async resetFeatureFlags(ctx: HttpContext) {
    const { request, params, response, auth } = ctx
    const { reason, confirmation } = await request.validateUsing(resetFeatureFlagsValidator)

    if (!reasonIsValid(reason)) {
      return response.badRequest({ error: 'A reason of at least 8 characters is required.' })
    }

    const appEnv = request.appEnv()
    if (appEnv === 'prod' && !auth.user?.isGodAdmin) {
      return response.forbidden({
        error: 'Only a god admin can reset feature flags in production.',
      })
    }

    const org = await this.findOrg(params.orgId, appEnv)
    if (!org) return response.notFound({ error: 'Organisation not found' })

    /** The page shows the clean name; the raw name is accepted too so neither spelling traps an operator. */
    const phrase = CONFIRMATION_PHRASES['org.feature_flags_reset']
    const expected = phrase(this.orgLabel(org))
    const accepted = [expected, phrase(org.name ?? '')].some((candidate) =>
      confirmationMatches(confirmation, candidate),
    )
    if (!accepted) {
      return response.badRequest({
        error: `Type "${expected}" to confirm the reset.`,
        type: 'confirmation',
      })
    }

    const before = PlanService.effectiveFeatures(org)
    if (before.source !== 'custom') {
      return response.badRequest({ error: 'This org has no custom feature flags to reset.' })
    }

    org.customPlanFeatures = null as unknown as Org['customPlanFeatures']
    await org.save()

    const after = PlanService.effectiveFeatures(org)

    await recordAdminAction(ctx, {
      action: 'org.feature_flags_reset',
      appEnv,
      targetType: 'Org',
      targetId: org.id,
      targetLabel: this.orgLabel(org),
      reason,
      metadata: {
        planName: after.basePlanName,
        before: before.features,
        after: after.features,
        changes: featureDiff(before.features, after.features),
      },
    })

    return response.ok({ ...this.featureFlagsPayload(org), changed: true })
  }

  private findOrg(orgId: string, appEnv: 'dev' | 'prod') {
    return Org.query({ connection: appEnv }).where('id', String(orgId)).first()
  }

  private orgLabel(org: Org) {
    return org.cleanName || org.name || org.id
  }

  private featureFlagsPayload(org: Org) {
    const plan = PlanService.effectiveFeatures(org)
    return {
      orgId: org.id,
      planId: org.planId ?? null,
      ...plan,
      catalogue: FEATURE_DEFINITIONS,
      confirmationPhrase: CONFIRMATION_PHRASES['org.feature_flags_reset'](this.orgLabel(org)),
    }
  }
}
