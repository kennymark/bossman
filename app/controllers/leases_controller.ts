import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

import Activity from '#models/activity'
import Lease from '#models/lease'
import Payment from '#models/payment'
import { getDataAccessForUser } from '#services/data_access_service'
import LeaseTransformer from '#transformers/lease_transformer'
import type { CsvColumn } from '#utils/csv'
import { MAX_EXPORT_ROWS, sendCsv } from '#utils/csv_response'
import { leasesExportValidator } from '#validators/exports'
import { paginationQueryValidator } from '#validators/query'

/**
 * Columns `?search=` and `?sortBy=` may touch. Named here rather than taken from the
 * request: both reach SQL as identifiers.
 */
const LEASE_SEARCH_COLUMNS = ['name', 'short_id'] as const
const LEASE_SORTABLE_COLUMNS = ['created_at', 'start_date', 'end_date', 'name', 'status'] as const

/**
 * The leases a caller is allowed to list, before search, sort and pagination.
 *
 * Shared by `index` and `export`: the team-member data-access restriction (selected
 * leases only, the member's own environment) is applied here, so an export can never
 * contain a row the list would not have shown.
 */
async function buildLeasesBaseQuery({ auth, request }: HttpContext) {
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

  return { baseQuery, dataAccess }
}

/**
 * Operator columns for a lease export. Amounts are paired with their currency; dates
 * are ISO. The application, approval and rolling-status blobs stay on the lease page.
 */
const LEASE_EXPORT_COLUMNS: readonly CsvColumn<Lease>[] = [
  { header: 'ID', value: (lease) => lease.id },
  { header: 'Short ID', value: (lease) => lease.shortId },
  { header: 'Name', value: (lease) => lease.cleanName },
  { header: 'Status', value: (lease) => lease.status },
  { header: 'Rent amount', value: (lease) => lease.rentAmount },
  { header: 'Currency', value: (lease) => lease.currency },
  { header: 'Frequency', value: (lease) => lease.frequency },
  { header: 'Payment day', value: (lease) => lease.paymentDay },
  { header: 'Deposit amount', value: (lease) => lease.depositAmount },
  { header: 'Start date', value: (lease) => lease.startDate?.toISO() ?? null },
  { header: 'End date', value: (lease) => lease.endDate?.toISO() ?? null },
  {
    header: 'Early termination date',
    value: (lease) => lease.earlyTerminationDate?.toISO() ?? null,
  },
  { header: 'Rolling', value: (lease) => Boolean(lease.isPermanentlyRolling) },
  { header: 'Manually created', value: (lease) => Boolean(lease.isManuallyCreated) },
  { header: 'Archived at', value: (lease) => lease.archivedAt?.toISO() ?? null },
  { header: 'Tenants', value: (lease) => lease.tenants?.map((t) => t.name).join('; ') || null },
  {
    header: 'Tenant emails',
    value: (lease) => lease.tenants?.map((t) => t.email).join('; ') || null,
  },
  { header: 'Property ID', value: (lease) => lease.leaseableEntityId ?? lease.propertyId },
  { header: 'Org ID', value: (lease) => lease.orgId },
  { header: 'Org name', value: (lease) => lease.org?.cleanName ?? null },
  { header: 'Org email', value: (lease) => lease.org?.creatorEmail ?? null },
  { header: 'Created at', value: (lease) => lease.createdAt?.toISO() ?? null },
  { header: 'Updated at', value: (lease) => lease.updatedAt?.toISO() ?? null },
]

export default class LeasesController {
  async index(ctx: HttpContext) {
    const { request, inertia } = ctx
    const params = await request.paginationQs()
    const { baseQuery, dataAccess } = await buildLeasesBaseQuery(ctx)

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

  /**
   * The leases list as a CSV: same data-access scope, search and sort as `index`,
   * capped at the export ceiling.
   */
  async export(ctx: HttpContext) {
    await ctx.request.validateUsing(leasesExportValidator)
    const params = await ctx.request.paginationQs()
    const { baseQuery } = await buildLeasesBaseQuery(ctx)

    /** The same macros `withPagination` applies, minus the page; one past the cap. */
    const rows = await baseQuery
      .betweenCreatedDates(params.startDate, params.endDate)
      .search(params.search, LEASE_SEARCH_COLUMNS)
      .sortBy(params.sortBy || 'created_at', params.sortOrder || 'desc', LEASE_SORTABLE_COLUMNS)
      .limit(MAX_EXPORT_ROWS + 1)

    return sendCsv(ctx, {
      name: 'leases',
      rows,
      columns: LEASE_EXPORT_COLUMNS,
      targetType: 'Lease',
    })
  }
}
