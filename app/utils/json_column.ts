/**
 * Helpers for Lucid columns backed by PostgreSQL `json` / `jsonb`.
 *
 * The `pg` driver already parses those column types, so a `consume` of
 * `JSON.parse(value)` receives an object or array rather than a string. `JSON.parse`
 * coerces its argument to a string first, so an empty array arrives as `""` and throws
 * `SyntaxError: Unexpected end of JSON input`, taking down whatever page read the row.
 *
 * These helpers accept a value that is already parsed, a JSON string (for `text`
 * columns and older rows), or null — so a column is safe either way.
 */

/** Consume a JSON column that holds an object. */
export function consumeJsonObject<T extends Record<string, unknown>>(value: unknown): T | null {
  if (value == null) return null
  if (typeof value === 'object' && !Array.isArray(value)) return value as T
  if (typeof value === 'string') {
    if (!value.trim()) return null
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as T) : null
    } catch {
      return null
    }
  }
  return null
}

/** Consume a JSON column that holds an array. */
export function consumeJsonArray<T>(value: unknown): T[] | null {
  if (value == null) return null
  if (Array.isArray(value)) return value as T[]
  if (typeof value === 'string') {
    if (!value.trim()) return null
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? (parsed as T[]) : null
    } catch {
      return null
    }
  }
  return null
}

/** Serialise a value for a JSON column, treating null and undefined alike. */
export function prepareJson(value: unknown): string | null {
  return value == null ? null : JSON.stringify(value)
}
