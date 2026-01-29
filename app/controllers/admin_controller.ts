import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class AdminController {
  async index({ request, inertia }: HttpContext) {
    const queryParams = await request.paginationQs()
    const page = queryParams.page || 1
    const perPage = queryParams.perPage || 20

    const totalUsersRow = await db.from('users').count('* as total').first()
    const totalActivityRow = await db.from('audits').count('* as total').first()

    const totalUsers = Number(totalUsersRow?.total || 0)
    const totalActivity = Number(totalActivityRow?.total || 0)

    const auditsQuery = db
      .from('audits')
      .leftJoin('users', 'audits.user_id', 'users.id')
      .orderBy('audits.created_at', 'desc')

    const totalAuditsRow = await auditsQuery.clone().count('* as total').first()
    const audits = await auditsQuery
      .clone()
      .select(
        'audits.id',
        'audits.event',
        'audits.auditable_type',
        'audits.auditable_id',
        'audits.user_id',
        'audits.created_at',
        'users.email as user_email',
        'users.full_name as user_full_name',
      )
      .limit(perPage)
      .offset((page - 1) * perPage)

    const totalAudits = Number(totalAuditsRow?.total || 0)

    return inertia.render('admin/index', {
      stats: {
        totalUsers,
        totalActivity,
      },
      activities: {
        data: audits,
        meta: {
          currentPage: page,
          perPage,
          total: totalAudits,
          lastPage: Math.ceil(totalAudits / perPage),
        },
      },
    })
  }
}

