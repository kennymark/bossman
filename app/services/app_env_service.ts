import type { AppEnv } from '#types/env'
import { effectiveProdAccessMode, type ProdModeMember } from '#utils/prod_access'

/**
 * Minimal shape of the fields that decide environment access. Declared structurally
 * (rather than importing the User model) so middleware can use this without pulling
 * the model — and therefore Lucid — into the middleware import graph.
 */
export interface EnvCapableUser {
  isGodAdmin: boolean
  enableProdAccess: boolean
  /**
   * When set, `enableProdAccess` stops counting after this instant. Accepts whatever
   * the caller has — a Luxon DateTime, a Date, or an ISO string — so this stays usable
   * from middleware without importing Lucid or Luxon.
   */
  prodAccessExpiresAt?: { toMillis(): number } | Date | string | null
  /** `read` may look at production but not change it. Missing counts as `write`. */
  prodAccessMode?: 'read' | 'write' | string | null
}

/** Millisecond timestamp for any of the shapes `prodAccessExpiresAt` may hold. */
function toMillis(value: EnvCapableUser['prodAccessExpiresAt']): number | null {
  if (value == null) return null
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  if (value instanceof Date) return value.getTime()
  if (typeof value.toMillis === 'function') return value.toMillis()
  return null
}

/**
 * Whether a production grant is still live.
 *
 * A grant with no expiry never expires — that is every grant made before expiry
 * existed. God admins are not subject to it.
 */
export function prodAccessExpired(
  user: EnvCapableUser | undefined | null,
  now: number = Date.now(),
): boolean {
  if (!user || user.isGodAdmin) return false
  const expiresAt = toMillis(user.prodAccessExpiresAt)
  return expiresAt !== null && expiresAt <= now
}

/** God admins may read prod; so may members holding an unexpired prod grant. */
export function canAccessProd(
  user: EnvCapableUser | undefined | null,
  now: number = Date.now(),
): boolean {
  if (!user) return false
  if (user.isGodAdmin) return true
  return Boolean(user.enableProdAccess) && !prodAccessExpired(user, now)
}

/**
 * Whether the user may *change* production, not merely read it.
 *
 * Requires a live grant first — a read-only mode on a lapsed grant is still no access.
 * God admins always may. For members the stricter of the user's and the team member's
 * mode applies, so either record can narrow the grant and neither can widen it.
 */
export function canWriteProd(
  user: EnvCapableUser | undefined | null,
  member?: ProdModeMember | null,
  now: number = Date.now(),
): boolean {
  if (!canAccessProd(user, now)) return false
  return effectiveProdAccessMode(user, member) === 'write'
}

/**
 * Only god admins may move between environments. Members granted prod access are
 * pinned to prod, and everyone else is pinned to dev.
 */
export function canSwitchEnv(user: EnvCapableUser | undefined | null): boolean {
  return Boolean(user?.isGodAdmin)
}

/**
 * The single authority on which database connection a request may use.
 *
 * `requested` is untrusted — it comes from the session, which the user can influence
 * via `PUT /api/v1/update-env`. It is only honoured for god admins; every other user
 * is pinned to the environment their record allows, so no request input can widen
 * access to production. An expired production grant falls back to dev.
 */
export function resolveAppEnv(
  user: EnvCapableUser | undefined | null,
  requested?: string | null,
  now: number = Date.now(),
): AppEnv {
  if (!user) return 'dev'
  if (canSwitchEnv(user)) return requested === 'prod' ? 'prod' : 'dev'
  return canAccessProd(user, now) ? 'prod' : 'dev'
}
