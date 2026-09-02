import type { HttpContext } from '@adonisjs/core/http'

import Activity from '#models/activity'
import { DashboardService } from '#services/dashboard_service'
import { paginationQueryValidator } from '#validators/query'

export default class DashboardController {
  /**
   * The morning check: signups, lease movements, payment problems, ops backlog and the
   * growth series. Each section is read independently and degrades to zero on failure.
   */
  async stats({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const data = await DashboardService.stats(appEnv)
    return response.ok({ data })
  }

  async index({ inertia }: HttpContext) {
    return inertia.render('dashboard/index' as never, {})
  }

  async recentActivity({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    await request.validateUsing(paginationQueryValidator)
    const paginationParams = await request.paginationQs()
    const activities = await Activity.query({ connection: appEnv })
      .orderBy('created_at', 'desc')
      .preload('user', (q) => q.select('id', 'name'))
      .paginate(paginationParams.page ?? 1, paginationParams.perPage ?? 20)
    return response.ok(activities)
  }

  /** Items that need an operator's eyes: expiring grants, bans, deletions, backups. */
  async attention({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    return response.ok(await DashboardService.attention(appEnv))
  }
}
