import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

import Activity from '#models/activity'
import MaintenanceRequest from '#models/maintenance_request'
import MaintenanceRequestTransformer from '#transformers/maintenance_request_transformer'
import type { CsvColumn } from '#utils/csv'
import { MAX_EXPORT_ROWS, sendCsv } from '#utils/csv_response'
import {
  isMaintenanceOverdue,
  MAINTENANCE_SORT_COLUMNS,
  MAINTENANCE_STATUSES,
  type MaintenanceSeverity,
  type MaintenanceStatus,
  parseOverdueFlag,
} from '#utils/maintenance_status'
import { toPaginationParams } from '#validators/list_fields'
import { maintenanceExportValidator, maintenanceIndexValidator } from '#validators/maintenance'
import { paginationQueryValidator } from '#validators/query'

/**
 * Columns `?search=` and `?sortBy=` may touch. Named here rather than taken from the
 * request: both reach SQL as identifiers.
 */
const MAINTENANCE_SEARCH_COLUMNS = ['title', 'description'] as const

type MaintenanceQuery = ModelQueryBuilderContract<typeof MaintenanceRequest>

interface MaintenanceFilters {
  status?: MaintenanceStatus
  severity?: MaintenanceSeverity
  overdue?: string
}

/**
 * Live (non-archived) requests from real customer orgs, with the relations a list row
 * links to. Test-account orgs are excluded the same way the leases index excludes them.
 */
function listQuery(appEnv: 'dev' | 'prod'): MaintenanceQuery {
  return MaintenanceRequest.query({ connection: appEnv })
    .whereNull('archived_at')
    .whereHas('org', (q) => q.where('is_test_account', false))
    .preload('org', (q) => q.select('id', 'name', 'creatorEmail', 'isTestAccount'))
    .preload('tenant', (q) => q.select('id', 'name', 'email'))
    .preload('lease', (q) => q.select('id', 'name', 'shortId', 'status'))
    .preload('leaseableEntity', (q) => q.select('id', 'address', 'type', 'propertyId'))
}

/** Values are bound; the only identifiers are literals. */
function applyFilters(query: MaintenanceQuery, filters: MaintenanceFilters): MaintenanceQuery {
  if (filters.status) query.where('status', filters.status)
  if (filters.severity) query.where('severity', filters.severity)
  if (parseOverdueFlag(filters.overdue)) {
    query.where('due_date', '<', new Date()).whereNot('status', 'complete')
  }
  return query
}

const EXPORT_COLUMNS: readonly CsvColumn<MaintenanceRequest>[] = [
  { header: 'ID', value: (row) => row.id },
  { header: 'Title', value: (row) => row.title },
  { header: 'Status', value: (row) => row.status },
  { header: 'Severity', value: (row) => row.severity },
  { header: 'Type', value: (row) => row.type },
  { header: 'Reported by', value: (row) => row.reportedBy },
  { header: 'Due date', value: (row) => row.dueDate?.toISO() ?? null },
  {
    header: 'Overdue',
    value: (row) => (isMaintenanceOverdue(row.dueDate?.toISO(), row.status) ? 'yes' : 'no'),
  },
  { header: 'Completion date', value: (row) => row.completionDate?.toISO() ?? null },
  { header: 'Cost', value: (row) => row.cost },
  { header: 'Org', value: (row) => row.org?.name ?? null },
  { header: 'Org ID', value: (row) => row.orgId },
  { header: 'Tenant', value: (row) => row.tenant?.name ?? null },
  { header: 'Lease', value: (row) => row.lease?.name ?? null },
  { header: 'Property', value: (row) => row.leaseableEntity?.address ?? null },
  { header: 'Created at', value: (row) => row.createdAt?.toISO() ?? null },
]

export default class MaintenanceController {
  async index({ request, inertia }: HttpContext) {
    const query = await request.validateUsing(maintenanceIndexValidator)
    const appEnv = request.appEnv()

    return inertia.render(
      'maintenance/index' as never,
      {
        /** Built and awaited inside the callback; see `LeasesController.index`. */
        maintenanceRequests: inertia.defer(async () => {
          const p = await applyFilters(listQuery(appEnv), query).withPagination(
            toPaginationParams(query),
            {
              searchColumns: MAINTENANCE_SEARCH_COLUMNS,
              sortableColumns: MAINTENANCE_SORT_COLUMNS,
            },
          )
          return MaintenanceRequestTransformer.paginate(p.all(), p.getMeta())
        }),
      } as never,
    )
  }

  async show({ params, request, inertia }: HttpContext) {
    const appEnv = request.appEnv()

    const maintenanceRequest = await MaintenanceRequest.query({ connection: appEnv })
      .where('id', params.id)
      .preload('org', (q) => q.select('id', 'name', 'creatorEmail', 'isTestAccount'))
      .preload('tenant', (q) => q.select('id', 'name', 'email'))
      .preload('lease', (q) => q.select('id', 'name', 'shortId', 'status'))
      .preload('leaseableEntity', (q) => q.select('id', 'address', 'type', 'propertyId'))
      .preload('property', (q) =>
        q.select('id', 'addressLineOne', 'city', 'postCode', 'leaseableEntityId'),
      )
      .firstOrFail()

    return inertia.render(
      'maintenance/show' as never,
      {
        maintenanceRequest: MaintenanceRequestTransformer.transform(maintenanceRequest),
        activities: inertia.defer(async () => {
          const rows = await Activity.query({ connection: appEnv })
            .where('maintenance_id', maintenanceRequest.id)
            .orderBy('created_at', 'desc')
            .preload('user', (q) => q.select('id', 'name'))
            .limit(50)

          return rows.map((activity) => ({
            id: activity.id,
            type: activity.type,
            summary: activity.summary,
            isSystemAction: activity.isSystemAction,
            createdAt: activity.createdAt?.toISO() ?? null,
            user: activity.user ? { id: activity.user.id, name: activity.user.name } : null,
          }))
        }),
      } as never,
    )
  }

  async stats({ request, response }: HttpContext) {
    const connection = db.connection(request.appEnv())

    const [totals, byStatus] = await Promise.all([
      connection.rawQuery(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE m.status IN ('todo', 'in_progress')) AS open,
          COUNT(*) FILTER (WHERE m.due_date < NOW() AND m.status <> 'complete') AS overdue,
          COUNT(*) FILTER (
            WHERE m.status = 'complete'
              AND COALESCE(m.completion_date, m.updated_at) >= NOW() - INTERVAL '30 days'
          ) AS completed_last_30_days,
          COUNT(*) FILTER (
            WHERE m.severity = 'high' AND m.status IN ('todo', 'in_progress')
          ) AS high_severity_open
        FROM maintenance_requests m
        JOIN orgs o ON o.id = m.org_id
        WHERE o.is_test_account = false AND m.archived_at IS NULL
      `),
      connection.rawQuery(`
        SELECT m.status, COUNT(*) AS count
        FROM maintenance_requests m
        JOIN orgs o ON o.id = m.org_id
        WHERE o.is_test_account = false AND m.archived_at IS NULL
        GROUP BY m.status
      `),
    ])

    const counts = (totals.rows as Record<string, string>[])[0] ?? {}
    const statusCounts: Record<string, number> = Object.fromEntries(
      MAINTENANCE_STATUSES.map((status) => [status, 0]),
    )
    for (const row of byStatus.rows as { status: string | null; count: string }[]) {
      statusCounts[row.status ?? 'unknown'] = Number(row.count)
    }

    return response.ok({
      total: Number(counts.total ?? 0),
      open: Number(counts.open ?? 0),
      overdue: Number(counts.overdue ?? 0),
      completedLast30Days: Number(counts.completed_last_30_days ?? 0),
      highSeverityOpen: Number(counts.high_severity_open ?? 0),
      byStatus: statusCounts,
    })
  }

  async export(ctx: HttpContext) {
    const { request } = ctx
    const filters = await request.validateUsing(maintenanceExportValidator)
    const appEnv = request.appEnv()

    const rows = await applyFilters(listQuery(appEnv), filters)
      .search(filters.search, MAINTENANCE_SEARCH_COLUMNS)
      .sortBy(filters.sortBy ?? 'created_at', filters.sortOrder ?? 'desc', MAINTENANCE_SORT_COLUMNS)
      .limit(MAX_EXPORT_ROWS)

    return sendCsv(ctx, {
      name: 'maintenance-requests',
      rows,
      columns: EXPORT_COLUMNS,
      targetType: 'maintenance_request',
    })
  }

  async byOrg({ request, params, response }: HttpContext) {
    await request.validateUsing(paginationQueryValidator)
    const appEnv = request.appEnv()
    const paginationParams = await request.paginationQs()

    const p = await MaintenanceRequest.query({ connection: appEnv })
      .where('org_id', params.orgId)
      .whereNull('archived_at')
      .preload('tenant', (q) => q.select('id', 'name', 'email'))
      .preload('lease', (q) => q.select('id', 'name', 'shortId', 'status'))
      .preload('leaseableEntity', (q) => q.select('id', 'address', 'type', 'propertyId'))
      .orderBy('created_at', 'desc')
      .paginate(paginationParams.page ?? 1, paginationParams.perPage ?? 10)

    return response.ok(MaintenanceRequestTransformer.paginate(p.all(), p.getMeta()))
  }
}
