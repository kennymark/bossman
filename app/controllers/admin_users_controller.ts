import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import { updateAdminUserValidator } from '#validators/admin_user'

export default class AdminUsersController {
  async index({ request, inertia }: HttpContext) {
    const queryParams = await request.paginationQs()

    let query = User.query().select([
      'id',
      'full_name',
      'email',
      'role',
      'created_at',
      'last_login_at',
    ])

    if (queryParams.search) {
      const searchTerm = `%${queryParams.search}%`
      query = query.where((q) => {
        q.where('email', 'like', searchTerm).orWhere('full_name', 'like', searchTerm)
      })
    }

    query = query.orderBy(queryParams.sortBy || 'created_at', queryParams.sortOrder || 'desc')

    const users = await query.paginate(queryParams.page || 1, queryParams.perPage || 20)

    return inertia.render('admin/users', { users })
  }

  async show({ params, request, inertia, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) return response.notFound({ error: 'User not found' })

    const queryParams = await request.paginationQs()
    const page = queryParams.page || 1
    const perPage = queryParams.perPage || 20
    const search = queryParams.search ? String(queryParams.search).trim() : ''

    let auditsQuery = db.from('audits').where('user_id', user.id)

    if (search) {
      const like = `%${search}%`
      auditsQuery = auditsQuery.where((q) => {
        q.where('event', 'like', like).orWhere('auditable_type', 'like', like)
      })
    }

    const totalRow = await auditsQuery.clone().count('* as total').first()
    const total = Number(totalRow?.total || 0)

    const audits = await auditsQuery
      .clone()
      .orderBy('created_at', 'desc')
      .limit(perPage)
      .offset((page - 1) * perPage)
      .select(['id', 'event', 'auditable_type', 'auditable_id', 'metadata', 'created_at'])

    return inertia.render('admin/user', {
      targetUser: user.serialize(),
      activity: {
        data: audits,
        meta: {
          currentPage: page,
          perPage,
          total,
          lastPage: Math.ceil(total / perPage),
        },
      },
    })
  }

  async edit({ params, inertia, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) return response.notFound({ error: 'User not found' })

    return inertia.render('admin/user-edit', {
      targetUser: user.serialize(),
    })
  }

  async update({ params, request, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) return response.notFound({ error: 'User not found' })

    const body = await request.validateUsing(updateAdminUserValidator)

    user.fullName = body.fullName?.trim() ? body.fullName.trim() : null
    user.role = body.role
    await user.save()

    return response.redirect(`/users/${user.id}`)
  }
}
