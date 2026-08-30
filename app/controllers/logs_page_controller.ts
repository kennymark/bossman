import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

/** Admin role and the `logs` page grant are enforced by the route group. */
export default class LogsPageController {
  async index({ request, inertia }: HttpContext) {
    const params = await request.paginationQs()
    const event = request.qs().event as string | undefined
    const auditableType = request.qs().auditableType as string | undefined

    const audits = await db
      .from('audits')
      .orderBy('created_at', 'desc')
      .if(event, (q) => q.where('event', event!))
      .if(auditableType, (q) => q.where('auditable_type', auditableType!))
      .select('*')
      .paginate(params.page ?? 1, params.perPage ?? 20)

    return inertia.render('logs/index', {
      audits: inertia.defer(async () => audits),
      filters: { event: event ?? '', auditableType: auditableType ?? '' },
    })
  }
}
