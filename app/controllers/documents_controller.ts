import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

import Document from '#models/document'
import DocumentTransformer from '#transformers/document_transformer'
import type { CsvColumn } from '#utils/csv'
import { MAX_EXPORT_ROWS, sendCsv } from '#utils/csv_response'
import {
  classifyDocumentExpiry,
  DOCUMENT_SORT_COLUMNS,
  type DocumentComplianceFilter,
  type DocumentExpiryFilter,
  type DocumentType,
} from '#utils/document_expiry'
import { documentsExportValidator, documentsIndexValidator } from '#validators/documents'
import { toPaginationParams } from '#validators/list_fields'
import { paginationQueryValidator } from '#validators/query'

/**
 * Columns `?search=` and `?sortBy=` may touch. Named here rather than taken from the
 * request: both reach SQL as identifiers.
 */
const DOCUMENT_SEARCH_COLUMNS = ['name', 'file_name'] as const

const DAY_MS = 24 * 60 * 60 * 1000

type DocumentQuery = ModelQueryBuilderContract<typeof Document>

interface DocumentFilters {
  compliance?: DocumentComplianceFilter
  expiry?: DocumentExpiryFilter
  docType?: DocumentType
}

/**
 * Live (non-archived) documents from real customer orgs, with the relations a list
 * row links to. The `file` attachment column is never selected into a response: the
 * transformer omits it, and no endpoint here signs a URL.
 */
function listQuery(appEnv: 'dev' | 'prod'): DocumentQuery {
  return Document.query({ connection: appEnv })
    .whereNull('archived_at')
    .whereHas('org', (q) => q.where('is_test_account', false))
    .preload('org', (q) => q.select('id', 'name', 'creatorEmail', 'isTestAccount'))
    .preload('tenant', (q) => q.select('id', 'name', 'email'))
    .preload('lease', (q) => q.select('id', 'name', 'shortId', 'status'))
    .preload('leaseableEntity', (q) => q.select('id', 'address', 'type', 'propertyId'))
    .preload('property', (q) =>
      q.select('id', 'addressLineOne', 'city', 'postCode', 'leaseableEntityId'),
    )
}

/**
 * The expiry windows here mirror `classifyDocumentExpiry` so the filter and the badge
 * agree. Values are bound; the only identifiers are literals.
 */
function applyFilters(query: DocumentQuery, filters: DocumentFilters): DocumentQuery {
  if (filters.compliance === 'compliance_only') query.where('is_compliance_document', true)
  if (filters.docType) query.where('doc_type', filters.docType)

  const now = new Date()
  switch (filters.expiry) {
    case 'expired':
      query.where('expires_at', '<', now)
      break
    case 'expiring_30':
      query
        .where('expires_at', '>=', now)
        .where('expires_at', '<', new Date(now.getTime() + 30 * DAY_MS))
      break
    case 'expiring_90':
      query
        .where('expires_at', '>=', now)
        .where('expires_at', '<', new Date(now.getTime() + 90 * DAY_MS))
      break
    case 'no_expiry':
      query.whereNull('expires_at')
      break
    default:
      break
  }
  return query
}

const EXPORT_COLUMNS: readonly CsvColumn<Document>[] = [
  { header: 'ID', value: (row) => row.id },
  { header: 'Name', value: (row) => row.name },
  { header: 'File name', value: (row) => row.fileName },
  { header: 'Type', value: (row) => row.docType },
  { header: 'Compliance', value: (row) => (row.isComplianceDocument ? 'yes' : 'no') },
  { header: 'Can expire', value: (row) => (row.canExpire ? 'yes' : 'no') },
  { header: 'Expires at', value: (row) => row.expiresAt?.toISO() ?? null },
  { header: 'Expiry state', value: (row) => classifyDocumentExpiry(row.expiresAt?.toISO()) },
  { header: 'Org', value: (row) => row.org?.name ?? null },
  { header: 'Org ID', value: (row) => row.orgId },
  { header: 'Tenant', value: (row) => row.tenant?.name ?? null },
  { header: 'Lease', value: (row) => row.lease?.name ?? null },
  { header: 'Property', value: (row) => row.leaseableEntity?.address ?? null },
  { header: 'Uploaded at', value: (row) => row.createdAt?.toISO() ?? null },
]

export default class DocumentsController {
  async index({ request, inertia }: HttpContext) {
    const query = await request.validateUsing(documentsIndexValidator)
    const appEnv = request.appEnv()

    return inertia.render(
      'documents/index' as never,
      {
        /** Built and awaited inside the callback; see `LeasesController.index`. */
        documents: inertia.defer(async () => {
          const p = await applyFilters(listQuery(appEnv), query).withPagination(
            toPaginationParams(query),
            {
              searchColumns: DOCUMENT_SEARCH_COLUMNS,
              sortableColumns: DOCUMENT_SORT_COLUMNS,
            },
          )
          return DocumentTransformer.paginate(p.all(), p.getMeta())
        }),
      } as never,
    )
  }

  async stats({ request, response }: HttpContext) {
    const connection = db.connection(request.appEnv())

    const [totals, byType] = await Promise.all([
      connection.rawQuery(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE d.is_compliance_document = true) AS compliance,
          COUNT(*) FILTER (WHERE d.expires_at < NOW()) AS expired,
          COUNT(*) FILTER (
            WHERE d.expires_at >= NOW() AND d.expires_at < NOW() + INTERVAL '30 days'
          ) AS expiring_30,
          COUNT(*) FILTER (
            WHERE d.expires_at >= NOW() AND d.expires_at < NOW() + INTERVAL '90 days'
          ) AS expiring_90
        FROM documents d
        JOIN orgs o ON o.id = d.org_id
        WHERE o.is_test_account = false AND d.archived_at IS NULL
      `),
      connection.rawQuery(`
        SELECT COALESCE(d.doc_type, 'other') AS doc_type, COUNT(*) AS count
        FROM documents d
        JOIN orgs o ON o.id = d.org_id
        WHERE o.is_test_account = false AND d.archived_at IS NULL
        GROUP BY 1
        ORDER BY 2 DESC, 1 ASC
        LIMIT 8
      `),
    ])

    const counts = (totals.rows as Record<string, string>[])[0] ?? {}

    return response.ok({
      total: Number(counts.total ?? 0),
      compliance: Number(counts.compliance ?? 0),
      expired: Number(counts.expired ?? 0),
      expiring30: Number(counts.expiring_30 ?? 0),
      expiring90: Number(counts.expiring_90 ?? 0),
      byDocType: (byType.rows as { doc_type: string; count: string }[]).map((row) => ({
        docType: row.doc_type,
        count: Number(row.count),
      })),
    })
  }

  async export(ctx: HttpContext) {
    const { request } = ctx
    const filters = await request.validateUsing(documentsExportValidator)
    const appEnv = request.appEnv()

    const rows = await applyFilters(listQuery(appEnv), filters)
      .search(filters.search, DOCUMENT_SEARCH_COLUMNS)
      .sortBy(filters.sortBy ?? 'created_at', filters.sortOrder ?? 'desc', DOCUMENT_SORT_COLUMNS)
      .limit(MAX_EXPORT_ROWS)

    return sendCsv(ctx, {
      name: 'documents',
      rows,
      columns: EXPORT_COLUMNS,
      targetType: 'document',
    })
  }

  async byOrg({ request, params, response }: HttpContext) {
    await request.validateUsing(paginationQueryValidator)
    const appEnv = request.appEnv()
    const paginationParams = await request.paginationQs()

    const p = await Document.query({ connection: appEnv })
      .where('org_id', params.orgId)
      .whereNull('archived_at')
      .preload('tenant', (q) => q.select('id', 'name', 'email'))
      .preload('lease', (q) => q.select('id', 'name', 'shortId', 'status'))
      .preload('leaseableEntity', (q) => q.select('id', 'address', 'type', 'propertyId'))
      .orderBy('created_at', 'desc')
      .paginate(paginationParams.page ?? 1, paginationParams.perPage ?? 10)

    return response.ok(DocumentTransformer.paginate(p.all(), p.getMeta()))
  }
}
