/**
 * Utility functions for exporting data to various formats
 */

export interface ExportOptions {
  filename?: string
  includeHeaders?: boolean
}

/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: string; header: string }[],
  options: ExportOptions = {},
): void {
  const { filename = 'export', includeHeaders = true } = options

  // Create CSV content
  let csvContent = ''

  // Add headers
  if (includeHeaders) {
    csvContent += columns.map((col) => escapeCSVValue(col.header)).join(',') + '\n'
  }

  // Add data rows
  data.forEach((row) => {
    const values = columns.map((col) => {
      const value = row[col.key]
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') return JSON.stringify(value)
      // Format dates nicely
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        try {
          const date = new Date(value)
          if (!Number.isNaN(date.getTime())) {
            return date.toLocaleString('en-GB', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          }
        } catch {
          // Fall through to string conversion
        }
      }
      return String(value)
    })
    csvContent += values.map(escapeCSVValue).join(',') + '\n'
  })

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Escape CSV value to handle commas, quotes, and newlines
 */
function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
