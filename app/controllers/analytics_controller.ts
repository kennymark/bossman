import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

import Activity from '#models/activity'
import Lease from '#models/lease'
import MaintenanceRequest from '#models/maintenance_request'
import Org from '#models/org'
import TogethaUser from '#models/togetha_user'

type DateRange = { startDate: string; endDate: string }

/** Only `YYYY-MM-DD` reaches a `::date` comparison; anything else falls back. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

/**
 * Bounds and shapes the reporting window.
 *
 * The values are bound parameters, so they were never injectable — but they went
 * unvalidated into `created_at::date >= ?`, so `?startDate=abc` came back as a 500
 * straight from the driver. An out-of-order range is swapped rather than rejected.
 */
function parseDateRange(request: HttpContext['request']): DateRange {
  const now = new Date()
  const defaultEnd = now.toISOString().slice(0, 10)
  const defaultStart = new Date(now)
  defaultStart.setMonth(defaultStart.getMonth() - 1)

  const rawStart = request.input('startDate', '')
  const rawEnd = request.input('endDate', '')

  let startDate = isValidIsoDate(rawStart) ? rawStart : defaultStart.toISOString().slice(0, 10)
  let endDate = isValidIsoDate(rawEnd) ? rawEnd : defaultEnd

  if (startDate > endDate) [startDate, endDate] = [endDate, startDate]

  return { startDate, endDate }
}

export default class AnalyticsController {
  async index({ inertia }: HttpContext) {
    return inertia.render('analytics/index', {})
  }

  /** Orgs stats and growth (never includes test accounts). */
  async orgsStats({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const { startDate, endDate } = parseDateRange(request)
    const conn = db.connection(appEnv)

    const [totalsResult, growthResult] = await Promise.all([
      conn.rawQuery(
        `SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE owner_role = 'landlord')::int AS landlords,
          COUNT(*) FILTER (WHERE owner_role = 'agency')::int AS agencies
        FROM orgs
        WHERE is_test_account = false
          AND created_at::date >= ?
          AND created_at::date <= ?`,
        [startDate, endDate],
      ),
      conn.rawQuery(
        `SELECT created_at::date AS day, COUNT(*)::int AS count
         FROM orgs
         WHERE is_test_account = false AND created_at::date >= ? AND created_at::date <= ?
         GROUP BY created_at::date ORDER BY day`,
        [startDate, endDate],
      ),
    ])

    const row = (totalsResult.rows as { total: number; landlords: number; agencies: number }[])[0]
    const totals = row
      ? {
          total: Number(row.total),
          landlords: Number(row.landlords),
          agencies: Number(row.agencies),
        }
      : { total: 0, landlords: 0, agencies: 0 }

    const toDateStr = (d: string | Date): string =>
      typeof d === 'string' ? d.slice(0, 10) : (d as Date).toISOString().slice(0, 10)
    const growth = (growthResult.rows as { day: string | Date; count: number }[]).map((r) => ({
      date: toDateStr(r.day),
      count: Number(r.count),
    }))

    return response.ok({
      total: totals.total,
      landlords: totals.landlords,
      agencies: totals.agencies,
      growth,
    })
  }

  /** Orgs created in a date range (for bar click; never includes test accounts). */
  async orgsEntities({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const startDate = request.input('startDate', '')
    const endDate = request.input('endDate', '')
    const page = Number(request.input('page', 1))
    const perPage = Math.min(Number(request.input('perPage', 20)) || 20, 100)
    if (!startDate || !endDate) {
      return response.badRequest({ error: 'startDate and endDate required' })
    }

    const orgs = await Org.query({ connection: appEnv })
      .where('isTestAccount', false)
      .whereRaw('created_at::date BETWEEN ? AND ?', [startDate, endDate])
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)

    return response.ok(orgs)
  }

  /** Togetha users stats and growth. */
  async usersStats({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const { startDate, endDate } = parseDateRange(request)
    const conn = db.connection(appEnv)

    const [totalsResult, growthResult] = await Promise.all([
      conn.rawQuery(
        `SELECT COUNT(*)::int AS total FROM users
         WHERE created_at::date >= ? AND created_at::date <= ?`,
        [startDate, endDate],
      ),
      conn.rawQuery(
        `SELECT created_at::date AS day, COUNT(*)::int AS count
         FROM users WHERE created_at::date >= ? AND created_at::date <= ?
         GROUP BY created_at::date ORDER BY day`,
        [startDate, endDate],
      ),
    ])
    const total = Number((totalsResult.rows as { total: number }[])[0]?.total ?? 0)
    const toDateStr = (d: string | Date): string =>
      typeof d === 'string' ? d.slice(0, 10) : (d as Date).toISOString().slice(0, 10)
    const growth = (growthResult.rows as { day: string | Date; count: number }[]).map((r) => ({
      date: toDateStr(r.day),
      count: Number(r.count),
    }))
    return response.ok({ total, growth })
  }

  async usersEntities({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const startDate = request.input('startDate', '')
    const endDate = request.input('endDate', '')
    const page = Number(request.input('page', 1))
    const perPage = Math.min(Number(request.input('perPage', 20)) || 20, 100)
    if (!startDate || !endDate)
      return response.badRequest({ error: 'startDate and endDate required' })

    const users = await TogethaUser.query({ connection: appEnv })
      .whereRaw('created_at::date BETWEEN ? AND ?', [startDate, endDate])
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)
    return response.ok(users)
  }

  /** Leases stats and growth (by created_at). */
  async leasesStats({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const { startDate, endDate } = parseDateRange(request)
    const conn = db.connection(appEnv)

    const [totalsResult, growthResult] = await Promise.all([
      conn.rawQuery(
        `SELECT COUNT(*)::int AS total FROM leases
         WHERE created_at::date >= ? AND created_at::date <= ?`,
        [startDate, endDate],
      ),
      conn.rawQuery(
        `SELECT created_at::date AS day, COUNT(*)::int AS count
         FROM leases WHERE created_at::date >= ? AND created_at::date <= ?
         GROUP BY created_at::date ORDER BY day`,
        [startDate, endDate],
      ),
    ])
    const total = Number((totalsResult.rows as { total: number }[])[0]?.total ?? 0)
    const toDateStr = (d: string | Date): string =>
      typeof d === 'string' ? d.slice(0, 10) : (d as Date).toISOString().slice(0, 10)
    const growth = (growthResult.rows as { day: string | Date; count: number }[]).map((r) => ({
      date: toDateStr(r.day),
      count: Number(r.count),
    }))
    return response.ok({ total, growth })
  }

  async leasesEntities({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const startDate = request.input('startDate', '')
    const endDate = request.input('endDate', '')
    const page = Number(request.input('page', 1))
    const perPage = Math.min(Number(request.input('perPage', 20)) || 20, 100)
    if (!startDate || !endDate)
      return response.badRequest({ error: 'startDate and endDate required' })

    const leases = await Lease.query({ connection: appEnv })
      .whereRaw('created_at::date BETWEEN ? AND ?', [startDate, endDate])
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)
    return response.ok(leases)
  }

  /** Maintenance requests stats and growth. */
  async maintenanceStats({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const { startDate, endDate } = parseDateRange(request)
    const conn = db.connection(appEnv)

    const [totalsResult, growthResult] = await Promise.all([
      conn.rawQuery(
        `SELECT COUNT(*)::int AS total FROM maintenance_requests
         WHERE created_at::date >= ? AND created_at::date <= ?`,
        [startDate, endDate],
      ),
      conn.rawQuery(
        `SELECT created_at::date AS day, COUNT(*)::int AS count
         FROM maintenance_requests WHERE created_at::date >= ? AND created_at::date <= ?
         GROUP BY created_at::date ORDER BY day`,
        [startDate, endDate],
      ),
    ])
    const total = Number((totalsResult.rows as { total: number }[])[0]?.total ?? 0)
    const toDateStr = (d: string | Date): string =>
      typeof d === 'string' ? d.slice(0, 10) : (d as Date).toISOString().slice(0, 10)
    const growth = (growthResult.rows as { day: string | Date; count: number }[]).map((r) => ({
      date: toDateStr(r.day),
      count: Number(r.count),
    }))
    return response.ok({ total, growth })
  }

  async maintenanceEntities({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const startDate = request.input('startDate', '')
    const endDate = request.input('endDate', '')
    const page = Number(request.input('page', 1))
    const perPage = Math.min(Number(request.input('perPage', 20)) || 20, 100)
    if (!startDate || !endDate)
      return response.badRequest({ error: 'startDate and endDate required' })

    const list = await MaintenanceRequest.query({ connection: appEnv })
      .whereRaw('created_at::date BETWEEN ? AND ?', [startDate, endDate])
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)
    return response.ok(list)
  }

  /** Activity stats and growth. */
  async activityStats({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const { startDate, endDate } = parseDateRange(request)
    const conn = db.connection(appEnv)

    const [totalsResult, growthResult] = await Promise.all([
      conn.rawQuery(
        `SELECT COUNT(*)::int AS total FROM activities
         WHERE created_at::date >= ? AND created_at::date <= ?`,
        [startDate, endDate],
      ),
      conn.rawQuery(
        `SELECT created_at::date AS day, COUNT(*)::int AS count
         FROM activities WHERE created_at::date >= ? AND created_at::date <= ?
         GROUP BY created_at::date ORDER BY day`,
        [startDate, endDate],
      ),
    ])
    const total = Number((totalsResult.rows as { total: number }[])[0]?.total ?? 0)
    const toDateStr = (d: string | Date): string =>
      typeof d === 'string' ? d.slice(0, 10) : (d as Date).toISOString().slice(0, 10)
    const growth = (growthResult.rows as { day: string | Date; count: number }[]).map((r) => ({
      date: toDateStr(r.day),
      count: Number(r.count),
    }))
    return response.ok({ total, growth })
  }

  async activityEntities({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const startDate = request.input('startDate', '')
    const endDate = request.input('endDate', '')
    const page = Number(request.input('page', 1))
    const perPage = Math.min(Number(request.input('perPage', 20)) || 20, 100)
    if (!startDate || !endDate)
      return response.badRequest({ error: 'startDate and endDate required' })

    const list = await Activity.query({ connection: appEnv })
      .whereRaw('created_at::date BETWEEN ? AND ?', [startDate, endDate])
      .orderBy('created_at', 'desc')
      .preload('user', (q) => q.select('id', 'name'))
      .paginate(page, perPage)
    return response.ok(list)
  }
}
