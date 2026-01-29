import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Activity from '#models/activity'

export default class DashboardController {
  async stats({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const conn = db.connection(appEnv)

    const [usersResult, leasesResult, activityResult] = await Promise.all([
      conn.rawQuery('SELECT COUNT(*)::int AS total FROM users'),
      conn.rawQuery('SELECT COUNT(*)::int AS total FROM leases'),
      conn.rawQuery('SELECT COUNT(*)::int AS total FROM activities'),
    ])

    const totalUsers = Number((usersResult.rows as { total: number }[])[0]?.total ?? 0)
    const totalTenancies = Number((leasesResult.rows as { total: number }[])[0]?.total ?? 0)
    const totalActivity = Number((activityResult.rows as { total: number }[])[0]?.total ?? 0)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const fromDate = sevenDaysAgo.toISOString().slice(0, 10)

    const usersByDayResult = await conn.rawQuery(
      `SELECT created_at::date as day, COUNT(*)::int as count
       FROM users WHERE created_at >= ?
       GROUP BY created_at::date ORDER BY day`,
      [fromDate],
    )
    const tenanciesByDayResult = await conn.rawQuery(
      `SELECT start_date::date as day, COUNT(*)::int as count
       FROM leases WHERE start_date >= ?
       GROUP BY start_date::date ORDER BY day`,
      [fromDate],
    )

    const toDateStr = (d: string | Date): string =>
      typeof d === 'string' ? d.slice(0, 10) : (d as Date).toISOString().slice(0, 10)
    const usersByDay = (usersByDayResult.rows as { day: string | Date; count: number }[]).map(
      (r) => ({ date: toDateStr(r.day), count: Number(r.count) }),
    )
    const tenanciesByDay = (
      tenanciesByDayResult.rows as { day: string | Date; count: number }[]
    ).map((r) => ({ date: toDateStr(r.day), count: Number(r.count) }))

    const activityByWeekResult = await conn.rawQuery(
      `SELECT date_trunc('week', created_at)::date as week_start, COUNT(*)::int as count
       FROM activities
       WHERE created_at >= (NOW() - INTERVAL '10 weeks')
       GROUP BY date_trunc('week', created_at)
       ORDER BY week_start`,
    )
    const activityByWeek = (
      activityByWeekResult.rows as { week_start: string | Date; count: number }[]
    ).map((r) => ({ date: toDateStr(r.week_start), count: Number(r.count) }))

    return response.ok({
      data: {
        totalUsers,
        totalTenancies,
        totalActivity,
        growth: { usersByDay, tenanciesByDay, activityByWeek },
      },
    })
  }

  async index({ inertia }: HttpContext) {
    return inertia.render('dashboard/index')
  }

  async recentActivity({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const paginationParams = await request.paginationQs()
    const activities = await Activity.query({ connection: appEnv })
      .orderBy('created_at', 'desc')
      .preload('user', (q) => q.select('id', 'name'))
      .paginate(paginationParams.page ?? 1, paginationParams.perPage ?? 20)
    return response.ok(activities)
  }
}
