import type { HttpContext } from '@adonisjs/core/http'

import { recordAdminAction } from '#services/admin_audit_service'
import { type CsvColumn, csvFilename, toCsv } from '#utils/csv'

/** Server-only: the largest export a single request will produce. */
export const MAX_EXPORT_ROWS = 5000

export interface SendCsvOptions<T> {
  /** Filename prefix, e.g. `orgs`; the date and extension are appended. */
  name: string
  rows: readonly T[]
  columns: readonly CsvColumn<T>[]
  /** Recorded in the operator audit trail as `export.csv`. */
  targetType: string
}

/**
 * Streams rows as a CSV download and logs the export.
 *
 * Exports leave the console — a downloaded file of customer data is the one artefact
 * the audit trail otherwise never sees — so every export is recorded with its row
 * count and the environment it read from.
 */
export async function sendCsv<T>(ctx: HttpContext, options: SendCsvOptions<T>) {
  const rows = options.rows.slice(0, MAX_EXPORT_ROWS)
  const filename = csvFilename(options.name)

  await recordAdminAction(ctx, {
    action: 'export.csv',
    targetType: options.targetType,
    targetLabel: filename,
    metadata: { rows: rows.length, truncated: options.rows.length > rows.length },
  })

  ctx.response.header('Content-Type', 'text/csv; charset=utf-8')
  ctx.response.header('Content-Disposition', `attachment; filename="${filename}"`)
  return ctx.response.send(`﻿${toCsv(rows, options.columns)}`)
}
