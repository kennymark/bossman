import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class AuditsController {
  async index({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const page = Math.max(Number(request.qs().page) || 1, 1)
    /** Clamped so a caller cannot ask for an unbounded result set. */
    const perPage = Math.min(Math.max(Number(request.qs().perPage) || 20, 1), 100)
    const event = request.qs().event
    const auditableType = request.qs().auditableType

    let query = db.from('audits').where('user_id', user.id)

    if (event) {
      query = query.where('event', event)
    }

    if (auditableType) {
      query = query.where('auditable_type', auditableType)
    }

    const total = await query.clone().count('* as total').first()
    const audits = await query
      .orderBy('created_at', 'desc')
      .limit(perPage)
      .offset((page - 1) * perPage)
      .select('*')

    return response.ok({
      data: audits,
      meta: {
        currentPage: page,
        perPage,
        total: Number(total?.total || 0),
        lastPage: Math.ceil(Number(total?.total || 0) / perPage),
      },
    })
  }

  async recent({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const audits = await db
      .from('audits')
      .where('user_id', user.id)
      .orderBy('created_at', 'desc')
      .limit(10)
      .select('*')

    return response.ok({ audits })
  }
}
