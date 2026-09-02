import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

import Activity from '#models/activity'
import Lease from '#models/lease'
import LeaseableEntity from '#models/leaseable_entity'
import { getDataAccessForUser } from '#services/data_access_service'
import LeaseableEntityTransformer from '#transformers/leaseable_entity_transformer'
import { paginationQueryValidator } from '#validators/query'

/**
 * Columns `?search=` and `?sortBy=` may touch. Named here rather than taken from the
 * request: both reach SQL as identifiers.
 */
const ENTITY_SEARCH_COLUMNS = ['address', 'description', 'summary'] as const
const ENTITY_SORTABLE_COLUMNS = ['created_at', 'address', 'type', 'bedrooms'] as const

export default class LeaseableEntitiesController {
  async index({ auth, request, inertia }: HttpContext) {
    const params = await request.paginationQs()
    const userId = auth.user?.id
    const dataAccess = userId !== undefined ? await getDataAccessForUser(userId) : null
    const appEnv = dataAccess?.effectiveAppEnv ?? request.appEnv()

    const baseQuery = LeaseableEntity.query({ connection: appEnv })
      .preload('org', (q) => q.select('id', 'name', 'creatorEmail'))
      .whereIn('type', ['standalone', 'block'])
      .orderBy('address', 'asc')

    if (
      dataAccess?.propertiesMode === 'selected' &&
      dataAccess.allowedLeaseableEntityIds !== null
    ) {
      if (dataAccess.allowedLeaseableEntityIds.length === 0) {
        baseQuery.whereRaw('1 = 0')
      } else {
        baseQuery.whereIn('id', dataAccess.allowedLeaseableEntityIds)
      }
    }

    return inertia.render('properties/index', {
      /** Built and awaited inside the callback — see the note in `leases_controller`. */
      leaseableEntities: inertia.defer(async () => {
        const p = await baseQuery.withPagination(params, {
          searchColumns: ENTITY_SEARCH_COLUMNS,
          sortableColumns: ENTITY_SORTABLE_COLUMNS,
          defaultSort: 'address',
        })
        return LeaseableEntityTransformer.paginate(p.all(), p.getMeta())
      }),
      dataAccessExpired: dataAccess?.dataAccessExpired ?? false,
      dataAccessExpiredAt: dataAccess?.dataAccessExpiredAt ?? null,
    })
  }

  async stats({ request, response }: HttpContext) {
    const appEnv = request.appEnv()

    const counts = await db.connection(appEnv).rawQuery(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE is_vacant = true) AS vacant,
        COUNT(*) FILTER (WHERE is_vacant = false) AS occupied
      FROM leaseable_entities
    `)
    const data = (counts.rows as { total: string; vacant: string; occupied: string }[])[0]
    return response.ok(data)
  }

  async show({ auth, params, inertia, request, response }: HttpContext) {
    const userId = auth.user?.id
    const dataAccess = userId !== undefined ? await getDataAccessForUser(userId) : null
    const appEnv = dataAccess?.effectiveAppEnv ?? request.appEnv()
    const entity = await LeaseableEntity.query({ connection: appEnv })
      .where('id', params.id)
      .first()
    if (!entity) return response.notFound({ message: 'Property not found' })

    if (dataAccess?.propertiesMode === 'selected' && dataAccess.allowedLeaseableEntityIds?.length) {
      if (!dataAccess.allowedLeaseableEntityIds.includes(entity.id)) {
        return response.forbidden()
      }
    }

    return inertia.render('properties/show', {
      property: LeaseableEntityTransformer.transform(entity),
    })
  }

  async leases({ request, params, response }: HttpContext) {
    await request.validateUsing(paginationQueryValidator)
    const appEnv = request.appEnv()
    const paginationParams = await request.paginationQs()
    const leases = await Lease.query({ connection: appEnv })
      .where('leaseable_entity_id', params.id)
      .orderBy('start_date', 'desc')
      .preload('tenants', (q) => q.select('id', 'name', 'email'))
      .preload('org', (q) => q.select('id', 'name', 'creatorEmail'))
      .paginate(paginationParams.page ?? 1, paginationParams.perPage ?? 10)
    return response.ok(leases)
  }

  async activity({ request, params, response }: HttpContext) {
    await request.validateUsing(paginationQueryValidator)
    const appEnv = request.appEnv()
    const paginationParams = await request.paginationQs()
    const activities = await Activity.query({ connection: appEnv })
      .where('leaseable_entity_id', params.id)
      .orderBy('created_at', 'desc')
      .preload('user', (q) => q.select('id', 'name'))
      .paginate(paginationParams.page ?? 1, paginationParams.perPage ?? 10)
    return response.ok(activities)
  }

  /** Scaffold: implemented by the feature branch that owns it. */
  async export({ response }: HttpContext) {
    return response.notImplemented({ error: 'Not implemented' })
  }
}
