/**
 * CSV encoding shared by every export endpoint.
 *
 * Client-safe: pure string logic with no AdonisJS imports (see `agent.md`), so a page
 * can build the same file the server would, should it ever need to.
 */

export interface CsvColumn<T> {
  /** Header cell. */
  header: string
  /** Reads the cell for a row. Return `null`/`undefined` for an empty cell. */
  value: (row: T) => unknown
}

/**
 * Quotes a single cell.
 *
 * Every cell is quoted, which is simpler than deciding per value and keeps commas,
 * quotes and newlines inside a cell intact. A leading `=`, `+`, `-` or `@` is prefixed
 * with a tab so a spreadsheet does not evaluate operator-supplied text as a formula.
 */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '""'

  let text: string
  if (value instanceof Date) text = value.toISOString()
  else if (typeof value === 'object') text = JSON.stringify(value)
  else text = String(value)

  if (/^[=+\-@]/.test(text)) text = `\t${text}`

  return `"${text.replace(/"/g, '""')}"`
}

/** Encodes rows as CSV with a header line and CRLF line endings. */
export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const header = columns.map((column) => csvCell(column.header)).join(',')
  const lines = rows.map((row) => columns.map((column) => csvCell(column.value(row))).join(','))
  return [header, ...lines].join('\r\n') + '\r\n'
}

/** `orgs-2026-09-02.csv` — a stable, filesystem-safe export filename. */
export function csvFilename(prefix: string, date: Date = new Date()): string {
  const safe = prefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${safe || 'export'}-${date.toISOString().slice(0, 10)}.csv`
}
