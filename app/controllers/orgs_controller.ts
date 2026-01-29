import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Activity from '#models/activity'
import Lease from '#models/lease'
import Org from '#models/org'
import Property from '#models/property'

export default class OrgsController {
  async index({ request, inertia }: HttpContext) {
    const params = await request.paginationQs()
    const appEnv = request.appEnv()
    const orgs = await Org.query({ connection: appEnv })
      .orderBy('name', 'asc')
      .if(params.search, (q) => {
        q.whereILike('name', `%${params.search}%`)
      })
      .sortBy(params.sortBy || 'name', params.sortOrder || 'asc')
      .paginate(params.page || 1, params.perPage || 20)

    return inertia.render('orgs/index', { orgs })
  }

  async stats({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const counts = await db.connection(appEnv).rawQuery(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE owner_role = 'landlord') AS landlords,
        COUNT(*) FILTER (WHERE owner_role = 'agency') AS agencies
      FROM orgs
    `)
    const data = counts.rows[0]
    return response.ok(data)
  }

  async show({ params, inertia, request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const org = await Org.query({ connection: appEnv }).where('id', params.id).firstOrFail()

    return inertia.render('orgs/show', { org })
  }

  async leases({ request, params, response }: HttpContext) {
    const appEnv = request.appEnv()
    const paginationParams = await request.paginationQs()

    const leases = await Lease.query({ connection: appEnv })
      .where('org_id', params.id)
      .orderBy('start_date', 'desc')
      .preload('tenants', (q) => q.select('id', 'name', 'email'))
      .preload('org', (q) => q.select('id', 'name', 'creatorEmail'))
      .paginate(paginationParams.page ?? 1, paginationParams.perPage ?? 10)

    return response.ok(leases)
  }

  async properties({ request, params, response }: HttpContext) {
    const appEnv = request.appEnv()
    const paginationParams = await request.paginationQs()
    const properties = await Property.query({ connection: appEnv })
      .where('org_id', params.id)
      .orderBy('address_line_one', 'asc')
      .paginate(paginationParams.page ?? 1, paginationParams.perPage ?? 10)
    return response.ok(properties)
  }

  async activities({ request, params, response }: HttpContext) {
    const appEnv = request.appEnv()
    const paginationParams = await request.paginationQs()
    const activities = await Activity.query({ connection: appEnv })
      .where('org_id', params.id)
      .orderBy('created_at', 'desc')
      .paginate(paginationParams.page ?? 1, paginationParams.perPage ?? 10)
    return response.ok(activities)
  }
}
