import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

import AccountBan from '#models/account_ban'
import AdminAction from '#models/admin_action'
import BackupRun from '#models/backup_run'
import DeleteAccountRequest from '#models/delete_account_request'
import Org from '#models/org'
import TeamMember from '#models/team_member'
import User from '#models/user'
import type { AppEnv } from '#types/env'

/* ------------------------------------------------------------------------------------ */
/* Stats                                                                                */
/* ------------------------------------------------------------------------------------ */

export interface SignupWindow {
  today: number
  last7Days: number
  last30Days: number
}

export interface DashboardStats {
  signups: { users: SignupWindow; orgs: SignupWindow }
  leases: { active: number; startingNext7Days: number; endingNext30Days: number }
  payments: {
    /** Failed, unpaid or overdue with a due date in the last 7 days. */
    problemLast7Days: {
      count: number
      byCurrency: { currency: string; count: number; total: number }[]
    }
  }
  maintenance: { open: number; overdue: number }
  compliance: { expiringNext30Days: number }
  growth: {
    usersByDay: { date: string; count: number }[]
    tenanciesByDay: { date: string; count: number }[]
    activityByWeek: { date: string; count: number }[]
  }
  /** Sections that could not be read; the client shows them as unavailable. */
  degraded: string[]
}

const EMPTY_WINDOW: SignupWindow = { today: 0, last7Days: 0, last30Days: 0 }

const toDateStr = (d: string | Date): string =>
  typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10)

/**
 * Runs every reader and keeps the page up when one of them fails.
 *
 * The customer schema is not this app's to control: a column renamed in Togetha, or a
 * table absent from the dev copy, must show up as one missing number and a warning,
 * not a 500 for the whole morning check.
 */
async function settle<T extends Record<string, () => Promise<unknown>>>(
  appEnv: AppEnv,
  readers: T,
): Promise<{
  values: { [K in keyof T]: Awaited<ReturnType<T[K]>> | undefined }
  failed: string[]
}> {
  const keys = Object.keys(readers) as (keyof T)[]
  const results = await Promise.allSettled(keys.map((key) => readers[key]()))
  const values = {} as { [K in keyof T]: Awaited<ReturnType<T[K]>> | undefined }
  const failed: string[] = []
  results.forEach((result, index) => {
    const key = keys[index]
    if (result.status === 'fulfilled') {
      values[key] = result.value as Awaited<ReturnType<T[typeof key]>>
    } else {
      failed.push(String(key))
      logger.warn({ err: result.reason, appEnv, section: key }, 'Dashboard section unavailable')
    }
  })
  return { values, failed }
}

function signupWindow(rows: unknown[]): SignupWindow {
  const row = rows[0] as Partial<SignupWindow> | undefined
  return {
    today: Number(row?.today ?? 0),
    last7Days: Number(row?.last7Days ?? 0),
    last30Days: Number(row?.last30Days ?? 0),
  }
}

export class DashboardService {
  static async stats(appEnv: AppEnv): Promise<DashboardStats> {
    const conn = db.connection(appEnv)
    const signupSql = (table: string, extraWhere = '') =>
      `SELECT
         COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE)::int AS "today",
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS "last7Days",
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS "last30Days"
       FROM ${table} ${extraWhere}`

    const { values, failed } = await settle(appEnv, {
      users: async () => signupWindow((await conn.rawQuery(signupSql('users'))).rows),
      orgs: async () =>
        signupWindow(
          (await conn.rawQuery(signupSql('orgs', 'WHERE is_test_account = false'))).rows,
        ),
      leases: async () => {
        const result = await conn.rawQuery(
          `SELECT
             COUNT(*) FILTER (WHERE status = 'active' AND archived_at IS NULL)::int AS "active",
             COUNT(*) FILTER (WHERE start_date >= NOW() AND start_date < NOW() + INTERVAL '7 days')::int AS "startingNext7Days",
             COUNT(*) FILTER (WHERE status = 'active' AND end_date >= NOW() AND end_date < NOW() + INTERVAL '30 days')::int AS "endingNext30Days"
           FROM leases`,
        )
        const row = result.rows[0] ?? {}
        return {
          active: Number(row.active ?? 0),
          startingNext7Days: Number(row.startingNext7Days ?? 0),
          endingNext30Days: Number(row.endingNext30Days ?? 0),
        }
      },
      payments: async () => {
        const result = await conn.rawQuery(
          `SELECT COALESCE(currency_code, 'GBP') AS currency,
                  COUNT(*)::int AS count,
                  COALESCE(SUM(amount_due - COALESCE(amount_paid, 0)), 0)::float AS total
           FROM payments
           WHERE status IN ('failed', 'unpaid', 'overdue')
             AND due_date >= NOW() - INTERVAL '7 days'
             AND due_date <= NOW()
           GROUP BY 1
           ORDER BY 2 DESC`,
        )
        const byCurrency = (
          result.rows as { currency: string; count: number; total: number }[]
        ).map((r) => ({
          currency: String(r.currency).toUpperCase(),
          count: Number(r.count),
          total: Number(r.total),
        }))
        return { count: byCurrency.reduce((sum, r) => sum + r.count, 0), byCurrency }
      },
      maintenance: async () => {
        const result = await conn.rawQuery(
          `SELECT
             COUNT(*) FILTER (WHERE status IN ('todo', 'in_progress'))::int AS "open",
             COUNT(*) FILTER (WHERE status IN ('todo', 'in_progress') AND due_date < NOW())::int AS "overdue"
           FROM maintenance_requests`,
        )
        const row = result.rows[0] ?? {}
        return { open: Number(row.open ?? 0), overdue: Number(row.overdue ?? 0) }
      },
      compliance: async () => {
        const result = await conn.rawQuery(
          `SELECT COUNT(*)::int AS total FROM documents
           WHERE is_compliance_document = true
             AND expires_at >= NOW() AND expires_at < NOW() + INTERVAL '30 days'`,
        )
        return { expiringNext30Days: Number(result.rows[0]?.total ?? 0) }
      },
      usersByDay: async () => {
        const result = await conn.rawQuery(
          `SELECT created_at::date AS day, COUNT(*)::int AS count
           FROM users WHERE created_at >= CURRENT_DATE - 7
           GROUP BY 1 ORDER BY 1`,
        )
        return (result.rows as { day: string | Date; count: number }[]).map((r) => ({
          date: toDateStr(r.day),
          count: Number(r.count),
        }))
      },
      tenanciesByDay: async () => {
        const result = await conn.rawQuery(
          `SELECT start_date::date AS day, COUNT(*)::int AS count
           FROM leases WHERE start_date >= CURRENT_DATE - 7
           GROUP BY 1 ORDER BY 1`,
        )
        return (result.rows as { day: string | Date; count: number }[]).map((r) => ({
          date: toDateStr(r.day),
          count: Number(r.count),
        }))
      },
      activityByWeek: async () => {
        const result = await conn.rawQuery(
          `SELECT date_trunc('week', created_at)::date AS week_start, COUNT(*)::int AS count
           FROM activities
           WHERE created_at >= (NOW() - INTERVAL '10 weeks')
           GROUP BY 1 ORDER BY 1`,
        )
        return (result.rows as { week_start: string | Date; count: number }[]).map((r) => ({
          date: toDateStr(r.week_start),
          count: Number(r.count),
        }))
      },
    })

    return {
      signups: { users: values.users ?? EMPTY_WINDOW, orgs: values.orgs ?? EMPTY_WINDOW },
      leases: values.leases ?? { active: 0, startingNext7Days: 0, endingNext30Days: 0 },
      payments: { problemLast7Days: values.payments ?? { count: 0, byCurrency: [] } },
      maintenance: values.maintenance ?? { open: 0, overdue: 0 },
      compliance: values.compliance ?? { expiringNext30Days: 0 },
      growth: {
        usersByDay: values.usersByDay ?? [],
        tenanciesByDay: values.tenanciesByDay ?? [],
        activityByWeek: values.activityByWeek ?? [],
      },
      degraded: failed,
    }
  }

  /* ---------------------------------------------------------------------------------- */
  /* Attention                                                                          */
  /* ---------------------------------------------------------------------------------- */

  static async attention(appEnv: AppEnv): Promise<AttentionResult> {
    const now = DateTime.now()
    const inSevenDays = now.plus({ days: 7 })

    const { values, failed } = await settle(appEnv, {
      prodGrants: async (): Promise<AttentionItem[]> => {
        const users = await User.query()
          .where('enableProdAccess', true)
          .whereNotNull('prodAccessExpiresAt')
          .where('prodAccessExpiresAt', '>', now.toJSDate())
          .where('prodAccessExpiresAt', '<=', inSevenDays.toJSDate())
          .orderBy('prodAccessExpiresAt', 'asc')
          .select('id', 'email', 'prodAccessExpiresAt')
        return users.map((user) => ({
          kind: 'prod_access_expiring',
          severity: 'warning',
          title: `Production access expires ${relative(user.prodAccessExpiresAt!)}`,
          detail: user.email,
          href: '/teams',
          at: user.prodAccessExpiresAt!.toISO(),
        }))
      },
      dataAccess: async (): Promise<AttentionItem[]> => {
        const members = await TeamMember.query()
          .whereNotNull('dataAccessExpiresAt')
          .where('dataAccessExpiresAt', '>', now.toJSDate())
          .where('dataAccessExpiresAt', '<=', inSevenDays.toJSDate())
          .preload('user', (q) => q.select('id', 'email'))
          .orderBy('dataAccessExpiresAt', 'asc')
        return members.map((member) => ({
          kind: 'data_access_expiring',
          severity: 'info',
          title: `Data access expires ${relative(member.dataAccessExpiresAt!)}`,
          detail: member.user?.email ?? member.userId,
          href: '/teams',
          at: member.dataAccessExpiresAt!.toISO(),
        }))
      },
      bans: async (): Promise<AttentionItem[]> => {
        const bans = await AccountBan.query({ connection: appEnv })
          .where('isBanActive', true)
          .whereNull('removedAt')
          .where((q) => {
            q.where((expiring) => {
              expiring
                .whereNotNull('expiresAt')
                .where('expiresAt', '>', now.toJSDate())
                .where('expiresAt', '<=', inSevenDays.toJSDate())
            }).orWhere('banStartsAt', '>', now.toJSDate())
          })
          .orderBy('banStartsAt', 'asc')
          .limit(50)
        return bans.map((ban) => {
          const startsLater = ban.banStartsAt && ban.banStartsAt > now
          return {
            kind: startsLater ? 'ban_scheduled' : 'ban_expiring',
            severity: startsLater ? 'warning' : 'info',
            title: startsLater
              ? `Account ban starts ${relative(ban.banStartsAt)}`
              : `Account ban lifts ${relative(ban.expiresAt!)}`,
            detail: ban.reason || `Org ${ban.orgId}`,
            href: `/orgs/${ban.orgId}`,
            at: (startsLater ? ban.banStartsAt : ban.expiresAt!).toISO(),
          }
        })
      },
      deleteRequests: async (): Promise<AttentionItem[]> => {
        const requests = await DeleteAccountRequest.query({ connection: appEnv })
          .where('isSuccessful', false)
          .where('expiresAt', '>', now.toJSDate())
          .orderBy('expiresAt', 'asc')
          .limit(50)
        const orgIds = [...new Set(requests.map((r) => r.orgId).filter(Boolean))]
        const orgs = orgIds.length
          ? await Org.query({ connection: appEnv }).whereIn('id', orgIds).select('id', 'name')
          : []
        const names = new Map(orgs.map((org) => [org.id, org.cleanName || org.name]))
        return requests.map((request) => ({
          kind: 'delete_request_pending',
          severity: 'critical',
          title: 'Account deletion requested',
          detail: `${names.get(request.orgId) ?? request.orgId} — expires ${relative(request.expiresAt)}`,
          href: `/orgs/${request.orgId}`,
          at: request.expiresAt.toISO(),
        }))
      },
      backups: async (): Promise<AttentionItem[]> => {
        const [lastSuccess, lastFailed] = await Promise.all([
          BackupRun.query()
            .where('appEnv', appEnv)
            .where('status', 'success')
            .orderBy('startedAt', 'desc')
            .first(),
          BackupRun.query()
            .where('appEnv', appEnv)
            .where('status', 'failed')
            .orderBy('startedAt', 'desc')
            .first(),
        ])
        const items: AttentionItem[] = []
        const ageHours = lastSuccess ? now.diff(lastSuccess.startedAt, 'hours').hours : null
        if (ageHours === null) {
          items.push({
            kind: 'backup_missing',
            severity: 'warning',
            title: 'No successful backup on record',
            detail: `No completed backup for ${appEnv} yet.`,
            href: '/db-backups',
            at: null,
          })
        } else if (ageHours > 12) {
          items.push({
            kind: 'backup_stale',
            severity: ageHours > 36 ? 'critical' : 'warning',
            title: `Last successful backup was ${Math.round(ageHours)}h ago`,
            detail: `Backups run every 6 hours; ${appEnv} is behind.`,
            href: '/db-backups',
            at: lastSuccess!.startedAt.toISO(),
          })
        }
        if (lastFailed && (!lastSuccess || lastFailed.startedAt > lastSuccess.startedAt)) {
          items.push({
            kind: 'backup_failed',
            severity: 'critical',
            title: `Last backup run failed ${relative(lastFailed.startedAt)}`,
            detail: lastFailed.error?.slice(0, 200) || 'No error recorded.',
            href: '/db-backups',
            at: lastFailed.startedAt.toISO(),
          })
        }
        return items
      },
      failedActions: async (): Promise<AttentionItem[]> => {
        const since = now.minus({ hours: 24 }).toJSDate()
        const actions = await AdminAction.query()
          .where('outcome', 'failed')
          .where('createdAt', '>=', since)
          .orderBy('createdAt', 'desc')
          .limit(20)
        if (actions.length === 0) return []
        const sample = actions
          .slice(0, 3)
          .map((a) => `${a.action}${a.actorEmail ? ` by ${a.actorEmail}` : ''}`)
          .join(', ')
        return [
          {
            kind: 'admin_actions_failed',
            severity: 'warning',
            title: `${actions.length} failed admin action${actions.length === 1 ? '' : 's'} in the last 24h`,
            detail: sample,
            href: '/audits?outcome=failed',
            at: actions[0].createdAt.toISO(),
          },
        ]
      },
    })

    const items = Object.values(values)
      .flatMap((list) => list ?? [])
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

    const counts = { total: items.length, critical: 0, warning: 0, info: 0 }
    for (const item of items) counts[item.severity] += 1

    return { items, counts, degraded: failed }
  }
}

export type AttentionSeverity = 'info' | 'warning' | 'critical'

export interface AttentionItem {
  kind: string
  severity: AttentionSeverity
  title: string
  detail: string
  href?: string
  at: string | null
}

export interface AttentionResult {
  items: AttentionItem[]
  counts: { total: number; critical: number; warning: number; info: number }
  degraded: string[]
}

const SEVERITY_ORDER: Record<AttentionSeverity, number> = { critical: 0, warning: 1, info: 2 }

function relative(date: DateTime): string {
  return date.toRelative({ base: DateTime.now() }) ?? date.toISODate() ?? ''
}
