import { format, formatDistanceToNow, isValid, parse, parseISO } from 'date-fns'
import { DateTime } from 'luxon'

type DateInput = string | Date

type DateFormat = 'iso' | 'short' | 'long' | 'us' | 'basic'

/**
 * Formats a date according to the specified format type
 * @param date - The date to format (string or Date object)
 * @param formatType - The format type: 'iso', 'short', 'long', 'us', or 'basic'
 * @returns Formatted date string
 */
function parseDateString(dateString: string): Date | null {
  // Try ISO format first
  let parsed = parseISO(dateString)
  if (isValid(parsed)) return parsed

  // Try SQL datetime format: "2026-01-22 21:56:24.087 +00:00"
  parsed = parse(dateString, 'yyyy-MM-dd HH:mm:ss.SSS xxxx', new Date())
  if (isValid(parsed)) return parsed

  // Try SQL datetime without timezone: "2026-01-22 21:56:24"
  parsed = parse(dateString, 'yyyy-MM-dd HH:mm:ss', new Date())
  if (isValid(parsed)) return parsed

  // Try SQL date format: "2026-01-22"
  parsed = parse(dateString, 'yyyy-MM-dd', new Date())
  if (isValid(parsed)) return parsed

  // Fallback to Date constructor
  const dateObj = new Date(dateString)
  return isValid(dateObj) ? dateObj : null
}

export function dateFormatter(date: DateInput, formatType: DateFormat = 'short'): string {
  let dateObj: Date | null

  if (typeof date === 'string') {
    dateObj = parseDateString(date)
  } else {
    dateObj = date
  }

  if (!dateObj || !isValid(dateObj)) {
    return 'Invalid date'
  }

  const formatMap: Record<DateFormat, string> = {
    iso: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", // ISO 8601 with timezone
    short: 'd MMM yyyy', // 1 Jan 2024
    long: 'd MMMM yyyy', // 1 January 2024
    us: 'dd/MM/yyyy', // 01/01/2024 (European format)
    basic: 'yyyy-MM-dd', // 2024-01-01
  }

  return format(dateObj, formatMap[formatType])
}

/**
 * Formats a date with time according to the specified format type
 * @param date - The date to format (string or Date object)
 * @param formatType - The format type: 'iso', 'short', 'long', 'us', or 'basic'
 * @returns Formatted date and time string
 */
export function dateTimeFormatter(date: DateInput, formatType: DateFormat = 'short'): string {
  let dateObj: Date | null

  if (typeof date === 'string') {
    dateObj = parseDateString(date)
  } else {
    dateObj = date
  }

  if (!dateObj || !isValid(dateObj)) {
    return 'Invalid date'
  }

  const formatMap: Record<DateFormat, string> = {
    iso: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
    short: 'd MMM yyyy HH:mm', // 1 Jan 2024 14:30
    long: "d MMMM yyyy 'at' HH:mm", // 1 January 2024 at 14:30
    us: 'dd/MM/yyyy HH:mm', // 01/01/2024 14:30 (European format)
    basic: 'yyyy-MM-dd HH:mm:ss', // 2024-01-01 14:30:00
  }

  return format(dateObj, formatMap[formatType])
}
