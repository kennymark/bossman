/**
 * Maintenance request status helpers.
 *
 * Client-safe: no AdonisJS imports (see `agent.md`). The index page, the org tab and
 * the CSV export all decide "overdue" the same way, and the SQL filter in
 * `MaintenanceController` mirrors this rule.
 */

export const MAINTENANCE_STATUSES = ['todo', 'in_progress', 'complete', 'postponed'] as const
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number]

export const MAINTENANCE_SEVERITIES = ['low', 'moderate', 'high'] as const
export type MaintenanceSeverity = (typeof MAINTENANCE_SEVERITIES)[number]

export const MAINTENANCE_SORT_COLUMNS = ['created_at', 'due_date', 'severity', 'status'] as const

/** Statuses that count as "open" on the stats cards. */
export const MAINTENANCE_OPEN_STATUSES: readonly MaintenanceStatus[] = ['todo', 'in_progress']

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  complete: 'Complete',
  postponed: 'Postponed',
}

export const MAINTENANCE_SEVERITY_LABELS: Record<MaintenanceSeverity, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
}

/**
 * A request is overdue when its due date has passed and it is not complete. A
 * postponed request with a lapsed due date still counts: the date was not moved.
 */
export function isMaintenanceOverdue(
  dueDate: string | Date | null | undefined,
  status: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (status === 'complete') return false
  if (dueDate === null || dueDate === undefined || dueDate === '') return false
  const date = dueDate instanceof Date ? dueDate : new Date(dueDate)
  if (Number.isNaN(date.getTime())) return false
  return date.getTime() < now.getTime()
}

/** Accepts the `?overdue=1` / `?overdue=true` forms a query string carries. */
export function parseOverdueFlag(value: string | number | boolean | null | undefined): boolean {
  if (value === true || value === 1) return true
  if (typeof value !== 'string') return false
  const normalised = value.trim().toLowerCase()
  return normalised === '1' || normalised === 'true'
}
