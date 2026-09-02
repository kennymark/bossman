/**
 * Document expiry classification.
 *
 * Client-safe: pure date arithmetic with no AdonisJS imports (see `agent.md`). The
 * documents index, the CSV export and the org tab all colour a document by the same
 * rule, and the SQL filters in `DocumentsController` mirror these windows.
 */

export const DOCUMENT_EXPIRY_FILTERS = [
  'all',
  'expired',
  'expiring_30',
  'expiring_90',
  'no_expiry',
] as const
export type DocumentExpiryFilter = (typeof DOCUMENT_EXPIRY_FILTERS)[number]

export const DOCUMENT_COMPLIANCE_FILTERS = ['all', 'compliance_only'] as const
export type DocumentComplianceFilter = (typeof DOCUMENT_COMPLIANCE_FILTERS)[number]

export const DOCUMENT_TYPES = [
  'booking_form',
  'tenancy_agreement',
  'consent_form',
  'guarantor_form',
  'invoice',
  'id_document',
  'proof_of_address',
  'proof_of_affordability',
  'certificate',
  'contract',
  'other',
] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export const DOCUMENT_SORT_COLUMNS = ['created_at', 'expires_at', 'name'] as const

/**
 * `expiring_30` is a subset of `expiring_90`; both mean "not yet expired". `valid`
 * is more than 90 days out, `no_expiry` has no date at all.
 */
export type DocumentExpiryState = 'expired' | 'expiring_30' | 'expiring_90' | 'valid' | 'no_expiry'

const DAY_MS = 24 * 60 * 60 * 1000

function toDate(value: string | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Whole days from `now` to `expiresAt`; negative once expired, `null` without a date. */
export function daysUntilExpiry(
  expiresAt: string | Date | null | undefined,
  now: Date = new Date(),
): number | null {
  const date = toDate(expiresAt)
  if (!date) return null
  return Math.floor((date.getTime() - now.getTime()) / DAY_MS)
}

export function classifyDocumentExpiry(
  expiresAt: string | Date | null | undefined,
  now: Date = new Date(),
): DocumentExpiryState {
  const days = daysUntilExpiry(expiresAt, now)
  if (days === null) return 'no_expiry'
  if (days < 0) return 'expired'
  if (days < 30) return 'expiring_30'
  if (days < 90) return 'expiring_90'
  return 'valid'
}

/** Whether a document falls inside an `?expiry=` filter, for client-side reuse. */
export function matchesExpiryFilter(
  expiresAt: string | Date | null | undefined,
  filter: DocumentExpiryFilter,
  now: Date = new Date(),
): boolean {
  if (filter === 'all') return true
  const state = classifyDocumentExpiry(expiresAt, now)
  if (filter === 'expiring_90') return state === 'expiring_30' || state === 'expiring_90'
  return state === filter
}

export const DOCUMENT_EXPIRY_LABELS: Record<DocumentExpiryState, string> = {
  expired: 'Expired',
  expiring_30: 'Expires within 30 days',
  expiring_90: 'Expires within 90 days',
  valid: 'Valid',
  no_expiry: 'No expiry',
}
