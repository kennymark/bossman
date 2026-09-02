import vine from '@vinejs/vine'

import {
  MAINTENANCE_SEVERITIES,
  MAINTENANCE_SORT_COLUMNS,
  MAINTENANCE_STATUSES,
} from '#utils/maintenance_status'
import { listPageFields, listSearchFields } from '#validators/list_fields'

/**
 * `?status=`, `?severity=` and `?sortBy=` all reach SQL — as bound values or as an
 * ORDER BY identifier — so each is an enum rather than a free string.
 */
const maintenanceFilterFields = {
  ...listSearchFields,
  status: vine.enum(MAINTENANCE_STATUSES).optional(),
  severity: vine.enum(MAINTENANCE_SEVERITIES).optional(),
  /** `1` or `true`: due date passed and not complete. */
  overdue: vine.string().maxLength(5).optional(),
  sortBy: vine.enum(MAINTENANCE_SORT_COLUMNS).optional(),
}

export const maintenanceIndexValidator = vine.create(
  vine.object({ ...listPageFields, ...maintenanceFilterFields }),
)

export const maintenanceExportValidator = vine.create(vine.object({ ...maintenanceFilterFields }))
