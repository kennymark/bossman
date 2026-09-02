/**
 * Shared shape for a destructive-action confirmation.
 *
 * Client-safe: pure string logic with no AdonisJS imports, so the confirmation dialog
 * can build the same phrase the server checks against. See `agent.md` — anything
 * `inertia/` imports must stay free of container-resolving services.
 */

/** Actions that require typed confirmation, and the phrase each one expects. */
export const CONFIRMATION_PHRASES = {
  'backup.restore': (target: string) => `restore ${target}`,
  'org.ban': (label: string) => `ban ${label}`,
  'org.request_delete_user': (label: string) => `delete ${label}`,
  'backup.delete': () => 'delete backup',
  'member.remove': (label: string) => `remove ${label}`,
  'org.bulk': (count: number | string) => `apply to ${count}`,
  'org.impersonate': (label: string) => `impersonate ${label}`,
  'org.feature_flags_reset': (label: string) => `reset ${label}`,
  'job.delete': (label: string) => `delete ${label}`,
} as const

/**
 * Normalises a typed confirmation before comparison.
 *
 * Case and surrounding whitespace are not the point — the operator having to type the
 * name of the thing they are about to destroy is.
 */
export function normaliseConfirmation(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, ' ') : ''
}

export function confirmationMatches(provided: unknown, expected: string): boolean {
  return normaliseConfirmation(provided) === normaliseConfirmation(expected)
}

/** The shortest reason we will accept, so "x" does not satisfy the audit trail. */
export const MIN_REASON_LENGTH = 8
export const MAX_REASON_LENGTH = 500

export function reasonIsValid(reason: unknown): reason is string {
  return (
    typeof reason === 'string' &&
    reason.trim().length >= MIN_REASON_LENGTH &&
    reason.trim().length <= MAX_REASON_LENGTH
  )
}
