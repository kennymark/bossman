import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

import Activity from '#models/activity'
import Lease from '#models/lease'
import Payment from '#models/payment'
import { getDataAccessForUser } from '#services/data_access_service'
import LeaseTransformer from '#transformers/lease_transformer'
import { paginationQueryValidator } from '#validators/query'

/**
 * Columns `?search=` and `?sortBy=` may touch. Named here rather than taken from the
 * request: both reach SQL as identifiers.
 */
const LEASE_SEARCH_COLUMNS = ['name', 'short_id'] as const
const LEASE_SORTABLE_COLUMNS = ['created_at', 'start_date', 'end_date', 'name', 'status'] as const

export default class LeasesController {
  async index({ auth, request, inertia }: HttpContext) {
    const params = await request.paginationQs()
    const userId = auth.user?.id
    const dataAccess = userId !== undefined ? await getDataAccessForUser(userId) : null
    const appEnv = dataAccess?.effectiveAppEnv ?? request.appEnv()

    const baseQuery = Lease.query({ connection: appEnv })
      .preload('tenants', (q) => q.select('id', 'name', 'email'))
      .preload('org', (q) => q.select('id', 'name', 'creatorEmail', 'isTestAccount'))
      .whereHas('org', (q) => q.where('is_test_account', false))

    if (dataAccess?.leasesMode === 'selected' && dataAccess.allowedLeaseIds !== null) {
      if (dataAccess.allowedLeaseIds.length === 0) {
        baseQuery.whereRaw('1 = 0')
      } else {
        baseQuery.whereIn('id', dataAccess.allowedLeaseIds)
      }
    }

    return inertia.render('leases/index', {
      /**
       * The query is built *and* awaited inside the callback. Starting it out here and
       * only awaiting it in the callback left the promise floating on the initial
       * visit — Inertia sends a placeholder for a deferred prop and never invokes the
       * callback, so a rejection had nobody to reject to. With the dev database
       * unreachable that surfaced as an unhandled rejection *after* the 200 had been
       * sent, which takes the whole process down rather than failing one request.
       */
      leases: inertia.defer(async () => {
        const p = await baseQuery.withPagination(params, {
          searchColumns: LEASE_SEARCH_COLUMNS,
          sortableColumns: LEASE_SORTABLE_COLUMNS,
        })
        return LeaseTransformer.paginate(p.all(), p.getMeta())
      }),
      dataAccessExpired: dataAccess?.dataAccessExpired ?? false,
      dataAccessExpiredAt: dataAccess?.dataAccessExpiredAt ?? null,
    })
  }

  async stats({ response, request }: HttpContext) {
    const appEnv = request.appEnv()

    const result = await db.connection(appEnv).rawQuery(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'active') AS active,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE end_date < NOW()) AS expired
      FROM leases
    `)
    const counts = (result.rows as Record<string, string>[])[0]
    return response.ok(counts)
  }

  async show({ auth, params, inertia, request, response }: HttpContext) {
    const userId = auth.user?.id
    const dataAccess = userId !== undefined ? await getDataAccessForUser(userId) : null
    const appEnv = dataAccess?.effectiveAppEnv ?? request.appEnv()
    const lease = await Lease.query({ connection: appEnv }).where('id', params.id).firstOrFail()

    if (dataAccess?.leasesMode === 'selected' && dataAccess.allowedLeaseIds?.length) {
      if (!dataAccess.allowedLeaseIds.includes(lease.id)) {
        return response.forbidden()
      }
    }

    return inertia.render('leases/show', { lease: LeaseTransformer.transform(lease) })
  }

  async payments({ response, request, params }: HttpContext) {
    await request.validateUsing(paginationQueryValidator)
    const appEnv = request.appEnv()
    const paginationParams = await request.paginationQs()
    const payments = await Payment.query({ connection: appEnv })
      .where('lease_id', params.id)
      .orderBy('due_date', 'desc')
      .preload('lease', (q) => q.select('id', 'name', 'currency'))
      .withPagination(paginationParams)

    return response.ok(payments)
  }

  async activity({ response, request, params }: HttpContext) {
    await request.validateUsing(paginationQueryValidator)
    const paginationParams = await request.paginationQs()
    const appEnv = request.appEnv()
    const activities = await Activity.query({ connection: appEnv })
      .where('lease_id', params.id)
      .orderBy('created_at', 'desc')
      .preload('user', (q) => q.select('id', 'name'))
      .withPagination(paginationParams)

    return response.ok(activities)
  }
}
