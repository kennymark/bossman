/**
 * How a lease's term reads when it has no end date.
 *
 * The end date is optional in the product: a rolling tenancy runs until somebody ends
 * it. Formatting that absence as a date produced "Invalid date" in the leases table.
 *
 * Client-safe: pure logic with no AdonisJS imports (see `agent.md`). The caller passes
 * its own date formatter, so the server and the browser can label a lease the same way
 * without this file reaching into either.
 */

export interface LeaseTerm {
  startDate?: string | Date | null
  endDate?: string | Date | null
  isPermanentlyRolling?: boolean | null
}

/** What the end of a lease is: a real date, an open-ended term, or nothing recorded. */
export type LeaseEndKind = 'date' | 'rolling' | 'unknown'

export function leaseEndKind(lease: LeaseTerm): LeaseEndKind {
  if (lease.endDate) return 'date'
  return lease.isPermanentlyRolling ? 'rolling' : 'unknown'
}

export const ROLLING_LABEL = 'Rolling'

/**
 * A lease is rolling by intent, not by omission, so the flag decides the wording.
 *
 * Every lease in the dev database without an end date is flagged rolling, but the two
 * are separate facts: a missing end date on a lease nobody marked rolling is missing
 * data, and saying "Rolling" there would invent a term the customer never agreed.
 */
export function leaseEndLabel(
  lease: LeaseTerm,
  formatDate: (value: string | Date) => string,
): string {
  const kind = leaseEndKind(lease)
  if (kind === 'date') return formatDate(lease.endDate as string | Date)
  return kind === 'rolling' ? ROLLING_LABEL : 'No end date'
}

/** "1 Jan 2026 – Rolling", for the one-line term under a lease name. */
export function leaseTermLabel(
  lease: LeaseTerm,
  formatDate: (value: string | Date) => string,
): string {
  const start = lease.startDate ? formatDate(lease.startDate) : 'No start date'
  return `${start} – ${leaseEndLabel(lease, formatDate)}`
}
