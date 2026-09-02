import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

import Activity from '#models/activity'
import Lease from '#models/lease'
import LeaseableEntity from '#models/leaseable_entity'
import { getDataAccessForUser } from '#services/data_access_service'
import LeaseableEntityTransformer from '#transformers/leaseable_entity_transformer'
import type { CsvColumn } from '#utils/csv'
import { MAX_EXPORT_ROWS, sendCsv } from '#utils/csv_response'
import { leaseableEntitiesExportValidator } from '#validators/exports'
import { paginationQueryValidator } from '#validators/query'

/**
 * Columns `?search=` and `?sortBy=` may touch. Named here rather than taken from the
 * request: both reach SQL as identifiers.
 */
const ENTITY_SEARCH_COLUMNS = ['address', 'description', 'summary'] as const
const ENTITY_SORTABLE_COLUMNS = ['created_at', 'address', 'type', 'bedrooms'] as const

/**
 * The properties a caller is allowed to list, before search, sort and pagination.
 *
 * Shared by `index` and `export` so the team-member restriction (selected properties,
 * the member's own environment) bounds both: an export never widens the list.
 */
async function buildEntitiesBaseQuery({ auth, request }: HttpContext) {
  const userId = auth.user?.id
  const dataAccess = userId !== undefined ? await getDataAccessForUser(userId) : null
  const appEnv = dataAccess?.effectiveAppEnv ?? request.appEnv()

  const baseQuery = LeaseableEntity.query({ connection: appEnv })
    .preload('org', (q) => q.select('id', 'name', 'creatorEmail'))
    .whereIn('type', ['standalone', 'block'])
    .orderBy('address', 'asc')

  if (dataAccess?.propertiesMode === 'selected' && dataAccess.allowedLeaseableEntityIds !== null) {
    if (dataAccess.allowedLeaseableEntityIds.length === 0) {
      baseQuery.whereRaw('1 = 0')
    } else {
      baseQuery.whereIn('id', dataAccess.allowedLeaseableEntityIds)
    }
  }

  return { baseQuery, dataAccess }
}

/** Operator columns for a property export; the metadata and fees blobs stay on the page. */
const ENTITY_EXPORT_COLUMNS: readonly CsvColumn<LeaseableEntity>[] = [
  { header: 'ID', value: (entity) => entity.id },
  { header: 'Address', value: (entity) => entity.address },
  { header: 'Type', value: (entity) => entity.type },
  { header: 'Sub type', value: (entity) => entity.subType },
  { header: 'Bedrooms', value: (entity) => entity.bedrooms },
  { header: 'Bathrooms', value: (entity) => entity.bathrooms },
  { header: 'Floor', value: (entity) => entity.floor },
  { header: 'Size', value: (entity) => entity.size },
  { header: 'Furnished', value: (entity) => Boolean(entity.isFurnished) },
  { header: 'Vacant', value: (entity) => Boolean(entity.isVacant) },
  { header: 'Vacancy status', value: (entity) => entity.vacancyStatus },
  { header: 'Let only', value: (entity) => Boolean(entity.isLetOnly) },
  { header: 'For sale', value: (entity) => Boolean(entity.isForSale) },
  { header: 'HMO', value: (entity) => Boolean(entity.isHmo) },
  { header: 'Published', value: (entity) => Boolean(entity.isPublished) },
  { header: 'Published at', value: (entity) => entity.publishedAt?.toISO() ?? null },
  { header: 'Property ID', value: (entity) => entity.propertyId },
  { header: 'Unit ID', value: (entity) => entity.unitId },
  { header: 'Room ID', value: (entity) => entity.roomId },
  { header: 'Org ID', value: (entity) => entity.orgId },
  { header: 'Org name', value: (entity) => entity.org?.cleanName ?? null },
  { header: 'Org email', value: (entity) => entity.org?.creatorEmail ?? null },
  { header: 'Created at', value: (entity) => entity.createdAt?.toISO() ?? null },
  { header: 'Updated at', value: (entity) => entity.updatedAt?.toISO() ?? null },
]

export default class LeaseableEntitiesController {
  async index(ctx: HttpContext) {
    const { request, inertia } = ctx
    const params = await request.paginationQs()
    const { baseQuery, dataAccess } = await buildEntitiesBaseQuery(ctx)

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

  /**
   * The properties list as a CSV: same data-access scope, search and sort as `index`,
   * capped at the export ceiling.
   */
  async export(ctx: HttpContext) {
    await ctx.request.validateUsing(leaseableEntitiesExportValidator)
    const params = await ctx.request.paginationQs()
    const { baseQuery } = await buildEntitiesBaseQuery(ctx)

    /** The same macros `withPagination` applies, minus the page; one past the cap. */
    const rows = await baseQuery
      .betweenCreatedDates(params.startDate, params.endDate)
      .search(params.search, ENTITY_SEARCH_COLUMNS)
      .sortBy(params.sortBy || 'address', params.sortOrder || 'desc', ENTITY_SORTABLE_COLUMNS)
      .limit(MAX_EXPORT_ROWS + 1)

    return sendCsv(ctx, {
      name: 'properties',
      rows,
      columns: ENTITY_EXPORT_COLUMNS,
      targetType: 'LeaseableEntity',
    })
  }
}
