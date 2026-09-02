import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

import type Org from '#models/org'
import type { AppEnv } from '#types/env'
import {
  type EffectiveFeatures,
  effectiveFeatures,
  type LimitRow,
  limitRows,
  type PlanUsage,
} from '#utils/plan_features'

export interface PlanOverview {
  plan: EffectiveFeatures
  usage: PlanUsage
  limits: LimitRow[]
}

const BYTES_PER_MB = 1024 * 1024

/**
 * Reads an org's plan and how much of it is used.
 *
 * The usage queries mirror the product's `PlanLimitService` so the numbers here are the
 * ones the customer is actually measured against. Everything is read-only, and each
 * metric fails independently: a missing table on one environment turns into `null`
 * for that metric rather than taking the whole billing tab down.
 */
export default class PlanService {
  static effectiveFeatures(org: Org): EffectiveFeatures {
    return effectiveFeatures({ planId: org.planId, customPlanFeatures: org.customPlanFeatures })
  }

  static async usage(org: Org, appEnv: AppEnv): Promise<PlanUsage> {
    const connection = db.connection(appEnv)

    const metric = async (name: keyof PlanUsage, read: () => Promise<number>) => {
      try {
        return await read()
      } catch (err) {
        logger.warn({ err, orgId: org.id, appEnv, metric: name }, 'Plan usage metric unavailable')
        return null
      }
    }

    const count = async (query: ReturnType<typeof connection.from>) => {
      const row = await query.count('* as total').first()
      return Number(row?.total ?? 0)
    }

    const monthStart = DateTime.utc().startOf('month').toJSDate()
    const monthEnd = DateTime.utc().endOf('month').toJSDate()

    const [leases, storageMb, teamMembers, properties, eSignDocsThisMonth] = await Promise.all([
      /** `tenancyLimitCheck`: non-archived leases. */
      metric('leases', () =>
        count(connection.from('leases').where('org_id', org.id).whereNull('archived_at')),
      ),
      /** `storageLimitCheck`: `sum(file_uploads.size)` in bytes, compared in MB. */
      metric('storageMb', async () => {
        const row = await connection
          .from('file_uploads')
          .where('org_id', org.id)
          .sum('size as total')
          .first()
        const bytes = Number(row?.total ?? 0)
        return Math.round((bytes / BYTES_PER_MB) * 100) / 100
      }),
      /** `teamSizeLimitCheck`: team members hosted by the owner, found via the creator email. */
      metric('teamMembers', async () => {
        const owner = await connection
          .from('users')
          .where('email', org.creatorEmail)
          .select('id')
          .first()
        if (!owner) return 0
        return count(connection.from('team_members').where('host_id', owner.id))
      }),
      /** `propertyLimitCheck`. */
      metric('properties', () => count(connection.from('properties').where('org_id', org.id))),
      /** `eSignLimit`: leases not created manually, this calendar month. */
      metric('eSignDocsThisMonth', () =>
        count(
          connection
            .from('leases')
            .where('org_id', org.id)
            .where('is_manually_created', false)
            .whereBetween('created_at', [monthStart, monthEnd]),
        ),
      ),
    ])

    return { leases, storageMb, teamMembers, properties, eSignDocsThisMonth }
  }

  static async overview(org: Org, appEnv: AppEnv): Promise<PlanOverview> {
    const plan = PlanService.effectiveFeatures(org)
    const usage = await PlanService.usage(org, appEnv)
    return { plan, usage, limits: limitRows(plan.features, usage) }
  }
}
